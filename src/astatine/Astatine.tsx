import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { AstatineScene3D } from "./Scene3D";
import { Overlays } from "./Overlays";
import { FPS, LINES, MUSIC, SFX, TL, vis } from "./timeline";

/** Score level: fuller in the gaps between lines, ducked (smoothly) under the voice. */
const VOICE = TL.beats.filter((b) => b.id).map((b) => [b.voiceAt, b.voiceAt + LINES[b.id!].durationMs / 1000] as const);
const scoreVolume = (t: number) => {
  let duck = 0;
  for (const [a, b] of VOICE) {
    const k = Math.min(1, Math.max(0, Math.min((t - a + 0.35) / 0.35, (b + 0.6 - t) / 0.6)));
    duck = Math.max(duck, k);
  }
  return 0.42 - 0.24 * duck;
};

export { DURATION as ASTATINE_DURATION, FPS as ASTATINE_FPS } from "./timeline";

export const Astatine: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #160a2a 0%, #05010f 70%)" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 45, position: [0, 0, 9] }}>
        <AstatineScene3D t={t} />
      </ThreeCanvas>
      <Overlays t={t} fps={FPS} />
      {/* the score: one ElevenLabs Music composition, scored section by section to this timeline.
          It swells between lines and dips under the narration. */}
      <Audio src={staticFile(MUSIC.score.file)} volume={(f) => scoreVolume(f / FPS) * interpolate(f, [durationInFrames - 60, durationInFrames - 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {/* deep-space ambience (seamless ElevenLabs loop) under the space scenes */}
      <Audio src={staticFile(SFX.space.file)} loop volume={(f) => 0.5 * Math.max(vis(["cosmos", "planets"], f / FPS, 1.5, 2), vis(["finale", "outro"], f / FPS, 2, 1.5))} />
      {TL.cues.map((c, i) => (
        <Sequence key={i} from={Math.round(c.t * FPS)} layout="none">
          <Audio src={staticFile(c.file)} volume={c.vol ?? 1} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ backgroundColor: "black", opacity: interpolate(frame, [0, 15], [1, 0], { extrapolateRight: "clamp" }), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
