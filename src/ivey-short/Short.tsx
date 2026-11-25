import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { ShortScene } from "./Scene";
import { FPS, LINES, MUSIC, SFX, TL, segAt, stateAt } from "./timeline";

export { SHORT_DURATION } from "./timeline";

const FONT = "Inter, Helvetica, Arial, sans-serif";
const GOLD = "#f2c95b";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Current narrated word (TwistDNA-style big single-word captions). */
const currentWord = (t: number) => {
  const seg = segAt(t);
  const ms = (t - seg.start) * 1000;
  const caps = LINES[seg.id].captions;
  const w = caps.find((c) => ms >= c.startMs && ms < c.endMs + 140);
  return w ? { text: w.text.trim().replace(/[.,!?…]+$/g, ""), t0: seg.start + w.startMs / 1000 } : null;
};

const Overlay: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const st = stateAt(t);
  const sp = (start: number, damping = 12) => spring({ frame: Math.round((t - start) * fps), fps, config: { damping } });
  const word = currentWord(t);
  const o = st.overlay;
  const since = t - st.overlayAt;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {/* rewind effect */}
      {o === "rewind" ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: `rgba(255,255,255,${interpolate(since, [0, 0.15, 0.6], [0.6, 0.15, 0.1], clamp)})` }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, top: ((i * 330 + t * 2400) % 1920) - 40, height: 14, background: "rgba(255,255,255,0.35)" }} />
          ))}
          <div style={{ fontSize: 120, fontWeight: 900, color: "white", WebkitTextStroke: "14px #111", paintOrder: "stroke", transform: `scale(${sp(st.overlayAt, 10)})` }}>⏪ REWIND</div>
        </AbsoluteFill>
      ) : null}

      {/* time bank chips */}
      {o === "timebank" || o === "odds" ? (
        <div style={{ position: "absolute", top: 260, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: 6, color: "white", WebkitTextStroke: "8px #111", paintOrder: "stroke" }}>TIME BANK</div>
          <div style={{ display: "flex", gap: 20 }}>
            {[0, 1, 2].map((i) => {
              const k = sp(st.overlayAt + (o === "timebank" ? 0.5 + i * 0.45 : -5), 9);
              return (
                <div key={i} style={{ width: 110, height: 110, borderRadius: 55, background: "#c8202f", border: "8px dashed #fbe9eb", boxShadow: "0 0 0 6px #111", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 34, fontWeight: 900, transform: `scale(${k})` }}>
                  30s
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {o === "odds" ? (
        <div style={{ position: "absolute", top: 560, left: 90, right: 90 }}>
          <div style={{ fontSize: 34, fontWeight: 900, color: "white", textAlign: "center", WebkitTextStroke: "8px #111", paintOrder: "stroke" }}>325K TO WIN 1.12M</div>
          <div style={{ height: 54, borderRadius: 27, background: "rgba(0,0,0,0.6)", border: "4px solid #111", marginTop: 12, overflow: "hidden", position: "relative" }}>
            <div style={{ width: `${29 * Math.min(1, since / 1.2)}%`, height: "100%", background: GOLD }} />
            <div style={{ position: "absolute", left: 20, top: 6, fontSize: 34, fontWeight: 900, color: "#111" }}>{Math.round(29 * Math.min(1, since / 1.2))}%</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "white", textAlign: "center", marginTop: 10, WebkitTextStroke: "6px #111", paintOrder: "stroke" }}>needs to win 29% of the time</div>
        </div>
      ) : null}

      {/* lesson */}
      {o === "lesson" ? (
        <div style={{ position: "absolute", top: 230, left: 70, right: 70, textAlign: "center" }}>
          <div style={{ display: "inline-block", background: GOLD, color: "#1a1208", fontWeight: 900, fontSize: 34, letterSpacing: 4, padding: "8px 22px", borderRadius: 10, transform: `scale(${sp(st.overlayAt, 11)})` }}>THE LESSON</div>
        </div>
      ) : null}

      {/* call to action */}
      {o === "cta" ? (
        <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 40 }}>
          {["FOLD", "CALL"].map((x, i) => (
            <div
              key={x}
              style={{
                padding: "26px 60px",
                borderRadius: 24,
                fontSize: 64,
                fontWeight: 900,
                color: "white",
                background: i ? "#14532d" : "#5b1520",
                border: `6px solid ${i ? "#3ee07a" : "#ff4d5e"}`,
                boxShadow: "0 10px 0 #111",
                transform: `scale(${sp(st.overlayAt + 0.2 + i * 0.15, 10)})`,
              }}
            >
              {x}
            </div>
          ))}
        </div>
      ) : null}

      {/* word-by-word captions */}
      {word ? (
        <AbsoluteFill style={{ alignItems: "center" }}>
          <div
            style={{
              position: "absolute",
              top: 1180,
              fontSize: 124,
              fontWeight: 900,
              color: /^(aces|ace-queen|four|three|twenty-nine|pocket|believe)/i.test(word.text) ? GOLD : "white",
              WebkitTextStroke: "18px #111",
              paintOrder: "stroke",
              textAlign: "center",
              padding: "0 40px",
              transform: `scale(${interpolate(t - word.t0, [0, 0.08], [0.82, 1], clamp)})`,
            }}
          >
            {word.text}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export const IveyShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a0f0c" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 50, position: [0, 2.4, 3.4], near: 0.03, far: 40 }}>
        <ShortScene t={t} />
      </ThreeCanvas>
      <Overlay t={t} fps={fps} />
      <Audio src={staticFile(SFX.room.file)} volume={0.18} loop />
      <Audio src={staticFile(MUSIC.bed.file)} volume={(f) => interpolate(f, [0, 20, TL.total * FPS - 60, TL.total * FPS], [0, 0.16, 0.2, 0], clamp)} loop />
      {TL.cues.map((c, i) => (
        <Sequence key={i} from={Math.round(c.t * FPS)} layout="none">
          <Audio src={staticFile(c.file)} volume={c.vol ?? 1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
