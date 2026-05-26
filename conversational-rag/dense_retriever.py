import numpy as np

from vector_store import (
    documents,
    document_embeddings,
    get_embedding
)


def cosine_similarity(a, b):

    a = np.array(a)
    b = np.array(b)

    return np.dot(a, b) / (
        np.linalg.norm(a) * np.linalg.norm(b)
    )


def retrieve_dense(query, top_k=3):

    if not documents:
        return []

    query_embedding = get_embedding(query)

    scores = []

    for doc, embedding in zip(
        documents,
        document_embeddings
    ):

        similarity = cosine_similarity(
            query_embedding,
            embedding
        )

        scores.append(
            (doc, similarity)
        )

    scores.sort(
        key=lambda x: x[1],
        reverse=True
    )

    return scores[:top_k]