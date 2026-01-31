from sentence_transformers import SentenceTransformer

# Load once (important for performance)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Convert text chunks into vector embeddings
    """
    embeddings = embedding_model.encode(texts, convert_to_numpy=True)
    return embeddings
