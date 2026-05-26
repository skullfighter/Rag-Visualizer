'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { usePipelineStore } from '@/store/pipelineStore';
import { runRealPipeline } from '@/lib/ragClient';

const SUGGESTIONS = [
  'What is BM25 and how does it work?',
  'How does dense retrieval use embeddings?',
  'What is HNSW indexing?',
  'Explain FAISS index types',
];

export default function QueryInput() {
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, isRunning, startPipeline, resetPipeline } = usePipelineStore();

  async function handleSubmit(q?: string) {
    const text = (q ?? query).trim();
    if (!text || isRunning) return;
    if (q) setQuery(q);
    setError(null);
    startPipeline();
    try {
      await runRealPipeline(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      resetPipeline();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }

  function handleReset() {
    resetPipeline();
    setQuery('');
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 space-y-2">
      {/* Input row */}
      <motion.div
        animate={{
          boxShadow: error
            ? '0 0 0 1px rgba(239,68,68,0.4), 0 0 20px rgba(239,68,68,0.08)'
            : focused
              ? '0 0 0 1px rgba(99,102,241,0.5), 0 0 32px rgba(99,102,241,0.12)'
              : '0 0 0 1px rgba(255,255,255,0.06)',
        }}
        transition={{ duration: 0.25 }}
        className="relative flex items-center rounded-2xl bg-[#0f0f1e] overflow-hidden"
      >
        <div className="pl-4 pr-2 flex-shrink-0">
          <motion.div
            animate={{ color: error ? '#ef4444' : focused ? '#6366f1' : '#4b5563' }}
            transition={{ duration: 0.2 }}
          >
            <Search size={18} />
          </motion.div>
        </div>

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setError(null); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask anything about your knowledge base…"
          disabled={isRunning}
          className="flex-1 bg-transparent py-4 pr-2 text-sm text-slate-200 placeholder-slate-500 outline-none disabled:opacity-50"
        />

        <div className="pr-3 flex items-center gap-2">
          <AnimatePresence>
            {isRunning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 text-xs text-indigo-400 pr-1"
              >
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                />
                running
              </motion.div>
            )}
          </AnimatePresence>

          {isRunning ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            >
              reset
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSubmit()}
              disabled={!query.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
            >
              <ArrowRight size={15} />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-400"
          >
            <AlertCircle size={12} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestion pills */}
      <AnimatePresence>
        {!isRunning && !query && !error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2 justify-center"
          >
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Sparkles size={11} /> Try:
            </span>
            {SUGGESTIONS.slice(0, 3).map((s) => (
              <motion.button
                key={s}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSubmit(s)}
                className="px-3 py-1 rounded-full text-xs text-slate-400 border border-white/5 bg-white/[0.03] hover:border-indigo-500/30 hover:text-slate-200 transition-all"
              >
                {s}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
