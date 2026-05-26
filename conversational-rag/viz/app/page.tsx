'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, ExternalLink, FileText, FolderOpen } from 'lucide-react';
import QueryInput from '@/components/QueryInput';
import RewrittenQuery from '@/components/RewrittenQuery';
import RAGPipeline from '@/components/RAGPipeline';
import ChunkPanel from '@/components/ChunkPanel';
import DocumentManager from '@/components/DocumentManager';
import StreamingAnswer from '@/components/StreamingAnswer';
import EventTimeline from '@/components/EventTimeline';
import { usePipelineStore } from '@/store/pipelineStore';

export default function Home() {
  const [sidebarTab, setSidebarTab] = useState<'chunks' | 'documents'>('chunks');
  const isUploading = usePipelineStore((s) => s.isUploading);

  // Auto-switch to Chunks tab when indexing starts so the live feed is visible
  useEffect(() => {
    if (isUploading) setSidebarTab('chunks');
  }, [isUploading]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 h-12 border-b border-white/5 bg-[#07070f]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Cpu size={12} className="text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-100 tracking-tight">
              RAG Visualizer
            </span>
            <span className="text-xs text-slate-500 font-normal">live pipeline</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            conversational RAG
          </div>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <ExternalLink size={15} />
          </motion.a>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Left/Center: pipeline + answer + timeline ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Query input */}
          <div className="flex-shrink-0 px-6 pt-5 pb-2">
            <QueryInput />
          </div>

          {/* Rewritten query banner */}
          <div className="flex-shrink-0 pb-3">
            <RewrittenQuery />
          </div>

          {/* Pipeline visualization */}
          <div className="flex-shrink-0 px-4 pb-3">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-1">
              <RAGPipeline />
            </div>
          </div>

          {/* Bottom: streaming answer + event log */}
          <div className="flex-1 flex gap-3 px-4 pb-4 overflow-hidden min-h-0">

            {/* Streaming answer */}
            <div className="flex-1 flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden min-w-0">
              <StreamingAnswer />
            </div>

            {/* Event timeline */}
            <div className="w-64 xl:w-72 flex-shrink-0 flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
              <EventTimeline />
            </div>

          </div>
        </div>

        {/* ── Right sidebar: chunks / documents ────────── */}
        <aside className="w-80 flex-shrink-0 border-l border-white/[0.06] flex flex-col overflow-hidden bg-white/[0.01]">
          {/* Tab bar */}
          <div className="flex-shrink-0 flex border-b border-white/5">
            <button
              onClick={() => setSidebarTab('chunks')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors ${
                sidebarTab === 'chunks'
                  ? 'text-indigo-400 border-b border-indigo-500'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <FileText size={11} />
              Chunks
            </button>
            <button
              onClick={() => setSidebarTab('documents')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors ${
                sidebarTab === 'documents'
                  ? 'text-indigo-400 border-b border-indigo-500'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <FolderOpen size={11} />
              Documents
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'chunks' ? <ChunkPanel /> : <DocumentManager />}
          </div>
        </aside>

      </div>
    </div>
  );
}
