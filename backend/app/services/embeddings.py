from sentence_transformers import SentenceTransformer


class EmbeddingService:
    def __init__(self):
        """
        Using BGE Base v1.5 — much stronger than MiniLM
        for technical and semantic retrieval tasks.
        """
        self.model = SentenceTransformer("BAAI/bge-base-en-v1.5")

    def embed_documents(self, texts):
        """
        BGE models require instruction prefix for optimal retrieval.
        """
        formatted_texts = [
            "Represent this document for retrieval: " + t
            for t in texts
        ]

        embeddings = self.model.encode(
            formatted_texts,
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        return embeddings.tolist()

    def embed_query(self, text):
        """
        Format query properly for BGE retrieval.
        """
        formatted_query = "Represent this query for retrieval: " + text

        embedding = self.model.encode(
            [formatted_query],
            convert_to_numpy=True,
            normalize_embeddings=True
        )[0]

        return embedding.tolist()