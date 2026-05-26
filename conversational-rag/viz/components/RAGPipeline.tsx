'use client';
import { usePipelineStore } from '@/store/pipelineStore';
import PipelineNode from './PipelineNode';
import AnimatedEdge from './AnimatedEdge';
import PacketFlow from './PacketFlow';
import { NodeId } from '@/types/pipeline';

const PIPELINE_W = 1040;
const PIPELINE_H = 156;
const NODE_W = 100;
const NODE_H = 84;
const NODE_Y = PIPELINE_H / 2;
const SPACING = 140;
const FIRST_X = 70;

const NODE_IDS: NodeId[] = [
  'query',
  'embedding',
  'retrieval',
  'reranker',
  'promptBuilder',
  'llm',
  'answer',
];

const nodeCenters = NODE_IDS.map((_, i) => FIRST_X + i * SPACING);

// Cubic bezier paths between each pair of consecutive nodes
const edgePaths = NODE_IDS.slice(0, -1).map((_, i) => {
  const fromX = nodeCenters[i] + NODE_W / 2;
  const toX = nodeCenters[i + 1] - NODE_W / 2;
  const y = NODE_Y;
  return `M ${fromX},${y} C ${fromX + 14},${y - 12} ${toX - 14},${y - 12} ${toX},${y}`;
});

const EDGE_COLOR = '#818cf8';

export default function RAGPipeline() {
  const { nodeStates, activePacket, isUploading } = usePipelineStore();

  // Overlay upload state onto node states: pulse embedding node during indexing
  const effectiveNodeStates = isUploading
    ? { ...nodeStates, embedding: 'processing' as const }
    : nodeStates;

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div
        className="relative mx-auto"
        style={{ width: PIPELINE_W, height: PIPELINE_H }}
      >
        {/* SVG layer: edges + packet */}
        <svg
          width={PIPELINE_W}
          height={PIPELINE_H}
          className="absolute inset-0 pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Named paths for animateMotion mpath references */}
            {edgePaths.map((d, i) => (
              <path key={i} id={`ep-${i}`} d={d} fill="none" />
            ))}
          </defs>

          {edgePaths.map((d, i) => (
            <AnimatedEdge
              key={i}
              id={`edge-${i}`}
              pathD={d}
              isActive={activePacket?.edgeIndex === i}
              isCompleted={effectiveNodeStates[NODE_IDS[i + 1]] !== 'idle'}
              accentColor={EDGE_COLOR}
            />
          ))}

          {activePacket && (
            <PacketFlow
              key={activePacket.key}
              packetKey={activePacket.key}
              edgeIndex={activePacket.edgeIndex}
              accentColor={EDGE_COLOR}
            />
          )}
        </svg>

        {/* HTML node layer */}
        {NODE_IDS.map((id, i) => (
          <div
            key={id}
            className="absolute"
            style={{
              left: nodeCenters[i] - NODE_W / 2,
              top: NODE_Y - NODE_H / 2,
              width: NODE_W,
              height: NODE_H,
            }}
          >
            <PipelineNode id={id} state={effectiveNodeStates[id]} />
          </div>
        ))}
      </div>
    </div>
  );
}
