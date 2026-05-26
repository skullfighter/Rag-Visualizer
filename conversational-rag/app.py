from vector_store import (
    build_vector_store
)

from sparse_retriever import (
    build_bm25_index
)

from rewriter import rewrite_query

from memory import (
    store_memory,
    retrieve_memory,
    get_recent_history
)

from hybrid_retriever import (
    hybrid_retrieve
)

from reranker import (
    rerank_documents
)

from generator import (
    generate_answer
)


chat_history = []


build_vector_store()

build_bm25_index()


while True:

    user_query = input(
        "\nUSER: "
    )

    if user_query.lower() == "exit":
        break

    # -----------------------------
    # RECENT HISTORY
    # -----------------------------

    recent_history = get_recent_history(
        chat_history,
        max_chars=500
    )

    # -----------------------------
    # INITIAL REWRITE
    # -----------------------------

    rewritten_query = rewrite_query(
        recent_history,
        user_query
    )

    print("\nREWRITTEN QUERY:")
    print(rewritten_query)

    # -----------------------------
    # MEMORY RETRIEVAL
    # -----------------------------

    memories = retrieve_memory(
        rewritten_query
    )

    memory_context = []

    for mem, score in memories:

        memory_context.append(
            ("memory", mem)
        )

    combined_history = (
        recent_history +
        memory_context
    )

    # -----------------------------
    # FINAL REWRITE
    # -----------------------------

    final_query = rewrite_query(
        combined_history,
        user_query
    )

    print("\nFINAL QUERY:")
    print(final_query)

    # -----------------------------
    # HYBRID RETRIEVAL
    # -----------------------------

    retrieved_docs = hybrid_retrieve(
        final_query,
        top_k=5
    )

    print("\nHYBRID RESULTS:")

    for doc, score in retrieved_docs:

        print(score)
        print(doc)

    # -----------------------------
    # RERANKING
    # -----------------------------

    reranked_docs = rerank_documents(
        final_query,
        retrieved_docs,
        top_k=3
    )

    print("\nRERANKED RESULTS:")

    context_docs = []

    for doc, score in reranked_docs:

        print(score)
        print(doc)

        context_docs.append(doc)

    # -----------------------------
    # GENERATION
    # -----------------------------

    answer = generate_answer(
        final_query,
        context_docs
    )

    print("\nASSISTANT:")
    print(answer)

    # -----------------------------
    # MEMORY STORAGE
    # -----------------------------

    chat_history.append(
        ("user", user_query)
    )

    chat_history.append(
        ("assistant", answer)
    )

    store_memory(
        user_query,
        answer
    )

    