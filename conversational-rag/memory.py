from ollama import embeddings
import numpy as np


conversation_memory = []


def get_embedding(text):

    response = embeddings(
        model="nomic-embed-text",
        prompt=text
    )

    return response["embedding"]


def cosine_similarity(a, b):

    a = np.array(a)
    b = np.array(b)

    return np.dot(a, b) / (
        np.linalg.norm(a) * np.linalg.norm(b)
    )


def store_memory(
    user_message,
    assistant_message
):

    memory_text = f"""
    User: {user_message}

    Assistant: {assistant_message}
    """

    conversation_memory.append(
        memory_text
    )


def retrieve_memory(
    query,
    top_k=2
):

    query_embedding = get_embedding(query)

    scores = []

    for memory in conversation_memory:

        memory_embedding = get_embedding(
            memory
        )

        similarity = cosine_similarity(
            query_embedding,
            memory_embedding
        )

        scores.append(
            (memory, similarity)
        )

    scores.sort(
        key=lambda x: x[1],
        reverse=True
    )

    return scores[:top_k]


def get_recent_history(
    chat_history,
    max_chars=1000
):

    selected = []

    total_chars = 0

    for role, message in reversed(
        chat_history
    ):

        message_size = len(message)

        if (
            total_chars + message_size
            > max_chars
        ):
            break

        selected.append(
            (role, message)
        )

        total_chars += message_size

    selected.reverse()

    return selected