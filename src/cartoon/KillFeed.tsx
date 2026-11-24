import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const KillFeed: React.FC<{ killer: string; victim: string; killerColor: string; victimColor: string }> = ({
  killer,
  victim,
  killerColor,
  victimColor,
}) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 6], [400, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 190,
          right: 40,
          transform: `translateX(${x}px)`,
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "14px 28px",
          background: "rgba(20,18,30,0.85)",
          borderLeft: `8px solid ${killerColor}`,
          borderRadius: 10,
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          fontWeight: 800,
          fontSize: 46,
          color: "white",
        }}
      >
        <span style={{ color: killerColor }}>{killer}</span>
        <svg width={90} height={36} viewBox="0 0 90 36">
          <path d="M4 20 L60 12 L86 18 L60 24 Z" fill="white" />
          <rect x={2} y={14} width={22} height={12} rx={3} fill="#bbb" />
        </svg>
        <span style={{ color: victimColor }}>{victim}</span>
      </div>
    </AbsoluteFill>
  );
};
