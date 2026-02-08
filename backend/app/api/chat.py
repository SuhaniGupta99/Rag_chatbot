from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.embeddings import EmbeddingService
from app.services.vector_store import vector_store
from app.services.llm import LLMService

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
        print("STEP 2: Services ready")

        query_embedding = embedding_service.embed_query(request.question)
        print("STEP 3: Query embedding length:", len(query_embedding))

        print("STEP 4: FAISS index size:", vector_store.index.ntotal)

        matches = vector_store.search(query_embedding, request.top_k)
        print("STEP 5: FAISS matches:", matches)

        if not matches:
            return {
                "question": request.question,
                "answer": "No relevant information found.",
                "sources": []
            }

        # 🔹 Build context
        context = "\n\n".join(m["text"] for m in matches)
        print("STEP 6: Context length (before trim):", len(context))

        # 🚀 CRITICAL SPEED FIX
        MAX_CONTEXT_CHARS = 2000
        context = context[:MAX_CONTEXT_CHARS]
        print("STEP 6.1: Context length (after trim):", len(context))

        print("STEP 7: Sending prompt to LLM...")

        answer = llm_service.generate_answer(
            question=request.question,
            context=context
        )

        print("STEP 8: LLM response received")

        return {
            "question": request.question,
            "answer": answer,
            "sources": list(set(m["source"] for m in matches))
        }

    except Exception as e:
        print("🔥 CHAT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))
