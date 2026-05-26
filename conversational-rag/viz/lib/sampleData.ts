import { Chunk } from '@/types/pipeline';

export const SAMPLE_CHUNKS: Chunk[] = [
  {
    id: '1',
    text: 'The transformer architecture uses self-attention mechanisms to process sequential data in parallel, enabling efficient training on large datasets without recurrence.',
    source: 'Attention Is All You Need · Vaswani et al., 2017',
    score: 0.94,
  },
  {
    id: '2',
    text: 'RAG combines parametric memory (LLM weights) with non-parametric memory (retrieved documents), allowing models to access factual knowledge at inference time without retraining.',
    source: 'Retrieval-Augmented Generation · Lewis et al., 2020',
    score: 0.89,
  },
  {
    id: '3',
    text: 'Dense Passage Retrieval encodes queries and passages into a shared embedding space using bi-encoders. Similarity is computed via inner product for scalable nearest-neighbor search.',
    source: 'DPR · Karpukhin et al., 2020',
    score: 0.83,
  },
  {
    id: '4',
    text: 'Cross-encoder rerankers evaluate query-document pairs jointly through full attention, yielding more precise relevance scores than bi-encoders at the cost of latency.',
    source: 'ColBERT: Efficient Passage Search · Khattab et al., 2020',
    score: 0.76,
  },
  {
    id: '5',
    text: 'Hybrid retrieval combines sparse (BM25) and dense (vector) methods. Sparse retrieval excels at exact keyword matching; dense retrieval captures semantic similarity.',
    source: 'Hybrid Retrieval for Open-Domain QA · Chen et al., 2021',
    score: 0.71,
  },
];

export const SAMPLE_RERANKED_CHUNKS: Chunk[] = [
  { ...SAMPLE_CHUNKS[1], rerankedScore: 0.97 },
  { ...SAMPLE_CHUNKS[0], rerankedScore: 0.93 },
  { ...SAMPLE_CHUNKS[2], rerankedScore: 0.85 },
  { ...SAMPLE_CHUNKS[3], rerankedScore: 0.74 },
  { ...SAMPLE_CHUNKS[4], rerankedScore: 0.61 },
];

export const SAMPLE_TOKENS = `RAG — Retrieval-Augmented Generation — works by fusing two systems: a dense retriever and an autoregressive language model.

When your query arrives, it is encoded into a high-dimensional embedding vector by a bi-encoder model fine-tuned for semantic similarity. This vector is compared against a pre-indexed corpus using approximate nearest-neighbor search, returning the most relevant document chunks in milliseconds.

The retrieved chunks are then reranked by a cross-encoder that evaluates each query–document pair jointly, boosting precision before the context window fills.

Finally, the top-k chunks are injected into the prompt, grounding the language model's generation in real, retrieved facts — reducing hallucinations and enabling accurate citations.`
  .split(' ')
  .flatMap((w) => [w, ' ']);

export const SAMPLE_QUERY_SUGGESTIONS = [
  'How does retrieval-augmented generation work?',
  'What is the difference between sparse and dense retrieval?',
  'How do cross-encoder rerankers improve search precision?',
  'Explain transformer self-attention in simple terms',
];
