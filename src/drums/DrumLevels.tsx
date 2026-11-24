import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import narration from "../reels/drum-levels/audio.generated.json";
import perf1 from "./level1-rock.hits.json";
import perf2 from "./level2-funk.hits.json";
import perf3 from "./level3-metal.hits.json";
import { hitsPerSecond, impulse, preparePerformance, type Performance } from "./hits";
import { DrumStage } from "./Stage3D";
import { CameraDirector, shotForBar, type ShotName } from "./CameraDirector";
import { Highway } from "./Highway";
import { DrumScene2D, type Mood } from "../drums2d/Scene2D";
import { SHOTS2D, cameraTransform, shot2dForBar } from "../drums2d/Camera2D";

export const FPS = 30;
const lines = narration.lines as Record<string, { file: string; durationMs: number }>;
const sfx = narration.sfx as Record<string, { file: string; durationMs: number }>;

const LEVELS = [
  { n: 1, name: "EASY", color: "#4ade80", stars: 1, title: "Basic Rock Beat", file: "drums/level1-rock.mp3", perf: preparePerformance(perf1 as Performance), voice: "level1", ahead: 2.6 },
  { n: 2, name: "MEDIUM", color: "#fbbf24", stars: 2, title: "Funk Groove", file: "drums/level2-funk.mp3", perf: preparePerformance(perf2 as Performance), voice: "level2", ahead: 2.0 },
  { n: 3, name: "HARD", color: "#ff3b5c", stars: 3, title: "Metal + Drum Solo", file: "drums/level3-metal.mp3", perf: preparePerformance(perf3 as Performance), voice: "level3", ahead: 1.4 },
];
const f = (sec: number) => Math.round(sec * FPS);

const buildTimeline = () => {
  let t = 0;
  const intro = { start: t, end: t + f(lines.intro.durationMs / 1000) + 45 };
  t = intro.end;
  const levels = LEVELS.map((lv) => {
    const card = { start: t, end: t + f(lines[lv.voice].durationMs / 1000) + 30 };
    t = card.end;
    const play = { start: t, end: t + f(lv.perf.duration) };
    t = play.end;
    const clear = { start: t, end: t + 90 };
    t = clear.end;
    return { ...lv, card, play, clear };
  });
  const outro = { start: t, end: t + f(lines.outro.durationMs / 1000) + 100 };
  return { intro, levels, outro, end: outro.end };
};
const TL = buildTimeline();
export const DRUM_LEVELS_DURATION = TL.end;

const FONT = "Inter, Helvetica, Arial, sans-serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Stars: React.FC<{ n: number; color: string; size: number }> = ({ n, color, size }) => (
  <div style={{ display: "flex", gap: size * 0.15 }}>
    {[1, 2, 3].map((i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24">
        <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z" fill={i <= n ? color : "rgba(255,255,255,0.15)"} />
      </svg>
    ))}
  </div>
);

