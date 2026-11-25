import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { PokerScene2D } from "./Scene2D";
import { IveyHud2D } from "./Hud2D";
import { FPS, MUSIC, TL, beatAt, findBeat, type Gag } from "./timeline";

export { IVEY_DURATION as IVEY_FUNNY_DURATION, FPS as IVEY_FUNNY_FPS } from "./timeline";

const ease = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** The frozen "that's me" moment the cold open shows (soul halfway out of the body). */
export const coldFreezeT = () => findBeat("voice", "m_cool").start + 0.6;

/** Camera: punch-ins for the gags, slow push for the check-raise and reveal. */
const camera = (t: number) => {
  const b = beatAt(t);
  const slow = findBeat("slowmo");
  const reveal = findBeat("reveal");
  let cx = 960;
  let cy = 540;
  let z = 1;
  const into = (tx: number, ty: number, tz: number, inT = 0.5, outT = 0.4) => {
    const k = ease((t - b.start) / inT) * (1 - ease((t - (b.end - outT)) / outT));
    cx = 960 + (tx - 960) * k;
    cy = 540 + (ty - 540) * k;
    z = 1 + (tz - 1) * k;
  };
  const gag = b.step.k === "gag" ? (b.step as { gag: Gag }).gag : null;
  if (b.step.k === "cold") {
    // tight on the hero + her ghost: keeps Ivey's cards and the board out of frame (no spoiler)
    cx = 640;
    cy = 390;
    z = 1.5;
  } else if (gag === "stats") into(1260, 470, 1.3);
  else if (gag === "brain") into(1360, 400, 1.45);
  else if (gag === "phone") into(640, 470, 1.35);
  else if (gag === "yacht") into(760, 470, 1.15);
  else if (t >= slow.start && t < slow.end) {
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

export const PokerIveyFunny: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const b = beatAt(t);
  const rewind = findBeat("rewind");
  const reveal = findBeat("reveal");
  const revealF = Math.round(reveal.start * FPS);
  const musicF = Math.round(rewind.end * FPS);

  // cold open = frozen future frame; rewind = scrub the whole hand backwards to the start
  let sceneT = t;
  let filter = "none";
  let jitter = 0;
  if (b.step.k === "cold") {
    sceneT = coldFreezeT();
    filter = "saturate(0.35) sepia(0.3) contrast(1.05)";
  } else if (b.step.k === "rewind") {
    const k = ease((t - b.start) / (b.end - b.start));
    sceneT = coldFreezeT() * (1 - k);
    filter = `contrast(1.2) saturate(1.4) hue-rotate(${Math.sin(t * 40) * 12}deg)`;
    jitter = Math.sin(t * 97) * 8;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#1c1418" }}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute", inset: 0, filter, transform: `translateX(${jitter}px)` }}>
        <g transform={camera(t)}>
          <PokerScene2D t={sceneT} />
        </g>
      </svg>
      <IveyHud2D t={t} fps={fps} />
      <Sequence from={musicF} durationInFrames={revealF + 30 - musicF} layout="none">
        <Audio
          src={staticFile(MUSIC.tension.file)}
          loop
          volume={(f) => interpolate(f, [0, 30, revealF - musicF - 10, revealF - musicF + 25], [0, 0.13, 0.2, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      </Sequence>
      <Sequence from={revealF + 30} layout="none">
        <Audio src={staticFile(MUSIC.reveal.file)} volume={(f) => interpolate(f, [0, 20, 500, 640], [0.35, 0.2, 0.16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      </Sequence>
      {TL.cues.map((c, i) => (
        <Sequence key={i} from={Math.round(c.t * FPS)} layout="none">
          <Audio src={staticFile(c.file)} volume={c.vol ?? 1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
