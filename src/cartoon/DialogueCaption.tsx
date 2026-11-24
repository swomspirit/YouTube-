import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Caption } from "@remotion/captions";

/** One spoken line with the current word highlighted. Use inside a <Sequence>. */
export const DialogueCaption: React.FC<{ captions: Caption[]; color: string; top: number }> = ({ captions, color, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pop = Math.min(1, frame / 4);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top,
          maxWidth: "86%",
          textAlign: "center",
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          fontSize: 76,
          fontWeight: 900,
          lineHeight: 1.15,
          color: "white",
          WebkitTextStroke: "12px #1b1a22",
          paintOrder: "stroke",
          transform: `scale(${0.85 + pop * 0.15})`,
        }}
      >
        {captions.map((c, i) => {
          const active = c.startMs <= ms && c.endMs > ms;
          const space = c.text.match(/^\s*/)?.[0] ?? "";
          return (
            <span key={i}>
              {space}
              <span
                style={{
                  display: "inline-block",
                  margin: "0 0.05em",
                  color: active ? color : "white",
                  transform: active ? "scale(1.1)" : "none",
                }}
              >
                {c.text.trimStart()}
              </span>
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
