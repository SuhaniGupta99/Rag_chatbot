from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.embeddings import EmbeddingService
from app.services.vector_store import vector_store
from app.services.llm import LLMService
from app.services.reranker import RerankerService

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    top_k: int = 3


@router.post("/chat")
def chat(request: ChatRequest):
    try:
        print("STEP 1: Chat request received")

        embedding_service = EmbeddingService()
        llm_service = LLMService()
        reranker = RerankerService()

        # 🔹 Embed query
        query_embedding = embedding_service.embed_query(request.question)

        print("STEP 2: FAISS index size:", vector_store.index.ntotal)

        # 🔹 Retrieve more candidates initially
        initial_matches = vector_store.search(query_embedding, top_k=8)

        if not initial_matches:
            print("No matches found in FAISS")

            # Fallback to general knowledge
            general_answer = llm_service.generate_answer(
                question=request.question,
                context=""
            )

            return {
                "question": request.question,
                "answer": (
                    "No such information is present in the uploaded documents. "
                    "However, based on general knowledge:\n\n"
                    + general_answer
                ),
                "sources": []
            }

        # 🔹 Rerank results
        reranked_matches = reranker.rerank(
            request.question,
            initial_matches
        )

        # Keep best top_k after reranking
        matches = reranked_matches[:request.top_k]

        # 🔎 Similarity threshold check
        SIMILARITY_THRESHOLD = 0.8  # Adjust if needed

        best_score = matches[0]["score"]
        print("Best similarity score (FAISS):", best_score)

        if best_score > SIMILARITY_THRESHOLD:
            print("Weak retrieval detected → Falling back to general knowledge")

            general_answer = llm_service.generate_answer(
                question=request.question,
                context=""
            )

            return {
                "question": request.question,
                "answer": (
                    "No such information is present in the uploaded documents. "
                    "However, based on general knowledge:\n\n"
                    + general_answer
                ),
                "sources": []
            }

        # 🔹 Build context from reranked matches
        context = "\n\n".join(m["text"] for m in matches)

        MAX_CONTEXT_CHARS = 2000
        context = context[:MAX_CONTEXT_CHARS]

        print("Sending context to LLM. Context length:", len(context))

        # 🔹 Generate final answer
        answer = llm_service.generate_answer(
            question=request.question,
            context=context
        )

        return {
            "question": request.question,
            "answer": answer,
            "sources": [
                {
                    "source": m["source"],
                    "faiss_score": m["score"],
                    "rerank_score": m.get("rerank_score")
                }
                for m in matches
            ]
        }

    except Exception as e:
        print("🔥 CHAT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))