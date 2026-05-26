export type NodeId =
  | 'query'
  | 'embedding'
  | 'retrieval'
  | 'reranker'
  | 'promptBuilder'
  | 'llm'
  | 'answer';

export type NodeState = 'idle' | 'processing' | 'success' | 'streaming';

export type PipelineEventType =
  | 'IDLE'
  | 'QUERY_RECEIVED'
  | 'EMBEDDING_STARTED'
  | 'EMBEDDING_COMPLETE'
  | 'RETRIEVAL_STARTED'
  | 'CHUNKS_RETRIEVED'
  | 'RERANK_STARTED'
  | 'RERANK_COMPLETE'
  | 'PROMPT_READY'
  | 'GENERATION_STARTED'
  | 'TOKEN_STREAM'
  | 'GENERATION_COMPLETE';

export interface Chunk {
  id: string;
  text: string;
  source: string;
  score: number;
  rerankedScore?: number;
}

export interface PipelineEvent {
  type: PipelineEventType;
  timestamp: number;
  label: string;
}

export interface NodeConfig {
  id: NodeId;
  label: string;
  description: string;
}

export interface ActivePacket {
  edgeIndex: number;
  key: number;
}
