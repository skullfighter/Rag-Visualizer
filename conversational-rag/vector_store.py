import pathlib
from collections import Counter
from ollama import embeddings as ollama_embeddings

# ── Paths ──────────────────────────────────────────────────────────────
DOCUMENTS_DIR = pathlib.Path(__file__).parent / "documents"

# ── Chunking config ────────────────────────────────────────────────────
CHUNK_SIZE = 600      # characters per chunk
CHUNK_OVERLAP = 100   # overlap between consecutive chunks

# ── Global state (populated by build_vector_store) ────────────────────
documents: list[str] = []
document_sources: list[str] = []   # parallel to documents: "file.pdf · p.N"
document_embeddings: list[list[float]] = []


# ── Chunking ───────────────────────────────────────────────────────────

def chunk_text(text: str) -> list[str]:
    """Split text into overlapping fixed-size character chunks."""
    chunks = []
    start = 0
    while start < len(text):
        chunk = text[start : start + CHUNK_SIZE].strip()
        if chunk:
            chunks.append(chunk)
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


# ── PDF loading ────────────────────────────────────────────────────────

def _load_pdf_documents() -> tuple[list[str], list[str]]:
    """
    Read every PDF in DOCUMENTS_DIR, extract text page-by-page,
    chunk it, and return (chunks, sources).
    """
    from pypdf import PdfReader

    all_chunks: list[str] = []
    all_sources: list[str] = []

    DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
    pdf_files = sorted(DOCUMENTS_DIR.glob("*.pdf"))
    if not pdf_files:
        print(f"  No PDF files found in {DOCUMENTS_DIR} — starting with empty index.")
        return [], []

    for pdf_path in pdf_files:
        print(f"  Loading {pdf_path.name}…")
        reader = PdfReader(str(pdf_path))

        for page_num, page in enumerate(reader.pages, start=1):
            raw = page.extract_text() or ""
            text = raw.strip()
            if not text:
                continue
            for c in chunk_text(text):
                all_chunks.append(c)
                all_sources.append(f"{pdf_path.name} · p.{page_num}")

    print(f"  → {len(all_chunks)} chunks from {len(pdf_files)} PDF(s)")
    return all_chunks, all_sources


def add_pdf_stream(pdf_path: pathlib.Path):
    """
    Process a single PDF and incrementally add its chunks to the
    global lists. Yields progress dicts as each page is embedded.

    Yields: {"page": int, "total_pages": int, "chunks_so_far": int}
    Final:  {"done": True, "chunks_added": int}
    """
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    total_pages = len(reader.pages)
    added = 0

    for page_num, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        latest_chunk = ""
        if text:
            for c in chunk_text(text):
                emb = get_embedding(c)
                documents.append(c)
                document_sources.append(f"{pdf_path.name} · p.{page_num}")
                document_embeddings.append(emb)
                added += 1
                latest_chunk = c

        yield {
            "page": page_num,
            "total_pages": total_pages,
            "chunks_so_far": added,
            "latest_chunk": latest_chunk,
            "latest_source": f"{pdf_path.name} · p.{page_num}",
        }

    yield {"done": True, "chunks_added": added}


# ── Embedding helper ───────────────────────────────────────────────────

def get_embedding(text: str) -> list[float]:
    response = ollama_embeddings(
        model="nomic-embed-text",
        prompt=text,
    )
    return response["embedding"]


def get_source(doc_text: str) -> str:
    """Return the source label for a document chunk (O(n) lookup)."""
    try:
        idx = documents.index(doc_text)
        return document_sources[idx]
    except ValueError:
        return "Unknown source"


def list_indexed_files() -> dict[str, int]:
    """Return {filename: chunk_count} for every file currently indexed."""
    counts: Counter[str] = Counter()
    for src in document_sources:
        filename = src.split(" · ")[0]
        counts[filename] += 1
    return dict(counts)


# ── Build ──────────────────────────────────────────────────────────────

def build_vector_store() -> None:
    print("Building vector store from documents/ folder…")
    new_docs, new_sources = _load_pdf_documents()

    # Mutate in-place so modules that imported `documents` see the update.
    documents.clear()
    documents.extend(new_docs)
    document_sources.clear()
    document_sources.extend(new_sources)

    print(f"  Embedding {len(documents)} chunks via nomic-embed-text…")
    document_embeddings.clear()
    for i, doc in enumerate(documents):
        emb = get_embedding(doc)
        document_embeddings.append(emb)
        if (i + 1) % 20 == 0:
            print(f"  {i + 1}/{len(documents)} embedded")

    print("Vector store ready.")
