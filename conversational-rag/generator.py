from ollama import chat


SYSTEM_PROMPT = """
You are a helpful assistant. Answer the user's question using the provided context.

Guidelines:
- Base your answer on the context below.
- Synthesize information across multiple context chunks if needed.
- Be clear and concise.
- If the context genuinely does not contain relevant information, say so briefly.
"""


def generate_answer(
    query,
    retrieved_docs
):

    context = "\n\n".join(
        retrieved_docs
    )

    prompt = f"""
Context:
{context}

Question:
{query}
"""

    response = chat(
        model="llama3",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response[
        "message"
    ]["content"]


def generate_answer_stream(
    query,
    retrieved_docs
):
    """Yield tokens one at a time for streaming responses."""
    context = "\n\n".join(
        retrieved_docs
    )

    prompt = f"""
Context:
{context}

Question:
{query}
"""

    stream = chat(
        model="llama3",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        stream=True
    )

    for chunk in stream:
        token = chunk["message"]["content"]
        if token:
            yield token