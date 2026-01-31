from fastapi import APIRouter
from pydantic import BaseModel

from app.services.embeddings import EmbeddingService
from app.services.vector_store import vector_store

router = APIRouter(prefix="/chat", tags=["Chat"])

embedding_service = EmbeddingService()


class ChatRequest(BaseModel):
    question: str
    top_k: int = 3


@router.post("/")
def chat(request: ChatRequest):
    query_embedding = embedding_service.embed_text(request.question)

    results = vector_store.search(
        query_embedding=query_embedding,
        top_k=request.top_k
    )

    return {
        "question": request.question,
        "matches": results
    }
