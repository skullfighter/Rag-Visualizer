import { usePipelineStore } from '@/store/pipelineStore';
import { Chunk, PipelineEventType } from '@/types/pipeline';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

let packetKey = 0;

function getStore() {
  return usePipelineStore.getState();
}

function emit(type: PipelineEventType, label: string) {
  const s = getStore();
  s._setCurrentEvent(type);
  s._addEvent({ type, label, timestamp: Date.now() });
}

function sendPacket(edgeIndex: number, duration = 680) {
  const s = getStore();
  s._setActivePacket({ edgeIndex, key: packetKey++ });
  setTimeout(() => s._setActivePacket(null), duration);
}

// Maps each backend SSE event to node state transitions + packet animations.
// Real operations take seconds so the 680ms packets have room to play out.
function handleEvent(event: Record<string, unknown>) {
  const s = getStore();

  switch (event.type as string) {
    case 'QUERY_RECEIVED': {
      emit('QUERY_RECEIVED', `Query: "${String(event.query).slice(0, 48)}…"`);
      s._setNodeState('query', 'processing');
      break;
    }

    case 'QUERY_REWRITING': {
      emit('EMBEDDING_STARTED', 'Rewriting query with conversation context');
      // Query node stays in processing while both rewrites run
      break;
    }

    case 'RETRIEVAL_STARTED': {
      const rq = String(event.rewritten_query ?? '');
      s._setRewrittenQuery(rq);
      emit(
        'RETRIEVAL_STARTED',
        `Rewritten: "${rq.slice(0, 56)}${rq.length > 56 ? '…' : ''}"`
      );
      s._setNodeState('query', 'success');
      // Query → Embedding packet
      sendPacket(0);
      // Stagger embedding node activate → success → retrieval packet
      setTimeout(() => s._setNodeState('embedding', 'processing'), 200);
      setTimeout(() => {
        s._setNodeState('embedding', 'success');
        // Embedding → Retrieval packet
        sendPacket(1);
        setTimeout(() => s._setNodeState('retrieval', 'processing'), 200);
      }, 760);
      break;
    }

    case 'CHUNKS_RETRIEVED': {
      const chunks = event.chunks as Chunk[];
      emit('CHUNKS_RETRIEVED', `Retrieved ${chunks.length} candidate chunks`);
      s._setChunks(chunks);
      s._setNodeState('retrieval', 'success');
      // Retrieval → Reranker packet
      sendPacket(2);
      break;
    }

    case 'RERANK_STARTED': {
      emit('RERANK_STARTED', 'Cross-encoder scoring query–doc pairs');
      setTimeout(() => s._setNodeState('reranker', 'processing'), 760);
      break;
    }

    case 'RERANK_COMPLETE': {
      const chunks = event.chunks as Chunk[];
      emit('RERANK_COMPLETE', `Reranked — top ${chunks.length} chunks selected`);
      s._setRerankedChunks(chunks);
      s._setNodeState('reranker', 'success');
      // Reranker → Prompt Builder packet
      sendPacket(3);
      setTimeout(() => {
        s._setNodeState('promptBuilder', 'processing');
        setTimeout(() => {
          s._setNodeState('promptBuilder', 'success');
          // Prompt Builder → LLM packet
          sendPacket(4);
        }, 500);
      }, 760);
      break;
    }

    case 'PROMPT_READY': {
      emit('PROMPT_READY', 'Context injected into prompt');
      // promptBuilder animation is already handled in RERANK_COMPLETE stagger
      break;
    }

    case 'GENERATION_STARTED': {
      emit('GENERATION_STARTED', 'Streaming generation (llama3)');
      setTimeout(() => s._setNodeState('llm', 'processing'), 760);
      break;
    }

    case 'TOKEN_STREAM': {
      if (s.nodeStates.answer !== 'streaming') {
        s._setNodeState('answer', 'streaming');
      }
      s._addToken(String(event.token));
      break;
    }

    case 'GENERATION_COMPLETE': {
      emit('GENERATION_COMPLETE', 'Generation complete');
      s._setNodeState('llm', 'success');
      s._setNodeState('answer', 'success');
      // LLM → Answer final packet
      sendPacket(5);
      break;
    }
  }
}

export async function runRealPipeline(query: string): Promise<void> {
  const s = getStore();

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
  } catch {
    throw new Error(
      `Cannot reach RAG backend at ${BACKEND_URL}. Is it running?`
    );
  }

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }
  if (!response.body) {
    throw new Error('No response body from backend');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE messages are separated by double newlines
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const dataLine = part
          .split('\n')
          .find((l) => l.startsWith('data: '));
        if (!dataLine) continue;

        try {
          const event = JSON.parse(dataLine.slice(6));
          handleEvent(event);
        } catch {
          // Ignore malformed events
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  s._setIsRunning(false);
}
