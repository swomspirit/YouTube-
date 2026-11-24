import { AbsoluteFill, interpolate, spring } from "remotion";
import { cardLabel, isRed } from "../poker/cards";
import { BOARD, HERO, IVEY, beatAt, findBeat, stateAt } from "./timeline";

const FONT = "Inter, Helvetica, Arial, sans-serif";
const GOLD = "#f2c95b";
const BLUE = "#3ba3ff";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Jumbo 2D card (always readable). */
const Big: React.FC<{ c: string | null; w?: number; glow?: string }> = ({ c, w = 92, glow }) => (
  <div
    style={{
      width: w,
      height: w * 1.38,
      borderRadius: w * 0.12,
      background: c ? "#fbfaf6" : "linear-gradient(135deg,#b3122e,#7a0b1f)",
      border: c ? "3px solid #d8d1c0" : "3px solid #f4f1ea",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
      color: c && isRed(c) ? "#d0172f" : "#15131b",
      fontWeight: 900,
      boxShadow: glow ? `0 0 28px ${glow}` : "0 8px 20px rgba(0,0,0,0.55)",
    }}
  >
    {c ? (
      <>
        <div style={{ fontSize: w * 0.62, fontFamily: '"Arial Black", Arial' }}>{cardLabel(c).slice(0, -1)}</div>
        <div style={{ fontSize: w * 0.5 }}>{cardLabel(c).slice(-1)}</div>
      </>
    ) : null}
  </div>
);

const panel: React.CSSProperties = {
  background: "rgba(6,9,16,0.66)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 18,
  color: "white",
  fontFamily: FONT,
};

