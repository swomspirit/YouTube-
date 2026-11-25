import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { AstatineScene3D } from "./Scene3D";
import { Overlays } from "./Overlays";
import { DURATION, FPS, MUSIC, TL } from "./timeline";

export { DURATION as ASTATINE_DURATION, FPS as ASTATINE_FPS } from "./timeline";

export const Astatine: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const t = frame / FPS;
  const musicLen = Math.round((MUSIC.bed.durationMs / 1000) * FPS);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #160a2a 0%, #05010f 70%)" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 45, position: [0, 0, 9] }}>
        <AstatineScene3D t={t} />
      </ThreeCanvas>
      <Overlays t={t} fps={FPS} />
      {/* music bed, looped with a short crossfade, ducked under the narration */}
      {[0, 1, 2].map((i) => {
        const from = i * (musicLen - 60);
        if (from >= durationInFrames) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={musicLen} layout="none">
            <Audio
              src={staticFile(MUSIC.bed.file)}
              volume={(f) =>
                interpolate(f, [0, 60, musicLen - 60, musicLen], [i === 0 ? 0.12 : 0, 0.12, 0.12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
                interpolate(from + f, [durationInFrames - 75, durationInFrames - 5], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
              }
            />
          </Sequence>
        );
      })}
      {TL.cues.map((c, i) => (
        <Sequence key={i} from={Math.round(c.t * FPS)} layout="none">
          <Audio src={staticFile(c.file)} volume={c.vol ?? 1} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ backgroundColor: "black", opacity: interpolate(frame, [0, 15], [1, 0], { extrapolateRight: "clamp" }), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
