'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, CheckCircle2 } from 'lucide-react';
import { usePipelineStore } from '@/store/pipelineStore';

export default function StreamingAnswer() {
  const { streamedText, nodeStates } = usePipelineStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const isStreaming = nodeStates.answer === 'streaming';
  const isDone = nodeStates.answer === 'success';
  const hasContent = streamedText.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [streamedText]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={13} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Generated Answer</span>
        </div>

        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-[10px] text-emerald-400"
            >
              <CheckCircle2 size={11} />
              complete
            </motion.div>
          )}
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-[10px] text-violet-400"
            >
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-violet-400"
              />
              streaming
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {!hasContent ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-20 gap-2"
            >
              <p className="text-[11px] text-slate-500">Answer will appear here…</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap"
            >
              {streamedText}
              {isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 align-middle rounded-full"
                />
              )}
              <div ref={bottomRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
