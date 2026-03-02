from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import re
import uuid

from app.services.embeddings import EmbeddingService
from app.services.vector_store import vector_store
from app.services.llm import LLMService
from app.services.reranker import RerankerService

router = APIRouter()

# =====================================================
# 🔹 Conversation Store (History + Summary)
# =====================================================
conversation_memory = {}
MAX_HISTORY_TURNS = 4
SUMMARY_UPDATE_INTERVAL = 3  # update summary every 3 turns


class ChatRequest(BaseModel):
    question: str
    top_k: int = 3
    session_id: str | None = None


# =====================================================
# 🔹 FULL Advanced Query Normalization (UNCHANGED)
# =====================================================
def normalize_query(question: str) -> str:
    q = question.lower()

    # Word count constraints
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
        r"briefly explain",
        r"explain briefly",
        r"explain in detail",
        r"explain in depth",
        r"detailed explanation on",
        r"detailed explanation of",
        r"detailed explanation",
        r"provide a detailed explanation",
        r"give a detailed explanation",
        r"describe in detail",
        r"describe briefly",
        r"describe in depth",
        r"discuss in detail",
        r"discuss briefly",
        r"discuss",
        r"elaborate on",
        r"write a short note on",
        r"give a short note on",
        r"write a note on",
        r"write about",
        r"summarize in detail",
        r"summarize briefly",
        r"summarize",
        r"explain clearly",
        r"in simple terms",
        r"in simple language",
        r"in easy words",
        r"in simple words",
        r"step by step",
        r"with examples",
        r"along with examples",
        r"with a diagram",
        r"compare and contrast",
        r"differentiate between",
        r"what do you mean by",
        r"define",
    ]

    for pattern in instruction_patterns:
        q = re.sub(pattern, "", q)

    # Filler
    q = re.sub(r"please", "", q)
    q = re.sub(r"kindly", "", q)
    q = re.sub(r"tell me", "", q)
    q = re.sub(r"i want to know", "", q)
    q = re.sub(r"can you", "", q)
    q = re.sub(r"could you", "", q)

    # Remove punctuation
    q = re.sub(r"[^\w\s]", "", q)
    q = re.sub(r"\s+", " ", q)

    return q.strip()


# =====================================================
# 🔹 Keyword Overlap Scoring
# =====================================================
def keyword_overlap_score(query: str, text: str) -> float:
    query_words = set(query.lower().split())
    text_words = set(text.lower().split())

    if not query_words:
        return 0.0

    overlap = query_words.intersection(text_words)
    return len(overlap) / len(query_words)


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
        print("STEP 1: Chat request received")

        embedding_service = EmbeddingService()
        llm_service = LLMService()
        reranker = RerankerService()

        # =====================================================
        # 🔹 Session Handling
        # =====================================================
        session_id = request.session_id or str(uuid.uuid4())

        if session_id not in conversation_memory:
            conversation_memory[session_id] = {
                "history": [],
                "summary": ""
            }

        session = conversation_memory[session_id]
        history = session["history"]
        summary = session["summary"]

        # =====================================================
        # 🔹 Normalize Query
        # =====================================================
        normalized_question = normalize_query(request.question)
        print("Normalized query:", normalized_question)

        # =====================================================
        # 🔥 MEMORY-AWARE RETRIEVAL USING SUMMARY
        # =====================================================
        retrieval_query = (summary + " " + normalized_question).strip()
        print("Retrieval query:", retrieval_query)

        query_embedding = embedding_service.embed_query(retrieval_query)

        print("FAISS index size:", vector_store.index.ntotal)

        # =====================================================
        # 🔹 Dense Retrieval
        # =====================================================
        initial_matches = vector_store.search(query_embedding, top_k=8)

        if not initial_matches:
            general_answer = llm_service.generate_answer(
                question=request.question,
                context=""
            )

            return {
                "session_id": session_id,
                "question": request.question,
                "answer": (
                    "No such information is present in the uploaded documents. "
                    "However, based on general knowledge:\n\n"
                    + general_answer
                ),
                "sources": []
            }

        # =====================================================
        # 🔹 Hybrid Scoring
        # =====================================================
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

        initial_matches.sort(
            key=lambda x: x["hybrid_score"],
            reverse=True
        )

        # =====================================================
        # 🔹 Reranking
        # =====================================================
        reranked_matches = reranker.rerank(
            normalized_question,
            initial_matches
        )

        matches = reranked_matches[:request.top_k]

        # =====================================================
        # 🔹 Confidence Threshold
        # =====================================================
        SIMILARITY_THRESHOLD = 1.2
        best_score = matches[0]["score"]

        print("Best FAISS score:", best_score)
        print("Best hybrid score:", matches[0]["hybrid_score"])

        if best_score > SIMILARITY_THRESHOLD:
            general_answer = llm_service.generate_answer(
                question=request.question,
                context=""
            )

            return {
                "session_id": session_id,
                "question": request.question,
                "answer": (
                    "No such information is present in the uploaded documents. "
                    "However, based on general knowledge:\n\n"
                    + general_answer
                ),
                "sources": []
            }

        # =====================================================
        # 🔹 Build Context
        # =====================================================
        context = "\n\n".join(m["text"] for m in matches)
        context = context[:2000]

        # =====================================================
        # 🔹 Inject Summary + Recent Turns
        # =====================================================
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

If the context does not contain relevant information,
say it is not present in the uploaded documents.
Otherwise answer clearly and concisely.
"""

        answer = llm_service.generate_answer(
            question=request.question,
            context=full_prompt
        )

        # =====================================================
        # 🔹 Store Conversation
        # =====================================================
        history.append({
            "user": request.question,
            "assistant": answer
        })

        # keep only recent turns
        history[:] = history[-MAX_HISTORY_TURNS:]

        # =====================================================
        # 🔹 Periodically Update Summary
        # =====================================================
        if len(history) % SUMMARY_UPDATE_INTERVAL == 0:
            update_summary(session_id, llm_service)

        return {
            "session_id": session_id,
            "question": request.question,
            "answer": answer,
            "summary": session["summary"],
            "sources": [
                {
                    "source": m["source"],
                    "faiss_score": m["score"],
                    "keyword_score": m["keyword_score"],
                    "hybrid_score": m["hybrid_score"],
                    "rerank_score": m.get("rerank_score"),
                }
                for m in matches
            ],
        }

    except Exception as e:
        print("🔥 CHAT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))