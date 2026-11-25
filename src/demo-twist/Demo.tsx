import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import audio from "../reels/poker-ivey/audio.generated.json";
import { Casino } from "./Casino";

/*
 * DEMO (vertical, ~7 s): "2D characters in a 3D casino" style test.
 * Shot 1: wide high angle on the table + crowd. Shot 2: close-up on the Ivey character.
 * Big word-by-word captions on one narration line.
 */
type Cap = { text: string; startMs: number; endMs: number };
const line = (audio.lines as Record<string, { file: string; durationMs: number; captions: Cap[] }>).c_river;
export const DEMO_DURATION = Math.ceil((line.durationMs / 1000 + 1.2) * 30);

const lerp = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k) as [number, number, number];
const ease = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

export const TwistDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const cut = 3.6;
  const shot1 = t < cut;
  const k = shot1 ? ease(t / cut) : ease((t - cut) / 3);
  const cam = shot1
    ? { pos: lerp([0.35, 2.6, 3.7], [0.3, 2.35, 3.15], k), target: [0, 0.8, -0.35] as [number, number, number], fov: 56 }
    : { pos: lerp([0.1, 1.3, 0.75], [0.12, 1.27, 0.5], k), target: [0.15, 1.08, -1.0] as [number, number, number], fov: 42 };
  const ms = (t - 0.3) * 1000;
  const word = line.captions.find((c) => ms >= c.startMs && ms < c.endMs + 120);
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a0f0c" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 58, position: [0, 3, 3.6], near: 0.05, far: 40 }}>
        <Casino t={t} iveyExpr={t > cut + 1.5 ? "smirk" : "neutral"} cam={cam} />
      </ThreeCanvas>
      {word ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              marginTop: 520,
              fontFamily: "Inter, Arial",
              fontSize: 120,
              fontWeight: 900,
              color: "white",
              WebkitTextStroke: "16px #111",
              paintOrder: "stroke",
              transform: `scale(${interpolate(ms - word.startMs, [0, 90], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
            }}
          >
            {word.text.trim().replace(/[.,]/g, "")}
          </div>
        </AbsoluteFill>
      ) : null}
      <Sequence from={9} layout="none">
        <Audio src={staticFile(line.file)} />
      </Sequence>
    </AbsoluteFill>
  );
};
