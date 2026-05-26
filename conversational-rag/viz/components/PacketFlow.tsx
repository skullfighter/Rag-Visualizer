'use client';

interface Props {
  packetKey: number;
  edgeIndex: number;
  accentColor: string;
}

// Rendered inside the pipeline SVG — uses SVG animateMotion
export default function PacketFlow({ packetKey, edgeIndex, accentColor }: Props) {
  const filterId = `pf-glow-${packetKey}`;
  const motionPathId = `ep-${edgeIndex}`;

  return (
    <g key={packetKey}>
      <defs>
        <filter id={filterId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer halo */}
      <circle r={10} fill={accentColor} opacity={0.15}>
        <animateMotion
          dur="0.65s"
          fill="freeze"
          calcMode="spline"
          keyTimes="0;1"
          keySplines="0.42,0,0.58,1"
        >
          <mpath href={`#${motionPathId}`} />
        </animateMotion>
      </circle>

      {/* Core dot */}
      <circle r={4.5} fill={accentColor} filter={`url(#${filterId})`}>
        <animateMotion
          dur="0.65s"
          fill="freeze"
          calcMode="spline"
          keyTimes="0;1"
          keySplines="0.42,0,0.58,1"
        >
          <mpath href={`#${motionPathId}`} />
        </animateMotion>
      </circle>

      {/* Bright center */}
      <circle r={2} fill="white" opacity={0.9}>
        <animateMotion
          dur="0.65s"
          fill="freeze"
          calcMode="spline"
          keyTimes="0;1"
          keySplines="0.42,0,0.58,1"
        >
          <mpath href={`#${motionPathId}`} />
        </animateMotion>
      </circle>
    </g>
  );
}
