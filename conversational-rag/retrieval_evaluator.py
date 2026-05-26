from eval_dataset import evaluation_data
from hybrid_retriever import hybrid_retrieve
from sparse_retriever import build_bm25_index
from vector_store import build_vector_store


def evaluate_recall_at_k(k=3):
    correct = 0
    total = len(evaluation_data)

    for item in evaluation_data:
        query = item["query"]
        expected_doc = item["expected_doc"]
        results = hybrid_retrieve(query, top_k=k)
        retrieved_docs = [doc for doc, _ in results]

        if expected_doc in retrieved_docs:
            correct += 1
            print("\nSUCCESS")
            print("QUERY:", query)
        else:
            print("\nFAILURE")
            print("QUERY:", query)
            print("\nEXPECTED:")
            print(expected_doc)
            print("\nRETRIEVED:")
            for doc in retrieved_docs:
                print(doc)

    recall = correct / total
    print("\n" + "=" * 50)
    print(f"Recall@{k}: {recall:.2f}")
    print("=" * 50)


def evaluate_mrr(k=5):
    reciprocal_ranks = []

    for item in evaluation_data:
        query = item["query"]
        expected_doc = item["expected_doc"]
        results = hybrid_retrieve(query, top_k=k)
        retrieved_docs = [doc for doc, _ in results]

        rank = None
        for idx, doc in enumerate(retrieved_docs, start=1):
            if doc == expected_doc:
                rank = idx
                break

        reciprocal_rank = 1 / rank if rank is not None else 0
        reciprocal_ranks.append(reciprocal_rank)

        print("\nQUERY:", query)
        print("RANK:", rank)
        print("RECIPROCAL RANK:", reciprocal_rank)

    mrr = sum(reciprocal_ranks) / len(reciprocal_ranks)
    print("\n" + "=" * 50)
    print(f"MRR@{k}: {mrr:.2f}")
    print("=" * 50)


if __name__ == "__main__":
    build_vector_store()
    build_bm25_index()
    evaluate_recall_at_k(k=3)
    evaluate_mrr(k=5)
