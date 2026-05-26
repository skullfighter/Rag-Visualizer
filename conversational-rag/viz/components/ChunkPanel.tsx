'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ArrowUpDown, Filter, Layers } from 'lucide-react';
import { usePipelineStore } from '@/store/pipelineStore';
import { Chunk } from '@/types/pipeline';

function ScoreBar({
  score,
  accent,
  prevScore,
}: {
  score: number;
  accent: string;
  prevScore?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: accent }}
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="flex items-center gap-1 w-16 justify-end">
        {prevScore !== undefined && Math.abs(prevScore - score) > 0.01 && (
          <motion.span
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[9px] font-mono text-slate-600 line-through"
          >
            {prevScore.toFixed(2)}
          </motion.span>
        )}
        <span className="text-[10px] font-mono text-slate-400">
          {score.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

interface MergedChunk extends Chunk {
  rerankedScore?: number;
  isSelected: boolean;  // survived reranking
  rerankedRank?: number; // 1-indexed rank after reranking
}

function ChunkCard({
  chunk,
  index,
  showReranked,
}: {
  chunk: MergedChunk;
  index: number;
  showReranked: boolean;
}) {
  const isFiltered = showReranked && !chunk.isSelected;
  const accent = chunk.isSelected && showReranked ? '#2dd4bf' : '#818cf8';

  return (
    <motion.div
      layout
      layoutId={`chunk-card-${chunk.id}`}
      initial={{ opacity: 0, x: 20, scale: 0.97 }}
      animate={{
        opacity: isFiltered ? 0.35 : 1,
        x: 0,
        scale: 1,
      }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="rounded-xl border bg-white/[0.02] p-3 space-y-2 transition-colors"
      style={{
        borderColor: isFiltered
          ? 'rgba(255,255,255,0.04)'
          : chunk.isSelected && showReranked
            ? 'rgba(45,212,191,0.2)'
            : 'rgba(255,255,255,0.07)',
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        {/* Rank badge */}
        <span
          className="text-[10px] font-semibold rounded-md px-1.5 py-0.5 flex-shrink-0"
          style={{
            color: accent,
            background: `${accent}18`,
          }}
        >
          {showReranked && chunk.rerankedRank
            ? `#${chunk.rerankedRank}`
            : `#${index + 1}`}
        </span>

        {/* Selected / filtered badge */}
        <AnimatePresence>
          {showReranked && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[9px] rounded-full px-1.5 py-0.5 font-medium"
              style={
                chunk.isSelected
                  ? { color: '#2dd4bf', background: 'rgba(45,212,191,0.1)' }
                  : { color: '#6b7280', background: 'rgba(255,255,255,0.04)' }
              }
            >
              {chunk.isSelected ? 'selected' : 'filtered'}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Score bar — right-aligned */}
        <div className="flex-1">
          <ScoreBar
            score={
              showReranked && chunk.rerankedScore !== undefined
                ? chunk.rerankedScore
                : chunk.score
            }
            accent={accent}
            prevScore={
              showReranked && chunk.rerankedScore !== undefined
                ? chunk.score
                : undefined
            }
          />
        </div>
      </div>

      {/* Text excerpt */}
      <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
        {chunk.text}
      </p>

      {/* Source */}
      <div className="flex items-center gap-1.5">
        <FileText size={10} className="text-slate-500 flex-shrink-0" />
        <span className="text-[10px] text-slate-500 truncate">{chunk.source}</span>
      </div>
    </motion.div>
  );
}

export default function ChunkPanel() {
  const { chunks, rerankedChunks, isUploading, uploadFilename, uploadPage, uploadTotalPages, uploadChunks } = usePipelineStore();

  const showReranked = rerankedChunks.length > 0;
  const hasChunks = chunks.length > 0;

  const merged: MergedChunk[] = chunks.map((chunk) => {
    const rerankedIdx = rerankedChunks.findIndex((r) => r.text === chunk.text);
    const reranked = rerankedChunks[rerankedIdx];
    return {
      ...chunk,
      rerankedScore: reranked?.rerankedScore,
      isSelected: rerankedIdx !== -1,
      rerankedRank: rerankedIdx !== -1 ? rerankedIdx + 1 : undefined,
    };
  });

  const sorted = showReranked
    ? [
        ...merged.filter((c) => c.isSelected).sort((a, b) => (a.rerankedRank ?? 99) - (b.rerankedRank ?? 99)),
        ...merged.filter((c) => !c.isSelected),
      ]
    : merged;

  const uploadProgress = uploadTotalPages > 0 ? Math.round((uploadPage / uploadTotalPages) * 100) : 0;

  // ── Upload / indexing mode ────────────────────────────────────────────
  if (isUploading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Layers size={12} className="text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">Indexing</span>
          </div>
          {uploadChunks.length > 0 && (
            <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 font-medium">
              {uploadChunks.length} chunks
            </span>
          )}
        </div>

        {/* Progress bar + label */}
        <div className="px-4 py-2 flex-shrink-0 space-y-1.5 border-b border-white/5">
          <div className="flex justify-between items-center">
            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{uploadFilename}</p>
            <span className="text-[10px] font-mono text-slate-500">
              {uploadTotalPages > 0 ? `p.${uploadPage}/${uploadTotalPages}` : 'starting…'}
            </span>
          </div>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-indigo-500"
              animate={{ width: `${uploadProgress}%` }}
              transition={{ ease: 'easeOut', duration: 0.4 }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-slate-600">embedding chunks…</span>
            <span className="text-[10px] text-indigo-400">{uploadProgress}%</span>
          </div>
        </div>

        {/* Chunks appearing live */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <AnimatePresence initial={false}>
            {uploadChunks.slice().reverse().map((chunk) => (
              <motion.div
                key={chunk.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-indigo-500/15 bg-indigo-500/[0.04] p-3 space-y-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-semibold rounded-md px-1.5 py-0.5 text-indigo-400 bg-indigo-500/15">
                    #{chunk.id}
                  </span>
                  <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-indigo-500/60"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">{chunk.text}</p>
                <div className="flex items-center gap-1.5">
                  <FileText size={10} className="text-slate-500 flex-shrink-0" />
                  <span className="text-[10px] text-slate-500 truncate">{chunk.source}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {uploadChunks.length === 0 && (
            <p className="text-[11px] text-slate-600 text-center py-4">Processing pages…</p>
          )}
        </div>
      </div>
    );
  }

  // ── Normal query-retrieval mode ───────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">
            Retrieved Chunks
          </span>
          {hasChunks && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] rounded-full px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 font-medium"
            >
              {chunks.length}
            </motion.span>
          )}
        </div>

        <AnimatePresence>
          {showReranked && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5"
            >
              <span className="flex items-center gap-1 text-[10px] text-teal-400">
                <ArrowUpDown size={10} />
                reranked
              </span>
              <span className="text-[10px] text-slate-500">·</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Filter size={9} />
                top {rerankedChunks.length}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showReranked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 pt-2 pb-1 flex items-center gap-2"
          >
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[9px] uppercase tracking-widest text-slate-600">reranked order</span>
            <div className="flex-1 h-px bg-white/5" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {!hasChunks ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-32 gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-white/3 flex items-center justify-center">
                <FileText size={14} className="text-slate-500" />
              </div>
              <p className="text-[11px] text-slate-500">Awaiting retrieval…</p>
            </motion.div>
          ) : (
            sorted.map((chunk, i) => (
              <ChunkCard key={chunk.id} chunk={chunk} index={i} showReranked={showReranked} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
