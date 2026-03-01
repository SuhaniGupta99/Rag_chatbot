from sentence_transformers import CrossEncoder


class RerankerService:
    def __init__(self):
        # Strong but lightweight reranker
        self.model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

    def rerank(self, query: str, documents: list):
        """
        documents: list of dicts with keys ['text', 'source', 'score']
        """

        if not documents:
            return documents

        # Create (query, document) pairs
        pairs = [(query, doc["text"]) for doc in documents]

        # Get relevance scores
        scores = self.model.predict(pairs)

        # Attach rerank scores
        for doc, score in zip(documents, scores):
            doc["rerank_score"] = float(score)

        # Sort by rerank score (descending)
        documents.sort(key=lambda x: x["rerank_score"], reverse=True)

        return documents