from rank_bm25 import BM25Okapi
from vector_store import documents   # shared with dense retriever


tokenized_documents: list[list[str]] = []
bm25: BM25Okapi | None = None


def tokenize(text: str) -> list[str]:
    return text.lower().split()


def build_bm25_index() -> None:
    """Build BM25 index over the documents already loaded by vector_store."""
    global tokenized_documents, bm25

    if not documents:
        print("BM25 index skipped — no documents loaded yet.")
        bm25 = None
        tokenized_documents = []
        return

    tokenized_documents = [tokenize(doc) for doc in documents]
    bm25 = BM25Okapi(tokenized_documents)
    print(f"BM25 index built over {len(documents)} chunks.")


def retrieve_bm25(query: str, top_k: int = 3) -> list[tuple[str, float]]:
    if bm25 is None or not documents:
        return []

    tokenized_query = tokenize(query)
    scores = bm25.get_scores(tokenized_query)

    doc_scores = list(zip(documents, scores))
    doc_scores.sort(key=lambda x: x[1], reverse=True)
    return doc_scores[:top_k]
