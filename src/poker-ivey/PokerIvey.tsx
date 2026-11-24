import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { IveyScene } from "./Scene";
import { IveyHud } from "./Hud";
import { FPS, MUSIC, TL, findBeat } from "./timeline";

export { IVEY_DURATION, FPS as IVEY_FPS } from "./timeline";

export const PokerIvey: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const slow = findBeat("slowmo");
  const reveal = findBeat("reveal");
  const inSlow = t >= slow.start && t < slow.end;
  const revealF = Math.round(reveal.start * FPS);
  return (
    <AbsoluteFill style={{ backgroundColor: "#04070d" }}>
      <AbsoluteFill style={{ filter: inSlow ? "saturate(0.35) contrast(1.15)" : undefined }}>
        <ThreeCanvas width={width} height={height} camera={{ fov: 50, position: [0, 1.16, 0.86], near: 0.02, far: 40 }}>
          <IveyScene t={t} />
        </ThreeCanvas>
      </AbsoluteFill>
      <IveyHud t={t} fps={fps} />
      {/* music: tension bed until the reveal, then the reveal theme */}
      <Sequence from={0} durationInFrames={revealF + 30} layout="none">
        <Audio
          src={staticFile(MUSIC.tension.file)}
          volume={(f) => interpolate(f, [0, 30, revealF - 10, revealF + 25], [0, 0.22, 0.32, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      </Sequence>
      <Sequence from={revealF + 30} layout="none">
        <Audio src={staticFile(MUSIC.reveal.file)} volume={(f) => interpolate(f, [0, 20, 500, 640], [0.5, 0.32, 0.25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      </Sequence>
      {TL.cues.map((c, i) => (
        <Sequence key={i} from={Math.round(c.t * FPS)} layout="none">
          <Audio src={staticFile(c.file)} volume={c.vol ?? 1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
