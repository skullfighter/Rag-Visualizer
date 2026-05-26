"""
FastAPI backend for the RAG Visualizer.
Wraps the existing conversational RAG pipeline and streams
Server-Sent Events so the Next.js frontend can animate each stage.

Run with:
    uvicorn api:app --reload --port 8000
"""

import json
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from vector_store import (
    build_vector_store, get_source, add_pdf_stream,
    list_indexed_files, DOCUMENTS_DIR,
)
from sparse_retriever import build_bm25_index
from rewriter import rewrite_query
from memory import store_memory, retrieve_memory, get_recent_history
from hybrid_retriever import hybrid_retrieve
from reranker import rerank_documents
from generator import generate_answer_stream


# ── Startup ───────────────────────────────────────────────────────────
print("Building vector store and BM25 index…")
build_vector_store()
build_bm25_index()
print("Ready.")

# ── State (in-memory per process) ─────────────────────────────────────
chat_history: list[tuple[str, str]] = []

# ── App ───────────────────────────────────────────────────────────────
app = FastAPI(title="RAG Visualizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str


def sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def normalize(scores: list[float]) -> list[float]:
    """Min-max normalize a list of floats to [0, 1]."""
    lo, hi = min(scores), max(scores)
    if hi == lo:
        return [1.0] * len(scores)
    return [(s - lo) / (hi - lo) for s in scores]


@app.post("/query")
def query_endpoint(request: QueryRequest):
    """
    Runs the full RAG pipeline and streams SSE events for each stage.
    The frontend animates each node as events arrive.
    """

    def event_stream():
        global chat_history
        query = request.query

        # ── 1. Query received ─────────────────────────────────────────
        yield sse({"type": "QUERY_RECEIVED", "query": query})

        # ── 2. Query rewriting ────────────────────────────────────────
        yield sse({"type": "QUERY_REWRITING"})

        recent_history = get_recent_history(chat_history, max_chars=500)
        rewritten = rewrite_query(recent_history, query)

        memories = retrieve_memory(rewritten)
        memory_context = [("memory", mem) for mem, _ in memories]
        combined_history = recent_history + memory_context

        final_query = rewrite_query(combined_history, query)

        # ── 3. Retrieval (includes dense embedding internally) ────────
        yield sse({"type": "RETRIEVAL_STARTED", "rewritten_query": final_query})

        retrieved_docs = hybrid_retrieve(final_query, top_k=5)

        retrieval_scores = [float(score) for _, score in retrieved_docs]
        retrieval_norm = normalize(retrieval_scores) if retrieval_scores else []

        chunks = [
            {
                "id": str(i),
                "text": doc,
                "source": get_source(doc),
                "score": round(retrieval_norm[i], 3),
            }
            for i, (doc, _) in enumerate(retrieved_docs)
        ]

        # ── 4. Chunks retrieved ───────────────────────────────────────
        yield sse({"type": "CHUNKS_RETRIEVED", "chunks": chunks})

        # ── 5. Reranking ─────────────────────────────────────────────
        yield sse({"type": "RERANK_STARTED"})

        reranked = rerank_documents(final_query, retrieved_docs, top_k=3)

        rerank_scores = [float(s) for _, s in reranked]
        rerank_norm = normalize(rerank_scores) if rerank_scores else []

        reranked_chunks = [
            {
                "id": str(i),
                "text": doc,
                "source": get_source(doc),
                "score": round(rerank_norm[i], 3),
                "rerankedScore": round(rerank_norm[i], 3),
            }
            for i, (doc, _) in enumerate(reranked)
        ]

        # ── 6. Rerank complete ────────────────────────────────────────
        yield sse({"type": "RERANK_COMPLETE", "chunks": reranked_chunks})

        # ── 7. Prompt ready ───────────────────────────────────────────
        context_docs = [doc for doc, _ in reranked]
        yield sse({"type": "PROMPT_READY"})

        # ── 8. Generation (streaming) ─────────────────────────────────
        yield sse({"type": "GENERATION_STARTED"})

        full_answer = ""
        # Use the original query for generation — the rewritten form is
        # for retrieval only. Passing final_query confuses the LLM.
        for token in generate_answer_stream(query, context_docs):
            full_answer += token
            yield sse({"type": "TOKEN_STREAM", "token": token})

        # ── 9. Complete ───────────────────────────────────────────────
        yield sse({"type": "GENERATION_COMPLETE", "answer": full_answer})

        # Persist to chat history and memory
        chat_history.append(("user", query))
        chat_history.append(("assistant", full_answer))
        store_memory(query, full_answer)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.delete("/history")
def clear_history():
    """Reset conversation history (useful for testing)."""
    global chat_history
    chat_history = []
    return {"status": "cleared"}


# ── Document management ───────────────────────────────────────────────

@app.get("/documents")
def list_documents():
    """List all PDFs in the documents/ folder with chunk counts."""
    indexed = list_indexed_files()
    pdf_files = sorted(DOCUMENTS_DIR.glob("*.pdf"))
    docs = []
    for pdf in pdf_files:
        docs.append({
            "filename": pdf.name,
            "size_kb": round(pdf.stat().st_size / 1024, 1),
            "chunks": indexed.get(pdf.name, 0),
        })
    return {"documents": docs}


@app.post("/documents/upload")
def upload_document(file: UploadFile = File(...)):
    """
    Accept a PDF upload, save it to documents/, and incrementally
    embed its chunks. Streams SSE progress events while processing.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    save_path = DOCUMENTS_DIR / file.filename

    # Save the uploaded file
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    def progress_stream():
        yield sse({"type": "UPLOAD_STARTED", "filename": file.filename})

        for progress in add_pdf_stream(save_path):
            if progress.get("done"):
                chunks_added = progress["chunks_added"]
                # Rebuild BM25 to include the new chunks
                build_bm25_index()
                yield sse({
                    "type": "UPLOAD_COMPLETE",
                    "filename": file.filename,
                    "chunks_added": chunks_added,
                })
            else:
                yield sse({
                    "type": "UPLOAD_PROGRESS",
                    "page": progress["page"],
                    "total_pages": progress["total_pages"],
                    "chunks_so_far": progress["chunks_so_far"],
                    "latest_chunk": progress.get("latest_chunk", ""),
                    "latest_source": progress.get("latest_source", ""),
                })

    return StreamingResponse(
        progress_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.delete("/documents/{filename}")
def delete_document(filename: str):
    """Remove a PDF and its chunks from the index."""
    from vector_store import documents, document_sources, document_embeddings

    pdf_path = DOCUMENTS_DIR / filename
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="File not found.")

    # Remove from index (in-place to keep references valid)
    indices_to_remove = {
        i for i, src in enumerate(document_sources)
        if src.startswith(filename + " · ")
    }
    for lst in (documents, document_sources, document_embeddings):
        for i in sorted(indices_to_remove, reverse=True):
            del lst[i]

    # Rebuild BM25
    build_bm25_index()

    # Delete file
    pdf_path.unlink()

    return {"status": "deleted", "filename": filename,
            "chunks_removed": len(indices_to_remove)}


@app.get("/health")
def health():
    return {"status": "ok"}
