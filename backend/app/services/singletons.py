from app.services.embeddings import EmbeddingService
from app.services.vector_store import FaissVectorStore
from app.services.llm import LLMService

# Load ONCE
embedding_service = EmbeddingService()
vector_store = FaissVectorStore(dim=384)
llm_service = LLMService(
    model="inyllama"
)


