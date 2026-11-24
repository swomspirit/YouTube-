import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";

/** Big top-of-screen meme caption, e.g. "Meanwhile, his body:" */
export const MemeText: React.FC<{ text: string; top?: number }> = ({ text, top = 300 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top,
          padding: "14px 34px",
          background: "white",
          border: "7px solid #1b1a22",
          borderRadius: 22,
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          fontSize: 66,
          fontWeight: 900,
          color: "#1b1a22",
          transform: `scale(${s}) rotate(-2deg)`,
          boxShadow: "8px 8px 0 #1b1a22",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