export const IveyHud: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const s = stateAt(t);
  const b = beatAt(t);
  const sp = (start: number, damping = 13) => spring({ frame: Math.round((t - start) * fps), fps, config: { damping } });
  const slow = findBeat("slowmo");
  const decide = findBeat("decide");
  const reveal = findBeat("reveal");
  const lesson = findBeat("lesson");
  const outro = findBeat("outro");
  const inSlow = t >= slow.start && t < slow.end + 0.3;
  const letterbox = inSlow ? Math.min(1, (t - slow.start) / 0.5, (slow.end + 0.3 - t) / 0.4) : 0;
  const showHud = b.step.k !== "title" && b.step.k !== "lesson" && b.step.k !== "outro";
  const revealed = s.revealAt !== null && t >= s.revealAt + 0.3;

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {/* cinematic letterbox for slow motion */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 120 * letterbox, background: "black" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120 * letterbox, background: "black" }} />
      {inSlow ? (
        <div style={{ position: "absolute", top: 140, left: 60, color: "#ff4d5e", fontSize: 30, fontWeight: 900, letterSpacing: 8, opacity: letterbox }}>● SLOW-MO</div>
      ) : null}

      {showHud && !inSlow ? (
        <>
          <div style={{ ...panel, position: "absolute", left: 36, top: 32, padding: "10px 18px", fontSize: 18, letterSpacing: 3 }}>
            <span style={{ color: BLUE, fontWeight: 900 }}>SHARK CAGE</span> · BLINDS 8K/16K
          </div>
          {/* jumbo board */}
          <div style={{ position: "absolute", top: 26, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12 }}>
            {BOARD.map((c, i) => {
              const shown = s.flips[i] <= t;
              const dealt = i < s.dealt.length;
              if (!dealt) return <div key={i} style={{ width: 92, height: 127, borderRadius: 11, border: "2px dashed rgba(255,255,255,0.18)" }} />;
              return (
                <div key={i} style={{ transform: `scale(${shown ? 0.85 + 0.15 * sp(s.flips[i], 10) : 1})` }}>
                  <Big c={shown ? c : null} />
                </div>
              );
            })}
          </div>
          <div style={{ ...panel, position: "absolute", right: 36, top: 32, padding: "12px 24px", textAlign: "right" }}>
            <div style={{ fontSize: 15, letterSpacing: 3, opacity: 0.6 }}>POT</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{Math.round((s.pot + s.heroBet + s.iveyBet) / 1000)}K</div>
          </div>
          {/* your hand */}
          <div style={{ position: "absolute", left: 36, bottom: 36, display: "flex", alignItems: "flex-end", gap: 10 }}>
            <Big c={HERO[0]} w={74} />
            <Big c={HERO[1]} w={74} />
            <div style={{ ...panel, padding: "10px 16px", marginLeft: 6 }}>
              <div style={{ fontSize: 13, letterSpacing: 3, opacity: 0.6 }}>YOU</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{s.hand || "Ace-Queen suited"}</div>
            </div>
          </div>
          {/* Ivey's hand after the reveal */}
          {revealed ? (
            <div style={{ position: "absolute", right: 36, bottom: 36, display: "flex", alignItems: "flex-end", gap: 10, transform: `scale(${sp(s.revealAt! + 0.3, 11)})` }}>
              <div style={{ ...panel, padding: "10px 16px", marginRight: 6, border: "2px solid #ff2b3d" }}>
                <div style={{ fontSize: 13, letterSpacing: 3, color: "#ff8a95" }}>PHIL IVEY</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>Aces full of eights</div>
              </div>
              <Big c={IVEY[0]} w={74} glow="#ff2b3d" />
              <Big c={IVEY[1]} w={74} glow="#ff2b3d" />
            </div>
          ) : null}
          {/* action label */}
          {s.label ? (
            <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  ...panel,
                  padding: "12px 30px",
                  fontSize: 32,
                  fontWeight: 900,
                  letterSpacing: 1,
                  transform: `translateY(${(1 - sp(s.labelAt, 16)) * 30}px)`,
                  color: s.label.includes("IVEY") ? "#ff8a95" : "white",
                }}
              >
                {s.label}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {/* pop stickers */}
      {s.pop && t - s.pop.t < 1.8 ? (
        <div
          style={{
            position: "absolute",
            right: 210,
            top: 300,
            fontSize: 78,
            fontWeight: 900,
            color: s.pop.color,
            WebkitTextStroke: "10px #05070c",
            paintOrder: "stroke",
            transform: `rotate(-8deg) scale(${sp(s.pop.t, 8)})`,
            opacity: interpolate(t - s.pop.t, [1.4, 1.8], [1, 0], clamp),
          }}
        >
          {s.pop.text}
        </div>
      ) : null}

      {/* title */}
      {b.step.k === "title" ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: "white", background: "radial-gradient(ellipse at center, rgba(0,0,0,0.1), rgba(0,0,0,0.6))" }}>
          <div style={{ fontSize: 30, letterSpacing: 14, color: BLUE, opacity: interpolate(t, [0.4, 1.2], [0, 1], clamp) }}>THE SHARK CAGE · $1,000,000</div>
          <div style={{ fontSize: 150, fontWeight: 900, letterSpacing: -3, transform: `scale(${sp(b.start + 0.6, 10)})`, textShadow: "0 10px 50px rgba(0,0,0,0.9)" }}>WOULD YOU CALL?</div>
          <div style={{ fontSize: 60, fontWeight: 900, color: "#ff4d5e", opacity: interpolate(t, [b.end - 4, b.end - 3.2], [0, 1], clamp), transform: `scale(${0.8 + 0.2 * sp(b.end - 4, 9)})` }}>
            vs PHIL IVEY
          </div>
        </AbsoluteFill>
      ) : null}

      {/* decision */}
      {t >= decide.start && t < decide.end + 2.2 ? (
        (() => {
          const dt = t - decide.start;
          const done = dt > 4.3;
          const count = Math.max(1, 3 - Math.floor(dt - 1.4));
          return (
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: interpolate(t, [decide.end + 1.6, decide.end + 2.2], [1, 0], clamp) }}>
              <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.25), rgba(0,0,0,0.75))" }} />
              <div style={{ position: "absolute", top: 190, textAlign: "center", color: "white" }}>
                <div style={{ fontSize: 26, letterSpacing: 8, opacity: 0.85 }}>⏸ 325K MORE TO CALL · POT 775K</div>
                <div style={{ fontSize: 110, fontWeight: 900, transform: `scale(${sp(decide.start, 10)})`, textShadow: "0 8px 30px rgba(0,0,0,0.8)" }}>WOULD YOU CALL?</div>
                {dt > 1.4 && !done ? <div style={{ fontSize: 130, fontWeight: 900, color: GOLD, transform: `scale(${1.3 - ((dt - 1.4) % 1) * 0.3})` }}>{count}</div> : null}
                {done ? <div style={{ fontSize: 44, fontWeight: 800, marginTop: 20 }}>Comment your answer 👇</div> : null}
              </div>
              <div style={{ position: "absolute", bottom: 170, display: "flex", gap: 40 }}>
                {["FOLD", "CALL"].map((o, i) => (
                  <div
                    key={o}
                    style={{
                      padding: "26px 70px",
                      borderRadius: 18,
                      fontSize: 52,
                      fontWeight: 900,
                      color: "white",
                      fontFamily: FONT,
                      letterSpacing: 3,
                      background: i === 0 ? "#3a1218" : "#0f3a22",
                      border: `3px solid ${i === 0 ? "#ff4d5e" : "#3ee07a"}`,
                      transform: `scale(${sp(decide.start + 0.3 + i * 0.12, 12)})`,
                    }}
                  >
                    {o}
                  </div>
                ))}
              </div>
            </AbsoluteFill>
          );
        })()
      ) : null}

      {/* ACES FULL stamp */}
      {t >= reveal.start + 1.2 && t < reveal.end + 2.5 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              fontSize: 170,
              fontWeight: 900,
              color: "#ff2b3d",
              border: "14px solid #ff2b3d",
              borderRadius: 24,
              padding: "0 40px",
              transform: `rotate(-10deg) scale(${2.2 - 1.2 * sp(reveal.start + 1.2, 9)})`,
              opacity: interpolate(t, [reveal.end + 2, reveal.end + 2.5], [0.92, 0], clamp),
              fontFamily: '"Arial Black", Arial',
              background: "rgba(10,0,4,0.35)",
              marginTop: -120,
            }}
          >
            ACES FULL
          </div>
        </AbsoluteFill>
      ) : null}

      {/* lesson */}
      {b.step.k === "lesson" ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}>
          <div style={{ ...panel, padding: "36px 54px", border: `3px solid ${GOLD}`, maxWidth: 1400 }}>
            <div style={{ fontSize: 30, letterSpacing: 10, color: GOLD, textAlign: "center" }}>WHAT TO TAKE AWAY</div>
            {[
              ["✅", "Ace-Queen suited on the button vs an early raise: call (or 3-bet)."],
              ["❌", "Don't expect three streets of value against a player like Ivey."],
              ["⚠️", "Three checks, then a huge river check-raise? He usually has it."],
            ].map(([ic, txt], i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 20,
                  alignItems: "center",
                  fontSize: 40,
                  fontWeight: 800,
                  marginTop: 22,
                  opacity: interpolate(t - lesson.start, [0.4 + i * 2.6, 0.8 + i * 2.6], [0, 1], clamp),
                  transform: `translateX(${(1 - interpolate(t - lesson.start, [0.4 + i * 2.6, 0.8 + i * 2.6], [0, 1], clamp)) * -60}px)`,
                }}
              >
                <span>{ic}</span>
                <span>{txt}</span>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      ) : null}

      {/* outro */}
      {b.step.k === "outro" ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", color: "white" }}>
          <div style={{ fontSize: 120, fontWeight: 900, transform: `scale(${sp(outro.start, 10)})` }}>Would YOU have called?</div>
          <div style={{ display: "flex", gap: 40, marginTop: 30 }}>
            <div style={{ ...panel, padding: "18px 40px", fontSize: 48, fontWeight: 900, border: "3px solid #ff4d5e" }}>FOLD 🏳️</div>
            <div style={{ ...panel, padding: "18px 40px", fontSize: 48, fontWeight: 900, border: "3px solid #3ee07a" }}>CALL 💸</div>
          </div>
          <div style={{ fontSize: 40, opacity: 0.85, marginTop: 30 }}>Tell me in the comments 👇</div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
