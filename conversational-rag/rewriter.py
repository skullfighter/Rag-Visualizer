from ollama import chat


SYSTEM_PROMPT = """
You are a retrieval query rewriting system.

Convert conversational user questions
into standalone retrieval-friendly queries.

Rules:
- Preserve meaning
- Resolve references
- Keep technical terminology
- Do not answer
- Output only rewritten query
"""


def format_history(history):

    lines = []

    for role, message in history:

        lines.append(
            f"{role}: {message}"
        )

    return "\n".join(lines)


def rewrite_query(
    history,
    current_query
):

    history_text = format_history(
        history
    )

    prompt = f"""
Conversation History:
{history_text}

Current Query:
{current_query}

Rewrite into standalone query.
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

    rewritten = response[
        "message"
    ]["content"].strip()

    return rewritten