import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import narration from "../reels/piano-levels/audio.generated.json";
import song1 from "./level1-ode-to-joy.notes.json";
import song2 from "./level2-fur-elise.notes.json";
import song3 from "./level3-maple-leaf-rag.notes.json";
import { prepareSong, pressAmount, upperBound, LH_COLOR, RH_COLOR, type Song } from "./notes";
import { Keyboard } from "./Keyboard";
import { FallingNotes } from "./FallingNotes";
import { Pianist, type Mood } from "./Pianist";
import { Room } from "./Room";

export const FPS = 30;
const lines = narration.lines as Record<string, { file: string; durationMs: number }>;
const sfx = narration.sfx as Record<string, { file: string; durationMs: number }>;

const LEVELS = [
  { n: 1, name: "EASY", color: "#4ade80", stars: 1, title: "Ode to Joy", composer: "Ludwig van Beethoven", file: "piano/level1-ode-to-joy.mp3", song: prepareSong(song1 as Song), voice: "level1", mood: "easy" as Mood, lookahead: 3 },
  { n: 2, name: "MEDIUM", color: "#fbbf24", stars: 2, title: "Für Elise", composer: "Ludwig van Beethoven", file: "piano/level2-fur-elise.mp3", song: prepareSong(song2 as Song), voice: "level2", mood: "medium" as Mood, lookahead: 2.2 },
  { n: 3, name: "HARD", color: "#f87171", stars: 3, title: "Maple Leaf Rag", composer: "Scott Joplin", file: "piano/level3-maple-leaf-rag.mp3", song: prepareSong(song3 as Song), voice: "level3", mood: "hard" as Mood, lookahead: 1.6 },
];

const f = (sec: number) => Math.round(sec * FPS);

/** Build the whole timeline (frames) from real audio lengths. */
const buildTimeline = () => {
  let t = 15;
  const intro = { start: t, end: t + f(lines.intro.durationMs / 1000) + 20 };
  t = intro.end;
  const levels = LEVELS.map((lv) => {
    const card = { start: t, end: t + f(lines[lv.voice].durationMs / 1000) + 25 };
    t = card.end;
    const play = { start: t, end: t + f(lv.song.duration) };
    t = play.end;
    const clear = { start: t, end: t + 75 };
    t = clear.end;
    return { ...lv, card, play, clear };
  });
  const outro = { start: t, end: t + f(lines.outro.durationMs / 1000) + 90 };
  return { intro, levels, outro, end: outro.end };
};
const TL = buildTimeline();
export const PIANO_LEVELS_DURATION = TL.end;

const KEY_TOP = 900;
const KEY_H = 180;
const NOTES_TOP = 600;

const Stars: React.FC<{ n: number; color: string; size: number }> = ({ n, color, size }) => (
  <div style={{ display: "flex", gap: size * 0.2 }}>
    {[1, 2, 3].map((i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24">
        <path
          d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z"
          fill={i <= n ? color : "rgba(255,255,255,0.15)"}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={1}
        />
      </svg>
    ))}
  </div>
);

const FONT = "Inter, Helvetica, Arial, sans-serif";

