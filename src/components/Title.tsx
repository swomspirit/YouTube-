import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Title: React.FC<{ title: string; subtitle: string; accentColor: string }> = ({
  title,
  subtitle,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const enter = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  const exit = interpolate(frame, [100, 120], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const base = width / 1920; // scale text for landscape vs vertical

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 120 * base }}>
      <div
        style={{
          opacity: enter * exit,
          transform: `translateY(${(1 - enter) * 40}px)`,
          textAlign: "center",
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          color: "white",
        }}
      >
        <div style={{ fontSize: 110 * Math.max(base, 0.8), fontWeight: 800, letterSpacing: -2 }}>{title}</div>
        <div style={{ fontSize: 44 * Math.max(base, 0.8), color: accentColor, fontWeight: 600 }}>{subtitle}</div>
      </div>
    </AbsoluteFill>
  );
};
