import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { EinsteinScene3D } from "./Scene3D";
import { Overlays } from "./Overlays";
import { Backdrops, Host } from "./Art";
import { FPS, LINES, MUSIC, TL } from "./timeline";

export { DURATION as EINSTEIN_DURATION, FPS as EINSTEIN_FPS } from "./timeline";

/** Score level: fuller between lines, ducked under the narration. */
const VOICE = TL.beats.filter((b) => b.id).map((b) => [b.voiceAt, b.voiceAt + LINES[b.id!].durationMs / 1000] as const);
const scoreVolume = (t: number) => {
  let duck = 0;
  for (const [a, b] of VOICE) duck = Math.max(duck, Math.min(1, Math.max(0, Math.min((t - a + 0.35) / 0.35, (b + 0.6 - t) / 0.6))));
  return 0.4 - 0.23 * duck;
};

export const Einstein: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{ background: "#04050f" }}>
      <Backdrops t={t} />
      <ThreeCanvas width={width} height={height} camera={{ fov: 45, position: [0, 0, 9] }}>
        <EinsteinScene3D t={t} />
      </ThreeCanvas>
      <Host t={t} fps={FPS} />
      <Overlays t={t} fps={FPS} />
      <Audio src={staticFile(MUSIC.score.file)} volume={(f) => scoreVolume(f / FPS) * interpolate(f, [durationInFrames - 60, durationInFrames - 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {TL.cues.map((c, i) => (
        <Sequence key={i} from={Math.round(c.t * FPS)} layout="none">
          <Audio src={staticFile(c.file)} volume={c.vol ?? 1} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ backgroundColor: "black", opacity: interpolate(frame, [0, 15], [1, 0], { extrapolateRight: "clamp" }), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
