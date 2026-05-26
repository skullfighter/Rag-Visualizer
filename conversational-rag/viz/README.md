# RAG Visualizer — Frontend

Next.js frontend that animates each stage of the RAG pipeline in real time.

## Prerequisites

- Node.js 18+
- The FastAPI backend running on port 8000

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:8000` | URL of the FastAPI backend |

## Stack

- **Next.js 16** — App Router
- **Zustand** — pipeline state
- **Framer Motion** — node/packet animations
- **Tailwind CSS v4** — styling
