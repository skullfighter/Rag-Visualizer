'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch } from 'lucide-react';
import { usePipelineStore } from '@/store/pipelineStore';

export default function RewrittenQuery() {
  const { rewrittenQuery, query } = usePipelineStore();

  // Only show when the rewritten query is meaningfully different from the original
  const show = rewrittenQuery.length > 0;
  const isDifferent =
    rewrittenQuery.toLowerCase().trim() !== query.toLowerCase().trim();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="w-full max-w-3xl mx-auto px-4"
        >
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border border-indigo-500/15 bg-indigo-500/5">
            <GitBranch
              size={13}
              className="text-indigo-400 flex-shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                Rewritten query
              </span>
              <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                {rewrittenQuery}
              </p>
              {!isDifferent && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  No rewrite needed — query is already standalone
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
