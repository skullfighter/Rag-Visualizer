import { usePipelineStore } from '@/store/pipelineStore';
import { SAMPLE_CHUNKS, SAMPLE_RERANKED_CHUNKS, SAMPLE_TOKENS } from './sampleData';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function emit(type: Parameters<ReturnType<typeof usePipelineStore.getState>['_setCurrentEvent']>[0], label: string) {
  const s = usePipelineStore.getState();
  s._setCurrentEvent(type);
  s._addEvent({ type, label, timestamp: Date.now() });
}

export async function runSimulation(query: string) {
  const s = usePipelineStore.getState();
  let packetKey = 0;

  async function sendPacket(edgeIndex: number, duration: number) {
    s._setActivePacket({ edgeIndex, key: packetKey++ });
    await sleep(duration);
    s._setActivePacket(null);
    await sleep(60);
  }

  // ── Query ──────────────────────────────────────────────
  emit('QUERY_RECEIVED', `Query received: "${query.slice(0, 40)}${query.length > 40 ? '…' : ''}"`);
  s._setNodeState('query', 'processing');
  await sleep(600);
  s._setNodeState('query', 'success');

  // Packet: query → embedding
  await sendPacket(0, 700);

  // ── Embedding ──────────────────────────────────────────
  emit('EMBEDDING_STARTED', 'Encoding query to dense vector (dim=1536)');
  s._setNodeState('embedding', 'processing');
  await sleep(800);
  s._setNodeState('embedding', 'success');
  emit('EMBEDDING_COMPLETE', 'Embedding complete — cosine similarity ready');

  // Packet: embedding → retrieval
  await sendPacket(1, 700);

  // ── Retrieval ─────────────────────────────────────────
  emit('RETRIEVAL_STARTED', 'Running ANN search over 2.3M vectors');
  s._setNodeState('retrieval', 'processing');
  await sleep(900);
  s._setChunks(SAMPLE_CHUNKS);
  emit('CHUNKS_RETRIEVED', `Retrieved ${SAMPLE_CHUNKS.length} candidate chunks`);
  s._setNodeState('retrieval', 'success');

  // Packet: retrieval → reranker
  await sendPacket(2, 700);

  // ── Reranker ──────────────────────────────────────────
  emit('RERANK_STARTED', 'Cross-encoder scoring query–doc pairs');
  s._setNodeState('reranker', 'processing');
  await sleep(1000);
  s._setRerankedChunks(SAMPLE_RERANKED_CHUNKS);
  emit('RERANK_COMPLETE', 'Reranking complete — top-3 chunks selected');
  s._setNodeState('reranker', 'success');

  // Packet: reranker → promptBuilder
  await sendPacket(3, 700);

  // ── Prompt Builder ────────────────────────────────────
  emit('PROMPT_READY', 'Context injected into system prompt (2,847 tokens)');
  s._setNodeState('promptBuilder', 'processing');
  await sleep(600);
  s._setNodeState('promptBuilder', 'success');

  // Packet: promptBuilder → llm
  await sendPacket(4, 700);

  // ── LLM ───────────────────────────────────────────────
  emit('GENERATION_STARTED', 'Streaming generation (claude-sonnet-4-6)');
  s._setNodeState('llm', 'processing');
  await sleep(400);

  // ── Streaming tokens ──────────────────────────────────
  emit('TOKEN_STREAM', 'Token stream active');
  s._setNodeState('answer', 'streaming');

  for (const token of SAMPLE_TOKENS) {
    if (!usePipelineStore.getState().isRunning) return;
    s._addToken(token);
    await sleep(token === ' ' ? 18 : 42);
  }

  // ── Complete ──────────────────────────────────────────
  s._setNodeState('llm', 'success');
  s._setNodeState('answer', 'success');

  // Packet: llm → answer
  await sendPacket(5, 700);

  emit('GENERATION_COMPLETE', 'Generation complete');
  s._setIsRunning(false);
}
