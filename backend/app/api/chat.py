from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import re
import uuid
import math
import json

from app.services.embeddings import EmbeddingService
from app.services.vector_store import vector_store
from app.services.llm import LLMService
from app.services.reranker import RerankerService

from app.services.evaluation import (
    compute_context_relevance,
    compute_faithfulness,
    compute_answer_relevance,
    compute_rag_quality
)

router = APIRouter()

# =====================================================
# 🔹 Conversation Store (History + Summary)
# =====================================================
conversation_memory = {}
MAX_HISTORY_TURNS = 4
SUMMARY_UPDATE_INTERVAL = 3


class ChatRequest(BaseModel):
    question: str
    top_k: int = 3
    session_id: str | None = None


# =====================================================
# 🔹 FULL Advanced Query Normalization
# =====================================================
def normalize_query(question: str) -> str:
    q = question.lower()

    q = re.sub(r"(in|within)\s+\d+\s+words?", "", q)
    q = re.sub(r"in\s+not\s+more\s+than\s+\d+\s+words?", "", q)
    q = re.sub(r"in\s+less\s+than\s+\d+\s+words?", "", q)
    q = re.sub(r"in\s+more\s+than\s+\d+\s+words?", "", q)
    q = re.sub(r"in\s+about\s+\d+\s+words?", "", q)
    q = re.sub(r"in\s+approximately\s+\d+\s+words?", "", q)
    q = re.sub(r"(minimum|max(?:imum)?)\s+\d+\s+words?", "", q)
    q = re.sub(r"at\s+(least|most)\s+\d+\s+words?", "", q)
    q = re.sub(r"\d+\s*-\s*\d+\s*words?", "", q)

    instruction_patterns = [
        r"briefly explain", r"explain briefly",
        r"explain in detail", r"explain in depth",
        r"detailed explanation on", r"detailed explanation of",
        r"detailed explanation", r"provide a detailed explanation",
        r"give a detailed explanation",
        r"describe in detail", r"describe briefly",
        r"describe in depth", r"discuss in detail",
        r"discuss briefly", r"discuss",
        r"elaborate on", r"write a short note on",
        r"give a short note on", r"write a note on",
        r"write about", r"summarize in detail",
        r"summarize briefly", r"summarize",
        r"explain clearly", r"in simple terms",
        r"in simple language", r"in easy words",
        r"in simple words", r"step by step",
        r"with examples", r"along with examples",
        r"with a diagram", r"compare and contrast",
        r"differentiate between",
        r"what do you mean by", r"define",
    ]

    for pattern in instruction_patterns:
        q = re.sub(pattern, "", q)

    q = re.sub(r"please", "", q)
    q = re.sub(r"kindly", "", q)
    q = re.sub(r"tell me", "", q)
    q = re.sub(r"i want to know", "", q)
    q = re.sub(r"can you", "", q)
    q = re.sub(r"could you", "", q)

    q = re.sub(r"[^\w\s]", "", q)
    q = re.sub(r"\s+", " ", q)

    return q.strip()


# =====================================================
# 🔹 Keyword Overlap
# =====================================================
def keyword_overlap_score(query: str, text: str) -> float:
    query_words = set(query.lower().split())
    text_words = set(text.lower().split())

    if not query_words:
        return 0.0

    overlap = query_words.intersection(text_words)
    return len(overlap) / len(query_words)


# =====================================================
# 🔹 Retrieval Confidence
# =====================================================
def compute_retrieval_confidence(matches):
    if not matches:
        return 0.0

    top = matches[0]

    faiss_distance = top.get("score", 0)
    faiss_similarity = 1 / (1 + faiss_distance)

    hybrid_score = top.get("hybrid_score", 0)

    rerank_score = top.get("rerank_score", 0)
    rerank_soft = 1 / (1 + math.exp(-rerank_score))

    if len(matches) > 1:
        separation = matches[0]["hybrid_score"] - matches[1]["hybrid_score"]
        separation_score = max(0, min(separation, 1))
    else:
        separation_score = 0.5

    confidence = (
        0.4 * faiss_similarity +
        0.3 * hybrid_score +
        0.2 * rerank_soft +
        0.1 * separation_score
    )

    return round(max(0, min(confidence, 1)), 3)


