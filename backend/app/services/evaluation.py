import math


# =====================================================
# 🔹 Utility: Cosine Similarity
# (Assumes embeddings are already normalized)
# =====================================================
def cosine_similarity(vec1, vec2):
    return sum(a * b for a, b in zip(vec1, vec2))


# =====================================================
# 🔹 Context Relevance
# Measures how relevant retrieved chunks are
# =====================================================
def compute_context_relevance(matches):
    if not matches:
        return 0.0

    scores = [m.get("hybrid_score", 0) for m in matches]
    avg_score = sum(scores) / len(scores)

    return round(max(0, min(avg_score, 1)), 3)


# =====================================================
# 🔹 Faithfulness (Groundedness)
# Is answer semantically aligned with context?
# =====================================================
def compute_faithfulness(answer_embedding, context_embedding):
    similarity = cosine_similarity(answer_embedding, context_embedding)

    # clamp to [0,1]
    similarity = max(0, min(similarity, 1))

    return round(similarity, 3)


# =====================================================
# 🔹 Answer Relevance
# Does the answer address the question?
# =====================================================
def compute_answer_relevance(question_embedding, answer_embedding):
    similarity = cosine_similarity(question_embedding, answer_embedding)

    similarity = max(0, min(similarity, 1))

    return round(similarity, 3)


# =====================================================
# 🔥 Retrieval-Gated Composite RAG Quality Score
# Retrieval confidence acts as a gating factor.
# If retrieval is weak, overall RAG score drops.
# =====================================================
def compute_rag_quality(
    retrieval_confidence,
    context_relevance,
    faithfulness,
    answer_relevance
):
    # Content quality independent of retrieval strength
    content_score = (
        0.4 * faithfulness +
        0.3 * answer_relevance +
        0.3 * context_relevance
    )

    # Retrieval acts as multiplier (gating factor)
    final_score = retrieval_confidence * content_score

    return round(max(0, min(final_score, 1)), 3)