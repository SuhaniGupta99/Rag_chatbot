from app.services.embeddings import EmbeddingService
from app.services.vector_store import FaissVectorStore

# Load ONCE
embedding_service = EmbeddingService()
vector_store = FaissVectorStore(dim=384)

