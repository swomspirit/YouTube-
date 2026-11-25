import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { PokerScene2D } from "./Scene2D";
import { IveyHud2D } from "./Hud2D";
import { FPS, LINES, MUSIC, SFX, TL, findBeat } from "./timeline";

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

/** Light comedic sound touches for the "fun" cut, all tied to lines the narration already has. */
const funCues = () => {
  const cues: { t: number; file: string; vol?: number }[] = [];
  const beat = (id: string) => TL.beats.find((b) => (b.step as { id?: string }).id === id);
  const end = (id: string) => {
    const b = beat(id);
    return b ? b.start + LINES[id].durationMs / 1000 : 0;
  };
  // crickets after "Is he even breathing?"
  cues.push({ t: end("c_call") + 0.05, file: SFX.crickets.file, vol: 0.45 });
  // cha-ching when the hero bets 125K into the "weak" player
  const bet125 = TL.acts.find((a) => a.act.a === "bet" && a.act.who === "hero" && a.act.to === 125000);
  if (bet125) cues.push({ t: bet125.t + 0.35, file: SFX.register.file, vol: 0.5 });
  // nervous gulp right before "I... call"
  const dec = beat("m_decide");
  if (dec) cues.push({ t: dec.start - 0.45, file: SFX.gulp.file, vol: 0.8 });
  // sad trombone + ghost under "cool cool cool"
  const cool = beat("m_cool");
  if (cool) cues.push({ t: cool.start + 0.3, file: SFX.ghost.file, vol: 0.45 }, { t: end("m_cool") + 0.15, file: SFX.trombone.file, vol: 0.55 });
  // a tiny "ding" each time Ivey checks (feeds the check counter)
  for (const a of TL.acts) if (a.act.a === "check" && a.act.who === "ivey") cues.push({ t: a.t + 0.35, file: SFX.pop.file, vol: 0.45 });
  return cues;
};

export const PokerIvey2D: React.FC<{ fun?: boolean }> = ({ fun = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const reveal = findBeat("reveal");
  const revealF = Math.round(reveal.start * FPS);
  // these cues belonged to the cinematic version; keep the 2D one calmer
  // (the fun cut keeps the dramatic check-raise stingers)
  const skip = new Set(fun ? [] : [SFX.slowmo.file, SFX.heartbeat.file, SFX.boom.file]);
  const cues = fun ? [...TL.cues, ...funCues()] : TL.cues;
  return (
    <AbsoluteFill style={{ backgroundColor: "#1c1418" }}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <g transform={camera(t)}>
          <PokerScene2D t={t} />
        </g>
      </svg>
      <IveyHud2D t={t} fps={fps} fun={fun} />
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
      {cues
        .filter((c) => !skip.has(c.file))
        .map((c, i) => (
          <Sequence key={i} from={Math.round(c.t * FPS)} layout="none">
            <Audio src={staticFile(c.file)} volume={c.vol ?? 1} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
