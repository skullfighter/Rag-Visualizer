from dense_retriever import retrieve_dense
from sparse_retriever import retrieve_bm25


def normalize_scores(results):

    if not results:
        return results

    scores = [score for _, score in results]

    min_score = min(scores)
    max_score = max(scores)

    normalized = []

    for doc, score in results:

        if max_score == min_score:
            normalized_score = 1

        else:
            normalized_score = (
                (score - min_score) /
                (max_score - min_score)
            )

        normalized.append(
            (doc, normalized_score)
        )

    return normalized


def hybrid_retrieve(
    query,
    top_k=5,
    dense_weight=0.5,
    sparse_weight=0.5
):

    dense_results = retrieve_dense(
        query,
        top_k=top_k
    )

    sparse_results = retrieve_bm25(
        query,
        top_k=top_k
    )

    dense_results = normalize_scores(
        dense_results
    )

    sparse_results = normalize_scores(
        sparse_results
    )

    combined = {}

    for doc, score in dense_results:

        combined[doc] = {
            "dense_score": score,
            "sparse_score": 0
        }

    for doc, score in sparse_results:

        if doc not in combined:

            combined[doc] = {
                "dense_score": 0,
                "sparse_score": score
            }

        else:

            combined[doc]["sparse_score"] = score

    final_results = []

    for doc, scores in combined.items():

        final_score = (
            dense_weight *
            scores["dense_score"]
        ) + (
            sparse_weight *
            scores["sparse_score"]
        )

        final_results.append(
            (doc, final_score)
        )

    final_results.sort(
        key=lambda x: x[1],
        reverse=True
    )

    return final_results[:top_k]


    