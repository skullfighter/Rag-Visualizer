'use client';
import { motion } from 'framer-motion';

interface Props {
  id: string;
  pathD: string;
  isActive: boolean;
  isCompleted: boolean;
  accentColor: string;
}

export default function AnimatedEdge({ id, pathD, isActive, isCompleted, accentColor }: Props) {
  return (
    <g>
      {/* Invisible path for packet motion reference — kept in defs by parent */}
      {/* Base edge — always dim */}
      <path
        d={pathD}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />

      {/* Completed edge — bright solid */}
      {isCompleted && (
        <motion.path
          d={pathD}
          stroke={accentColor}
          strokeWidth={1}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}

      {/* Active edge — animated flowing dashes */}
      {isActive && (
        <>
          {/* Glow base */}
          <path
            d={pathD}
            stroke={accentColor}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            opacity={0.12}
          />
          {/* Flowing dashes */}
          <motion.path
            d={pathD}
            stroke={accentColor}
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray="6 5"
            animate={{ strokeDashoffset: [22, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
            style={{ filter: `drop-shadow(0 0 4px ${accentColor})` }}
          />
        </>
      )}
    </g>
  );
}