export const DrumLevels: React.FC<{ look?: "3d" | "2d" }> = ({ look = "3d" }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const current = TL.levels.find((l) => frame >= l.card.start && frame < l.clear.end) ?? null;
  const playing = current && frame >= current.play.start && frame < current.play.end ? current : null;
  const now = playing ? (frame - playing.play.start) / fps : -10;
  const perf = playing ? playing.perf : null;
  const accent = current?.color ?? (frame >= TL.outro.start ? "#a78bfa" : "#a78bfa");
  const energy = playing ? playing.n / 3 : 0.15;

  // ---- camera ----
  let shot: ShotName = "orbit";
  let shotStart = 0;
  if (playing) {
    const bar = Math.floor((now - playing.perf.countIn) / playing.perf.barLen);
    shot = shotForBar(playing.n, bar);
    const every = playing.n === 3 ? 2 : 4;
    const shotBar = Math.floor(Math.max(0, bar) / every) * every;
    shotStart = bar < 0 ? 0 : playing.perf.countIn + shotBar * playing.perf.barLen;
  } else if (frame < TL.intro.end) {
    shot = "orbit";
    shotStart = -6;
  } else if (current && frame < current.play.start) {
    shot = "orbit";
    shotStart = (current.card.start / fps) * 0.37;
  } else if (current) {
    shot = "wide";
    shotStart = current.clear.start / fps - 2;
  } else {
    shot = "orbit";
    shotStart = 0;
  }
  const u = playing ? now - shotStart : t - shotStart;
  const crashImp = perf ? Math.max(impulse(perf.byPiece.crash, now, 0.18), impulse(perf.byPiece.china, now, 0.18)) : 0;
  const shake = playing?.n === 3 ? crashImp * 0.03 + impulse(perf!.byPiece.kick, now, 0.05) * 0.004 : 0;

  // ---- overlays ----
  const introIn = spring({ frame: frame - 10, fps, config: { damping: 14 } });
  const introOut = interpolate(frame, [TL.intro.end - 15, TL.intro.end], [1, 0], clamp);
  const cardLevel = TL.levels.find((l) => frame >= l.card.start && frame < l.card.end);
  const cardIn = cardLevel ? spring({ frame: frame - cardLevel.card.start, fps, config: { damping: 13 } }) : 0;
  const cardOut = cardLevel ? interpolate(frame, [cardLevel.card.end - 12, cardLevel.card.end], [1, 0], clamp) : 0;
  const clearLevel = TL.levels.find((l) => frame >= l.clear.start && frame < l.clear.end);
  const clearIn = clearLevel ? spring({ frame: frame - clearLevel.clear.start, fps, config: { damping: 9 } }) : 0;
  const progress = playing ? Math.min(1, now / playing.perf.duration) : current && frame >= current.play.end ? 1 : 0;
  const hps = playing ? hitsPerSecond(playing.perf, now) : 0;
  const flashWhite = playing?.n === 3 ? crashImp * 0.12 : crashImp * 0.05;

  return (
    <AbsoluteFill style={{ backgroundColor: "#05040a" }}>
      {look === "3d" ? (
        <ThreeCanvas width={width} height={height} camera={{ fov: 42, position: [0, 1.5, 3.7], near: 0.05, far: 60 }}>
          <CameraDirector shot={shot} u={u} shake={shake} seed={frame} />
          <DrumStage perf={perf} now={now} accent={accent} energy={energy} t={t} />
        </ThreeCanvas>
      ) : (
        (() => {
          let s2 = SHOTS2D.wide;
          let drift = 0;
          if (playing) {
            const bar = Math.floor((now - playing.perf.countIn) / playing.perf.barLen);
            s2 = bar < 0 ? SHOTS2D.mid : shot2dForBar(playing.n, bar);
            drift = Math.min(1, Math.max(0, u / (playing.perf.barLen * (playing.n === 3 ? 2 : 4))));
          } else if (current && frame < current.play.start) {
            s2 = SHOTS2D.mid;
            drift = (frame - current.card.start) / (current.card.end - current.card.start);
          } else if (frame >= TL.outro.start || (current && frame >= current.clear.start)) {
            s2 = SHOTS2D.crowd;
          }
          const mood: Mood = playing ? (["chill", "focus", "beast"] as Mood[])[playing.n - 1] : current && frame >= current.play.end ? "victory" : frame >= TL.outro.start ? "victory" : "idle";
          const hype = playing ? playing.n / 3 : current && frame >= current.play.end ? 1 : frame >= TL.outro.start ? 1 : 0.25;
          const shakePx = shake * 900;
          return (
            <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ position: "absolute", inset: 0 }}>
              <g transform={cameraTransform(s2, width, 430, 1.1, drift, crashImp, Math.sin(frame * 7.1) * shakePx, Math.cos(frame * 5.3) * shakePx)}>
                <DrumScene2D perf={perf} now={now} t={t} accent={accent} mood={mood} crowdHype={hype} />
              </g>
            </svg>
          );
        })()
      )}

      <AbsoluteFill style={{ backgroundColor: "white", opacity: flashWhite, mixBlendMode: "overlay" }} />

      {/* note lane */}
      {current ? <Highway perf={perf} now={now} accent={accent} ahead={current.ahead} /> : null}

      {/* level panel */}
      {current ? (
        <div
          style={{
            position: "absolute",
            left: 50,
            top: 46,
            padding: "22px 30px 24px",
            width: 470,
            borderRadius: 22,
            background: "rgba(8,7,14,0.62)",
            backdropFilter: "blur(10px)",
            border: `2px solid ${current.color}`,
            fontFamily: FONT,
            color: "white",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 5, opacity: 0.7 }}>LEVEL {current.n}</div>
            <Stars n={current.stars} color={current.color} size={34} />
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, color: current.color, lineHeight: 1, marginTop: 4 }}>{current.name}</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 10 }}>{current.title}</div>
          <div style={{ display: "flex", gap: 30, marginTop: 14, fontSize: 20, opacity: 0.85 }}>
            <div>
              <div style={{ opacity: 0.6, fontSize: 15, letterSpacing: 2 }}>TEMPO</div>
              <div style={{ fontSize: 34, fontWeight: 900 }}>{current.perf.bpm}<span style={{ fontSize: 18, opacity: 0.6 }}> BPM</span></div>
            </div>
            <div>
              <div style={{ opacity: 0.6, fontSize: 15, letterSpacing: 2 }}>HITS / SEC</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: hps >= 20 ? "#ff3b5c" : "white" }}>{hps}</div>
            </div>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.15)", marginTop: 16, overflow: "hidden" }}>
            <div style={{ width: `${progress * 100}%`, height: "100%", background: current.color }} />
          </div>
        </div>
      ) : null}

      {/* intro title */}
      {frame < TL.intro.end ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT, opacity: introOut }}>
          <div style={{ transform: `scale(${0.8 + introIn * 0.2})`, opacity: introIn, textAlign: "center" }}>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 18, color: "rgba(255,255,255,0.8)" }}>EASY · MEDIUM · HARD</div>
            <div style={{ fontSize: 170, fontWeight: 900, color: "white", letterSpacing: -4, lineHeight: 1, textShadow: "0 0 60px rgba(167,139,250,0.6)" }}>
              3 LEVELS OF <span style={{ color: "#ff3b5c" }}>DRUMS</span>
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* level card */}
      {cardLevel ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "white", opacity: cardOut }}>
          <div
            style={{
              transform: `scale(${cardIn})`,
              textAlign: "center",
              padding: "40px 90px 46px",
              borderRadius: 36,
              background: "rgba(8,7,14,0.6)",
              backdropFilter: "blur(14px)",
              border: `4px solid ${cardLevel.color}`,
              boxShadow: `0 0 80px ${cardLevel.color}55`,
            }}
          >
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 12, opacity: 0.8 }}>LEVEL {cardLevel.n}</div>
            <div style={{ fontSize: 180, fontWeight: 900, color: cardLevel.color, lineHeight: 1 }}>{cardLevel.name}</div>
            <div style={{ display: "flex", justifyContent: "center", margin: "12px 0 16px" }}>
              <Stars n={cardLevel.stars} color={cardLevel.color} size={64} />
            </div>
            <div style={{ fontSize: 56, fontWeight: 800 }}>{cardLevel.title}</div>
            <div style={{ fontSize: 30, opacity: 0.7, marginTop: 4 }}>{cardLevel.perf.bpm} BPM</div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* level clear */}
      {clearLevel ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
          <div
            style={{
              transform: `scale(${clearIn}) rotate(-3deg)`,
              fontSize: 150,
              fontWeight: 900,
              color: clearLevel.color,
              WebkitTextStroke: "12px #05040a",
              paintOrder: "stroke",
              textShadow: `0 0 60px ${clearLevel.color}`,
              marginTop: -200,
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
              background: "rgba(8,7,14,0.6)",
              backdropFilter: "blur(14px)",
              border: "4px solid white",
            }}
          >
            <div style={{ fontSize: 96, fontWeight: 900 }}>Which level can you play?</div>
            <div style={{ display: "flex", gap: 60, justifyContent: "center", marginTop: 16 }}>
              {LEVELS.map((l) => (
                <div key={l.n} style={{ fontSize: 54, fontWeight: 900, color: l.color }}>
                  {l.n}. {l.name}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 34, opacity: 0.75, marginTop: 14 }}>Tell me in the comments 👇</div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* ---------- audio ---------- */}
      <Sequence from={0} layout="none">
        <Audio src={staticFile(sfx.whoosh.file)} volume={0.7} />
      </Sequence>
      <Sequence from={10} layout="none">
        <Audio src={staticFile(lines.intro.file)} />
      </Sequence>
      {TL.levels.map((l) => (
        <Sequence key={`w${l.n}`} from={l.card.start} layout="none">
          <Audio src={staticFile(sfx.whoosh.file)} volume={0.5} />
        </Sequence>
      ))}
      {TL.levels.map((l) => (
        <Sequence key={`v${l.n}`} from={l.card.start + 8} layout="none">
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
          <Audio src={staticFile(sfx.levelup.file)} volume={0.55} />
          <Audio src={staticFile(sfx.crowd.file)} volume={0.35 + l.n * 0.12} />
        </Sequence>
      ))}
      <Sequence from={TL.outro.start} layout="none">
        <Audio src={staticFile(lines.outro.file)} />
      </Sequence>
    </AbsoluteFill>
  );
};