export const PianoLevels: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Which level are we in (card, play or clear)?
  const current = TL.levels.find((l) => frame >= l.card.start && frame < l.clear.end) ?? null;
  const playing = current && frame >= current.play.start && frame < current.play.end ? current : null;
  const now = playing ? (frame - playing.play.start) / fps : current && frame < current.play.start ? -1 : 1e9;
  const song = current?.song ?? null;

  // Active notes on the keyboard
  const active = [];
  if (playing && song) {
    const from = upperBound(song.starts, now - song.maxDur);
    const to = upperBound(song.starts, now);
    for (let i = from; i < to; i++) {
      const n = song.notes[i];
      if (n.t <= now && n.t + n.d > now) active.push(n);
    }
  }

  let mood: Mood = "idle";
  if (playing) mood = playing.mood;
  else if (frame >= TL.outro.start) mood = "victory";
  else if (current && frame >= current.clear.start) mood = "victory";
  const pressL = playing && song ? pressAmount(song.onsetsL, now) : 0;
  const pressR = playing && song ? pressAmount(song.onsetsR, now) : 0;

  // ---------- title / level cards ----------
  const introIn = spring({ frame: frame - TL.intro.start, fps, config: { damping: 14 } });
  const introOut = interpolate(frame, [TL.intro.end - 12, TL.intro.end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cardLevel = TL.levels.find((l) => frame >= l.card.start && frame < l.card.end);
  const cardIn = cardLevel ? spring({ frame: frame - cardLevel.card.start, fps, config: { damping: 13 } }) : 0;
  const cardOut = cardLevel
    ? interpolate(frame, [cardLevel.card.end - 12, cardLevel.card.end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  const clearLevel = TL.levels.find((l) => frame >= l.clear.start && frame < l.clear.end);
  const clearIn = clearLevel ? spring({ frame: frame - clearLevel.clear.start, fps, config: { damping: 10 } }) : 0;

  const progress = playing ? Math.min(1, now / playing.song.duration) : current && frame >= current.play.end ? 1 : 0;
  const dim = Math.max(introIn * introOut, cardIn * cardOut) * 0.55;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0e0d16" }}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <Room t={t} />
        <g transform="translate(40,0)">
          <Pianist mood={mood} pressL={pressL} pressR={pressR} t={t} />
        </g>
        <FallingNotes song={playing ? song : null} now={now} top={NOTES_TOP} height={KEY_TOP - NOTES_TOP} width={1920} lookahead={current?.lookahead ?? 2.5} />
        <Keyboard y={KEY_TOP} width={1920} height={KEY_H} active={active} />
      </svg>

      {/* level panel (top right) */}
      {current ? (
        <div
          style={{
            position: "absolute",
            left: 1270,
            top: 90,
            width: 560,
            padding: "30px 38px",
            borderRadius: 26,
            background: "rgba(14,13,22,0.72)",
            border: `3px solid ${current.color}`,
            fontFamily: FONT,
            color: "white",
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 6, opacity: 0.75 }}>LEVEL {current.n}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 4 }}>
            <div style={{ fontSize: 84, fontWeight: 900, color: current.color, lineHeight: 1 }}>{current.name}</div>
            <Stars n={current.stars} color={current.color} size={50} />
          </div>
          <div style={{ fontSize: 46, fontWeight: 800, marginTop: 22 }}>{current.title}</div>
          <div style={{ fontSize: 28, opacity: 0.7, marginTop: 4 }}>{current.composer}</div>
          <div style={{ height: 14, borderRadius: 7, background: "rgba(255,255,255,0.15)", marginTop: 26, overflow: "hidden" }}>
            <div style={{ width: `${progress * 100}%`, height: "100%", background: current.color }} />
          </div>
          <div style={{ display: "flex", gap: 26, marginTop: 18, fontSize: 24, opacity: 0.8 }}>
            <span><span style={{ color: RH_COLOR }}>■</span> Right hand</span>
            <span><span style={{ color: LH_COLOR }}>■</span> Left hand</span>
          </div>
        </div>
      ) : null}

      {/* dim layer behind big cards */}
      <AbsoluteFill style={{ backgroundColor: "black", opacity: dim }} />

      {/* intro title */}
      {frame < TL.intro.end ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "white", opacity: introOut }}>
          <div style={{ transform: `scale(${introIn})`, textAlign: "center" }}>
            <div style={{ fontSize: 150, fontWeight: 900, letterSpacing: -3, textShadow: "0 8px 30px rgba(0,0,0,0.6)" }}>3 LEVELS OF PIANO</div>
            <div style={{ display: "flex", gap: 50, justifyContent: "center", marginTop: 20 }}>
              {LEVELS.map((l) => (
                <div key={l.n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <Stars n={l.stars} color={l.color} size={46} />
                  <div style={{ fontSize: 40, fontWeight: 800, color: l.color }}>{l.name}</div>
                </div>
              ))}
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* level intro card */}
      {cardLevel ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "white", opacity: cardOut }}>
          <div
            style={{
              transform: `scale(${cardIn})`,
              textAlign: "center",
              padding: "50px 90px",
              borderRadius: 40,
              background: "rgba(14,13,22,0.9)",
              border: `5px solid ${cardLevel.color}`,
            }}
          >
            <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: 10, opacity: 0.8 }}>LEVEL {cardLevel.n}</div>
            <div style={{ fontSize: 170, fontWeight: 900, color: cardLevel.color, lineHeight: 1.05 }}>{cardLevel.name}</div>
            <div style={{ display: "flex", justifyContent: "center", margin: "10px 0 20px" }}>
              <Stars n={cardLevel.stars} color={cardLevel.color} size={70} />
            </div>
            <div style={{ fontSize: 64, fontWeight: 800 }}>{cardLevel.title}</div>
            <div style={{ fontSize: 36, opacity: 0.7 }}>{cardLevel.composer}</div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* level clear */}
      {clearLevel ? (
        <AbsoluteFill style={{ alignItems: "center", fontFamily: FONT }}>
          <div
            style={{
              position: "absolute",
              top: 660,
              transform: `scale(${clearIn}) rotate(-3deg)`,
              fontSize: 110,
              fontWeight: 900,
              color: clearLevel.color,
              WebkitTextStroke: "10px #0e0d16",
              paintOrder: "stroke",
              textShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            LEVEL {clearLevel.n} CLEAR!
          </div>
        </AbsoluteFill>
      ) : null}

      {/* outro */}
      {frame >= TL.outro.start ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "white" }}>
          <div
            style={{
              transform: `scale(${spring({ frame: frame - TL.outro.start, fps, config: { damping: 14 } })})`,
              textAlign: "center",
              padding: "40px 80px",
              borderRadius: 36,
              background: "rgba(14,13,22,0.88)",
              border: "5px solid white",
              marginTop: 420,
            }}
          >
            <div style={{ fontSize: 88, fontWeight: 900 }}>Which level are you?</div>
            <div style={{ display: "flex", gap: 50, justifyContent: "center", marginTop: 16 }}>
              {LEVELS.map((l) => (
                <div key={l.n} style={{ fontSize: 48, fontWeight: 800, color: l.color }}>
                  {l.n}. {l.name}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 36, opacity: 0.75, marginTop: 14 }}>Tell me in the comments 👇</div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* ---------- audio ---------- */}
      <Sequence from={TL.intro.start} layout="none">
        <Audio src={staticFile(lines.intro.file)} />
      </Sequence>
      {TL.levels.map((l) => (
        <Sequence key={`v${l.n}`} from={l.card.start + 6} layout="none">
          <Audio src={staticFile(lines[l.voice].file)} />
        </Sequence>
      ))}
      {TL.levels.map((l) => (
        <Sequence key={`s${l.n}`} from={l.play.start} durationInFrames={l.play.end - l.play.start} layout="none">
          <Audio src={staticFile(l.file)} />
        </Sequence>
      ))}
      {TL.levels.map((l) => (
        <Sequence key={`c${l.n}`} from={l.clear.start} layout="none">
          <Audio src={staticFile(sfx.levelup.file)} volume={0.6} />
          <Audio src={staticFile(sfx.applause.file)} volume={0.45} />
        </Sequence>
      ))}
      <Sequence from={TL.outro.start} layout="none">
        <Audio src={staticFile(lines.outro.file)} />
      </Sequence>
    </AbsoluteFill>
  );
};
