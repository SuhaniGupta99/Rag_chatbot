from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# 🔥 IMPORT SINGLETONS (VERY IMPORTANT)
from app.services.singletons import (
    embedding_service,
    vector_store,
    llm_service
)

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    top_k: int = 3


@router.post("/chat")
def chat(request: ChatRequest):
    try:
        print("\n==============================")
        print("STEP 1: Chat request received")
        print("Question:", request.question)

        # STEP 2: Generate query embedding (FAST now)
        query_embedding = embedding_service.embed_query(request.question)
        print("STEP 2: Query embedding generated | dim =", len(query_embedding))

        # STEP 3: FAISS search
        matches = vector_store.search(query_embedding, request.top_k)
        print("STEP 3: FAISS search completed | matches =", len(matches))

        if not matches:
            print("STEP 4: No matches found")
            return {
                "question": request.question,
                "answer": "No relevant information found.",
                "sources": []
            }

        # STEP 4: Build context (LIMIT SIZE ⚠️)
        context_chunks = []
        for m in matches:
            if "text" in m:
                context_chunks.append(m["text"][:300])  # HARD LIMIT

        context = "\n\n".join(context_chunks)
        print("STEP 4: Context built | length =", len(context))

        # STEP 5: LLM generation (ONLY SLOW STEP)
        print("STEP 5: Sending prompt to LLaMA3 via Ollama...")
        answer = llm_service.generate_answer(
            question=request.question,
            context=context
        )

        print("STEP 6: LLM response generated")
        print("==============================\n")

        return {
            "question": request.question,
            "answer": answer,
            "sources": list(set(m.get("source", "unknown") for m in matches))
        }

    except Exception as e:
        print("🔥 CHAT ENDPOINT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))
