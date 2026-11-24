import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { PokerScene } from "./Table3D";
import { Hud } from "./Hud";
import { FPS, SFX, TL } from "./timeline";

export { POKER_DURATION, FPS as POKER_FPS } from "./timeline";

export const PokerJacks: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0709" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 52, position: [0, 1.24, 1.12], near: 0.02, far: 40 }}>
        <PokerScene t={t} />
      </ThreeCanvas>
      <Hud t={t} fps={fps} />
      {/* room tone */}
      <Audio src={staticFile(SFX.ambience.file)} volume={0.22} loop />
      {TL.cues.map((c, i) => (
        <Sequence key={i} from={Math.round(c.t * FPS)} layout="none">
          <Audio src={staticFile(c.file)} volume={c.vol ?? 1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
