import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { PokerScene2D } from "./Scene2D";
import { IveyHud2D } from "./Hud2D";
import { FPS, MUSIC, SFX, TL, findBeat } from "./timeline";

/** Gentle camera moves for the 2D table (no gimmicks). */
const camera = (t: number) => {
  const slow = findBeat("slowmo");
  const reveal = findBeat("reveal");
  let cx = 960;
  let cy = 540;
  let z = 1;
  if (t >= slow.start && t < slow.end) {
    const k = Math.min(1, (t - slow.start) / 3);
    cx = 960 + (1360 - 960) * k * 0.8;
    cy = 540 - 120 * k;
    z = 1 + 0.45 * k;
  } else if (t >= reveal.start && t < reveal.end) {
    const k = Math.min(1, (t - reveal.start) / 0.8);
    cx = 960 + 300 * k;
    cy = 540 + 120 * k;
    z = 1 + 0.35 * k;
  }
  return `translate(960 540) scale(${z}) translate(${-cx} ${-cy})`;
};

export const PokerIvey2D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const reveal = findBeat("reveal");
  const revealF = Math.round(reveal.start * FPS);
  // these cues belonged to the cinematic version; keep the 2D one calmer
  const skip = new Set([SFX.slowmo.file, SFX.heartbeat.file, SFX.boom.file]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#1c1418" }}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <g transform={camera(t)}>
          <PokerScene2D t={t} />
        </g>
      </svg>
      <IveyHud2D t={t} fps={fps} />
      <Sequence from={0} durationInFrames={revealF + 30} layout="none">
        <Audio
          src={staticFile(MUSIC.tension.file)}
          loop
          volume={(f) => interpolate(f, [0, 30, revealF - 10, revealF + 25], [0, 0.14, 0.2, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      </Sequence>
      <Sequence from={revealF + 30} layout="none">
        <Audio src={staticFile(MUSIC.reveal.file)} volume={(f) => interpolate(f, [0, 20, 500, 640], [0.35, 0.22, 0.18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      </Sequence>
      {TL.cues
        .filter((c) => !skip.has(c.file))
        .map((c, i) => (
          <Sequence key={i} from={Math.round(c.t * FPS)} layout="none">
            <Audio src={staticFile(c.file)} volume={c.vol ?? 1} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