# =====================================================
# 🔹 Conversation Summarization
# =====================================================
def update_summary(session_id, llm_service):
    session = conversation_memory[session_id]
    history = session["history"]

    history_text = ""
    for turn in history:
        history_text += f"User: {turn['user']}\n"
        history_text += f"Assistant: {turn['assistant']}\n"

    prompt = f"""
Summarize the following conversation concisely.
Focus only on key topics and user intent.

Conversation:
{history_text}
"""

    summary = llm_service.generate_answer(
        question="Summarize conversation",
        context=prompt
    )

    session["summary"] = summary


@router.post("/chat")
def chat(request: ChatRequest):
    try:
        embedding_service = EmbeddingService()
        llm_service = LLMService()
        reranker = RerankerService()

        session_id = request.session_id or str(uuid.uuid4())

        if session_id not in conversation_memory:
            conversation_memory[session_id] = {
                "history": [],
                "summary": ""
            }

        session = conversation_memory[session_id]
        history = session["history"]
        summary = session["summary"]

        normalized_question = normalize_query(request.question)

        retrieval_query = (summary + " " + normalized_question).strip()
        query_embedding = embedding_service.embed_query(retrieval_query)

        initial_matches = vector_store.search(query_embedding, top_k=8)

        if not initial_matches:
            return {"message": "No relevant documents found."}

        for match in initial_matches:
            keyword_score = keyword_overlap_score(
                normalized_question,
                match["text"]
            )
            match["keyword_score"] = keyword_score

            faiss_similarity = 1 / (1 + match["score"])
            match["hybrid_score"] = (
                0.7 * faiss_similarity +
                0.3 * keyword_score
            )

        initial_matches.sort(key=lambda x: x["hybrid_score"], reverse=True)

        reranked_matches = reranker.rerank(
            normalized_question,
            initial_matches
        )

        matches = reranked_matches[:request.top_k]

        retrieval_confidence = compute_retrieval_confidence(matches)

        context = "\n\n".join(m["text"] for m in matches)
        context = context[:2000]

        recent_history = ""
        for turn in history[-MAX_HISTORY_TURNS:]:
            recent_history += f"User: {turn['user']}\n"
            recent_history += f"Assistant: {turn['assistant']}\n"

        full_prompt = f"""
You are a knowledgeable assistant.

Conversation Summary:
{summary}

Recent Conversation:
{recent_history}

Context from uploaded documents:
{context}

Current Question:
{request.question}

Answer clearly and concisely.
"""

        # =========================================
        # 🔥 STREAMING GENERATOR
        # =========================================
        def token_stream():
            full_answer = ""

            for token in llm_service.stream_answer(
                question=request.question,
                context=full_prompt
            ):
                full_answer += token
                yield token

            # ===============================
            # 🔥 RAG Evaluation Metrics
            # ===============================
            answer_embedding = embedding_service.embed_query(full_answer)
            context_embedding = embedding_service.embed_query(context)
            question_embedding = embedding_service.embed_query(normalized_question)

            context_relevance = compute_context_relevance(matches)

            faithfulness = compute_faithfulness(
                answer_embedding,
                context_embedding
            )

            answer_relevance = compute_answer_relevance(
                question_embedding,
                answer_embedding
            )

            rag_quality_score = compute_rag_quality(
                retrieval_confidence,
                context_relevance,
                faithfulness,
                answer_relevance
            )

            history.append({
                "user": request.question,
                "assistant": full_answer
            })

            history[:] = history[-MAX_HISTORY_TURNS:]

            if len(history) % SUMMARY_UPDATE_INTERVAL == 0:
                update_summary(session_id, llm_service)

            yield "\n\n---METRICS---\n"
            yield json.dumps({
                "retrieval_confidence": retrieval_confidence,
                "context_relevance": context_relevance,
                "faithfulness": faithfulness,
                "answer_relevance": answer_relevance,
                "rag_quality_score": rag_quality_score
            })

        return StreamingResponse(token_stream(), media_type="text/plain")

    except Exception as e:
        print("🔥 CHAT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))