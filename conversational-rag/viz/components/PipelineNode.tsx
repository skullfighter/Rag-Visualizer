'use client';
import { motion } from 'framer-motion';
import {
  Search,
  Layers,
  Database,
  SlidersHorizontal,
  Braces,
  Sparkles,
  Radio,
  LucideIcon,
} from 'lucide-react';
import { NodeId, NodeState } from '@/types/pipeline';

const ICON_MAP: Record<NodeId, LucideIcon> = {
  query: Search,
  embedding: Layers,
  retrieval: Database,
  reranker: SlidersHorizontal,
  promptBuilder: Braces,
  llm: Sparkles,
  answer: Radio,
};

const LABEL_MAP: Record<NodeId, string> = {
  query: 'Query',
  embedding: 'Embedding',
  retrieval: 'Retrieval',
  reranker: 'Reranker',
  promptBuilder: 'Prompt',
  llm: 'LLM',
  answer: 'Answer',
};

// Per-node accent colors [text, glow]
const COLOR_MAP: Record<NodeId, [string, string]> = {
  query: ['#818cf8', 'rgba(129,140,248,0.25)'],
  embedding: ['#60a5fa', 'rgba(96,165,250,0.25)'],
  retrieval: ['#34d399', 'rgba(52,211,153,0.25)'],
  reranker: ['#2dd4bf', 'rgba(45,212,191,0.25)'],
  promptBuilder: ['#a78bfa', 'rgba(167,139,250,0.25)'],
  llm: ['#c084fc', 'rgba(192,132,252,0.25)'],
  answer: ['#f472b6', 'rgba(244,114,182,0.25)'],
};

interface Props {
  id: NodeId;
  state: NodeState;
}

export default function PipelineNode({ id, state }: Props) {
  const Icon = ICON_MAP[id];
  const label = LABEL_MAP[id];
  const [color, glowColor] = COLOR_MAP[id];

  const isActive = state === 'processing' || state === 'streaming';
  const isSuccess = state === 'success';

  const borderColor =
    state === 'idle'
      ? 'rgba(255,255,255,0.07)'
      : isSuccess
        ? color
        : color;

  const bgColor =
    state === 'idle'
      ? 'rgba(15,15,30,0.8)'
      : `rgba(15,15,30,0.95)`;

  return (
    <motion.div
      animate={{
        scale: isActive ? 1.04 : 1,
        boxShadow: isActive
          ? `0 0 0 1px ${color}, 0 0 28px ${glowColor}, 0 0 60px ${glowColor}`
          : isSuccess
            ? `0 0 0 1px ${color}60, 0 0 16px ${glowColor}`
            : '0 0 0 1px rgba(255,255,255,0.07)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
      }}
      className="relative w-[100px] h-[84px] rounded-2xl flex flex-col items-center justify-center gap-2 select-none overflow-hidden"
    >
      {/* Processing pulse ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{ border: `1px solid ${color}` }}
          animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Shimmer gradient when processing */}
      {isActive && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, transparent 30%, ${color}10 50%, transparent 70%)`,
            backgroundSize: '200% 200%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Icon */}
      <motion.div
        animate={{
          color: state === 'idle' ? '#4b5563' : color,
          filter: isActive ? `drop-shadow(0 0 6px ${color})` : 'none',
        }}
        transition={{ duration: 0.3 }}
      >
        <Icon size={22} strokeWidth={1.5} />
      </motion.div>

      {/* Label */}
      <motion.span
        animate={{ color: state === 'idle' ? '#6b7280' : '#e2e8f0' }}
        transition={{ duration: 0.3 }}
        className="text-[11px] font-medium tracking-wide"
      >
        {label}
      </motion.span>

      {/* Success dot */}
      {isSuccess && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
          style={{ background: color }}
        />
      )}
    </motion.div>
  );
}
