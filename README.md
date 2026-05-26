# RAG Visualizer

A conversational RAG (Retrieval-Augmented Generation) pipeline with a live visualization UI. Ask questions about your PDF documents and watch each stage of the pipeline animate in real time: query rewriting, hybrid retrieval, reranking, prompt building, and streaming generation.

![Pipeline visualization](https://raw.githubusercontent.com/your-username/Rag-Visualizer/main/docs/preview.png)

## Features

- **Conversational memory** — rewrites queries using conversation history and semantic memory
- **Hybrid retrieval** — combines BM25 sparse search with dense embedding similarity
- **Cross-encoder reranking** — scores query–document pairs with `ms-marco-MiniLM-L-6-v2`
- **Streaming generation** — tokens streamed via Server-Sent Events
- **Live visualization** — animated pipeline graph in the browser
- **PDF document management** — upload, index, and delete PDFs via the UI

## Architecture

```
conversational-rag/
├── api.py                  # FastAPI backend (main entry point)
├── app.py                  # Optional CLI runner
├── vector_store.py         # PDF loading, chunking, dense embeddings
├── dense_retriever.py      # Cosine similarity retrieval
├── sparse_retriever.py     # BM25 retrieval
├── hybrid_retriever.py     # Combines dense + sparse scores
├── reranker.py             # Cross-encoder reranking
├── rewriter.py             # LLM-based query rewriting
├── memory.py               # Semantic conversation memory
├── generator.py            # Streaming LLM answer generation
├── retrieval_evaluator.py  # Recall@k and MRR evaluation script
├── eval_dataset.py         # Evaluation query/document pairs
├── requirements.txt
├── documents/              # Place your PDF files here
└── viz/                    # Next.js frontend
    ├── app/                # Next.js App Router pages
    ├── components/         # React pipeline components
    ├── store/              # Zustand state
    ├── lib/                # SSE client, simulator, sample data
    └── types/              # TypeScript types
```

## Prerequisites

| Dependency | Version | Notes |
|---|---|---|
| Python | 3.10+ | |
| Node.js | 18+ | |
| [Ollama](https://ollama.ai) | latest | Local LLM and embeddings |

Pull the required Ollama models before starting:

```bash
ollama pull llama3
ollama pull nomic-embed-text
```

## Quick start

### 1. Backend

```bash
cd conversational-rag
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

The backend loads and embeds all PDFs in `documents/` on startup. Add your own PDFs there, or upload them via the UI once it is running.

### 2. Frontend

```bash
cd conversational-rag/viz
cp .env.example .env.local   # adjust NEXT_PUBLIC_BACKEND_URL if needed
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

**Backend** — no `.env` required; all config is in the Python source files.

**Frontend** (`conversational-rag/viz/.env.local`):

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:8000` | URL of the FastAPI backend |

## Evaluation

Run retrieval evaluation (Recall@k and MRR) against a small built-in dataset:

```bash
cd conversational-rag
python retrieval_evaluator.py
```

## CLI mode

The pipeline can also be run as an interactive terminal chat without the frontend:

```bash
cd conversational-rag
python app.py
```

## Tech stack

| Layer | Technology |
|---|---|
| LLM & embeddings | Ollama (llama3 + nomic-embed-text) |
| Dense retrieval | numpy cosine similarity |
| Sparse retrieval | rank-bm25 (BM25Okapi) |
| Reranking | sentence-transformers cross-encoder |
| Backend API | FastAPI + uvicorn |
| Frontend | Next.js 16, Zustand, Framer Motion, Tailwind CSS v4 |
