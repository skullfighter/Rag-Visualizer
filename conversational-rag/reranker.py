from sentence_transformers import CrossEncoder


reranker_model = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L-6-v2"
)


def rerank_documents(
    query,
    documents,
    top_k=3
):

    pairs = []

    for doc, score in documents:

        pairs.append(
            [query, doc]
        )

    scores = reranker_model.predict(
        pairs
    )

    reranked = []

    for (doc, _), score in zip(
        documents,
        scores
    ):

        reranked.append(
            (doc, score)
        )

    reranked.sort(
        key=lambda x: x[1],
        reverse=True
    )

    return reranked[:top_k]