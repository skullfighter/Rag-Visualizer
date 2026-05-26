'use client';
import { create } from 'zustand';
import {
  NodeId,
  NodeState,
  PipelineEventType,
  Chunk,
  PipelineEvent,
  ActivePacket,
} from '@/types/pipeline';

const INITIAL_NODE_STATES: Record<NodeId, NodeState> = {
  query: 'idle',
  embedding: 'idle',
  retrieval: 'idle',
  reranker: 'idle',
  promptBuilder: 'idle',
  llm: 'idle',
  answer: 'idle',
};

interface PipelineStore {
  query: string;
  rewrittenQuery: string;
  isRunning: boolean;
  nodeStates: Record<NodeId, NodeState>;
  activePacket: ActivePacket | null;
  chunks: Chunk[];
  rerankedChunks: Chunk[];
  streamedText: string;
  currentEvent: PipelineEventType;
  events: PipelineEvent[];

  // Upload / indexing state
  isUploading: boolean;
  uploadFilename: string;
  uploadPage: number;
  uploadTotalPages: number;
  uploadChunks: Chunk[];

  setQuery: (q: string) => void;
  startPipeline: () => void;
  resetPipeline: () => void;

  _setNodeState: (id: NodeId, state: NodeState) => void;
  _setActivePacket: (packet: ActivePacket | null) => void;
  _setChunks: (chunks: Chunk[]) => void;
  _setRerankedChunks: (chunks: Chunk[]) => void;
  _addToken: (token: string) => void;
  _setCurrentEvent: (event: PipelineEventType) => void;
  _addEvent: (event: PipelineEvent) => void;
  _setIsRunning: (v: boolean) => void;
  _setRewrittenQuery: (q: string) => void;

  _startUpload: (filename: string) => void;
  _addUploadChunk: (chunk: Chunk, page: number, totalPages: number) => void;
  _finishUpload: () => void;
}

export const usePipelineStore = create<PipelineStore>((set) => ({
  query: '',
  rewrittenQuery: '',
  isRunning: false,
  nodeStates: { ...INITIAL_NODE_STATES },
  activePacket: null,
  chunks: [],
  rerankedChunks: [],
  streamedText: '',
  currentEvent: 'IDLE',
  events: [],

  isUploading: false,
  uploadFilename: '',
  uploadPage: 0,
  uploadTotalPages: 0,
  uploadChunks: [],

  setQuery: (q) => set({ query: q }),

  startPipeline: () =>
    set({
      isRunning: true,
      nodeStates: { ...INITIAL_NODE_STATES },
      activePacket: null,
      chunks: [],
      rerankedChunks: [],
      streamedText: '',
      rewrittenQuery: '',
      currentEvent: 'IDLE',
      events: [],
      uploadChunks: [],   // clear leftover upload visualization
    }),

  resetPipeline: () =>
    set({
      isRunning: false,
      nodeStates: { ...INITIAL_NODE_STATES },
      activePacket: null,
      chunks: [],
      rerankedChunks: [],
      streamedText: '',
      rewrittenQuery: '',
      currentEvent: 'IDLE',
      events: [],
    }),

  _setNodeState: (id, state) =>
    set((s) => ({ nodeStates: { ...s.nodeStates, [id]: state } })),

  _setActivePacket: (packet) => set({ activePacket: packet }),

  _setChunks: (chunks) => set({ chunks }),

  _setRerankedChunks: (chunks) => set({ rerankedChunks: chunks }),

  _addToken: (token) =>
    set((s) => ({ streamedText: s.streamedText + token })),

  _setCurrentEvent: (event) => set({ currentEvent: event }),

  _addEvent: (event) =>
    set((s) => ({ events: [...s.events, event] })),

  _setIsRunning: (v) => set({ isRunning: v }),

  _setRewrittenQuery: (q) => set({ rewrittenQuery: q }),

  _startUpload: (filename) =>
    set({ isUploading: true, uploadFilename: filename, uploadPage: 0, uploadTotalPages: 0, uploadChunks: [] }),

  _addUploadChunk: (chunk, page, totalPages) =>
    set((s) => ({
      uploadPage: page,
      uploadTotalPages: totalPages,
      uploadChunks: chunk.text ? [...s.uploadChunks, chunk] : s.uploadChunks,
    })),

  _finishUpload: () =>
    set({ isUploading: false, uploadChunks: [], uploadPage: 0, uploadTotalPages: 0 }),
}));
