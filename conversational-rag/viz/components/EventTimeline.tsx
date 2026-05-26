'use client';
import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import { usePipelineStore } from '@/store/pipelineStore';
import { PipelineEventType } from '@/types/pipeline';

const EVENT_COLORS: Record<PipelineEventType, string> = {
  IDLE: '#4b5563',
  QUERY_RECEIVED: '#818cf8',
  EMBEDDING_STARTED: '#60a5fa',
  EMBEDDING_COMPLETE: '#60a5fa',
  RETRIEVAL_STARTED: '#34d399',
  CHUNKS_RETRIEVED: '#34d399',
  RERANK_STARTED: '#2dd4bf',
  RERANK_COMPLETE: '#2dd4bf',
  PROMPT_READY: '#a78bfa',
  GENERATION_STARTED: '#c084fc',
  TOKEN_STREAM: '#c084fc',
  GENERATION_COMPLETE: '#f472b6',
};

function formatRelative(ts: number, firstTs: number) {
  const diff = ts - firstTs;
  return `+${(diff / 1000).toFixed(2)}s`;
}

export default function EventTimeline() {
  const { events, currentEvent, isRunning } = usePipelineStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [events.length]);

  const firstTs = events[0]?.timestamp ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-shrink-0">
        <Activity size={13} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-300">Event Log</span>
        {isRunning && (
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"
          />
        )}
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className="text-[11px] text-slate-500 text-center py-4"
            >
              Events will appear as the pipeline runs
            </motion.p>
          ) : (
            events.map((event, i) => {
              const color = EVENT_COLORS[event.type] ?? '#6b7280';
              const isLast = i === events.length - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="flex items-start gap-2.5 group"
                >
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center flex-shrink-0 pt-1">
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: color }}
                      animate={isLast && isRunning ? { scale: [1, 1.5, 1], opacity: [1, 0.6, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    {i < events.length - 1 && (
                      <div className="w-px flex-1 bg-white/5 mt-1" style={{ minHeight: 12 }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <p className="text-[11px] text-slate-300 leading-snug">{event.label}</p>
                    <span className="text-[9px] font-mono text-slate-600">
                      {formatRelative(event.timestamp, firstTs)}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
