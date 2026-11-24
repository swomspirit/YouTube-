import { AbsoluteFill, interpolate, spring } from "remotion";
import { cardLabel, isRed } from "./cards";
import { EQUITY, HERO_CARDS, OPPONENTS, TL, beatAt, stateAt } from "./timeline";

const FONT = "Inter, Helvetica, Arial, sans-serif";
const GOLD = "#f2c95b";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const MiniCard: React.FC<{ c: string; size?: number }> = ({ c, size = 1 }) => (
  <div
    style={{
      width: 62 * size,
      height: 86 * size,
      borderRadius: 8 * size,
      background: "#fbfaf6",
      border: "2px solid #cfc8b8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 34 * size,
      fontWeight: 900,
      color: isRed(c) ? "#d0172f" : "#15131b",
      boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
    }}
  >
    {cardLabel(c)}
  </div>
);

const Meter: React.FC<{ left: string; right: string; v: number; color: string }> = ({ left, right, v, color }) => (
  <div style={{ marginTop: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, opacity: 0.7, letterSpacing: 1 }}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
    <div style={{ position: "relative", height: 8, borderRadius: 4, background: "rgba(255,255,255,0.15)", marginTop: 4 }}>
      <div style={{ position: "absolute", left: `${v * 100}%`, top: -5, width: 18, height: 18, marginLeft: -9, borderRadius: 9, background: color, boxShadow: `0 0 12px ${color}` }} />
    </div>
  </div>
);

const panel: React.CSSProperties = {
  background: "rgba(10,8,12,0.62)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 18,
  color: "white",
  fontFamily: FONT,
};

export const Hud: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const s = stateAt(t);
  const beat = beatAt(t);
  const opp = s.scene ? OPPONENTS[s.scene - 1] : null;
  const f = (x: number) => Math.round(x * fps);
  const sp = (start: number, damping = 14) => spring({ frame: f(t - start), fps, config: { damping } });

  // previous "decide" beat, so the answer stays highlighted for a moment
  const idx = beat ? TL.beats.indexOf(beat) : -1;
  const prevBeat = idx > 0 ? TL.beats[idx - 1] : null;
  const decide = beat?.step.k === "decide" ? beat : prevBeat?.step.k === "decide" && t - prevBeat.end < 2.6 ? prevBeat : null;
  const inScene = !!opp && beat?.step.k !== "scene" && beat?.step.k !== "outro";

  const eq = s.equity;
  const eqColor = eq === null ? "#888" : eq < 40 ? "#ff4d5e" : eq < 65 ? "#ffc94d" : "#3ee07a";
  const actual = s.equityKey?.endsWith("actual");

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {/* ---------- persistent HUD ---------- */}
      {inScene && opp ? (
        <>
          <div style={{ ...panel, position: "absolute", left: 40, top: 36, width: 380, padding: "18px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 46 }}>{opp.emoji}</div>
              <div>
                <div style={{ fontSize: 14, letterSpacing: 3, opacity: 0.6 }}>OPPONENT {opp.n}/3</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: opp.color }}>{opp.name}</div>
              </div>
            </div>
            <Meter left="TIGHT" right="LOOSE" v={opp.loose} color={opp.color} />
            <Meter left="PASSIVE" right="AGGRESSIVE" v={opp.aggro} color={opp.color} />
          </div>

          <div style={{ ...panel, position: "absolute", right: 40, top: 36, padding: "16px 26px", textAlign: "right" }}>
            <div style={{ fontSize: 15, letterSpacing: 3, opacity: 0.6 }}>POT</div>
            <div style={{ fontSize: 54, fontWeight: 900, color: GOLD, lineHeight: 1 }}>${s.pot + s.heroBet + s.villBet}</div>
            <div style={{ fontSize: 18, opacity: 0.8, marginTop: 6 }}>Your stack: ${s.heroStack}</div>
          </div>

          {eq !== null ? (
            <div style={{ ...panel, position: "absolute", right: 40, top: 220, width: 210, padding: "16px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 14, letterSpacing: 2, opacity: 0.7 }}>YOUR WIN CHANCE</div>
              <div style={{ fontSize: 64, fontWeight: 900, color: eqColor, lineHeight: 1.05, textShadow: `0 0 24px ${eqColor}66` }}>{eq}%</div>
              <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.12)", overflow: "hidden", marginTop: 6 }}>
                <div style={{ width: `${eq}%`, height: "100%", background: eqColor }} />
              </div>
              <div style={{ fontSize: 14, opacity: 0.65, marginTop: 8 }}>{actual ? "vs his actual hand" : "vs his likely range"}</div>
            </div>
          ) : null}

          <div style={{ position: "absolute", left: 40, bottom: 40, display: "flex", alignItems: "flex-end", gap: 10 }}>
            <div style={{ ...panel, padding: "10px 14px", fontSize: 14, letterSpacing: 2, opacity: 0.9 }}>YOUR HAND</div>
            {HERO_CARDS.map((c) => (
              <MiniCard key={c} c={c} size={0.9} />
            ))}
          </div>

          {s.label ? (
            <div style={{ position: "absolute", bottom: 46, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  ...panel,
                  padding: "14px 34px",
                  fontSize: 34,
                  fontWeight: 800,
                  transform: `translateY(${(1 - sp(s.labelAt, 16)) * 30}px)`,
                  opacity: interpolate(t - s.labelAt, [0, 0.15], [0, 1], clamp),
                  border: s.label.includes("ALL IN") ? "2px solid #ff4d5e" : panel.border,
                  color: s.label.includes("win") ? GOLD : "white",
                }}
              >
                {s.label}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {/* ---------- title ---------- */}
      {beat?.step.k === "title" ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 110, color: "white" }}>
          <div style={{ opacity: interpolate(t - beat.start, [0.3, 1.0], [0, 1], clamp), fontSize: 40, letterSpacing: 14, opacity2: 1 } as React.CSSProperties}>YOU LOOK DOWN AT…</div>
          <div
            style={{
              marginTop: 10,
              fontSize: 150,
              fontWeight: 900,
              letterSpacing: -3,
              color: GOLD,
              textShadow: "0 10px 50px rgba(0,0,0,0.8)",
              transform: `scale(${sp(beat.start + 2.2, 10)})`,
            }}
          >
            POCKET JACKS
          </div>
          <div style={{ fontSize: 34, opacity: interpolate(t - beat.start, [6, 7], [0, 0.85], clamp), marginTop: 8 }}>How to play them against 3 different opponents</div>
        </AbsoluteFill>
      ) : null}

      {/* ---------- opponent intro ---------- */}
      {beat?.step.k === "scene" && opp ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              ...panel,
              padding: "38px 70px",
              textAlign: "center",
              transform: `translateY(${(1 - sp(beat.start, 13)) * 400}px)`,
              border: `3px solid ${opp.color}`,
              boxShadow: `0 0 60px ${opp.color}55`,
              marginTop: -120,
            }}
          >
            <div style={{ fontSize: 26, letterSpacing: 10, opacity: 0.7 }}>OPPONENT {opp.n}</div>
            <div style={{ fontSize: 120 }}>{opp.emoji}</div>
            <div style={{ fontSize: 86, fontWeight: 900, color: opp.color, lineHeight: 1 }}>{opp.name}</div>
            <div style={{ fontSize: 30, opacity: 0.85, marginTop: 12 }}>{opp.tag}</div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* ---------- decision ---------- */}
      {decide && decide.step.k === "decide" ? (
        (() => {
          const st = decide.step;
          const dt = t - decide.start;
          const answered = dt >= 3.9;
          const count = Math.max(1, 3 - Math.floor(dt - 0.9));
          const fadeOut = beat === decide ? 1 : interpolate(t - decide.end, [2.0, 2.6], [1, 0], clamp);
          return (
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
              <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.15), rgba(0,0,0,0.65))", opacity: answered ? 0.5 : 1 }} />
              {!answered ? (
                <div style={{ position: "absolute", top: 150, textAlign: "center", color: "white" }}>
                  <div style={{ fontSize: 26, letterSpacing: 8, opacity: 0.8 }}>⏸ PAUSE</div>
                  <div style={{ fontSize: 92, fontWeight: 900, transform: `scale(${sp(decide.start, 12)})`, textShadow: "0 8px 30px rgba(0,0,0,0.7)" }}>WHAT WOULD YOU DO?</div>
                  {dt > 0.9 ? <div style={{ fontSize: 120, fontWeight: 900, color: GOLD, transform: `scale(${1.3 - ((dt - 0.9) % 1) * 0.3})` }}>{count}</div> : null}
                </div>
              ) : null}
              <div style={{ position: "absolute", bottom: 150, display: "flex", gap: 28 }}>
                {st.options.map((o, i) => {
                  const good = i === st.correct;
                  return (
                    <div
                      key={o}
                      style={{
                        padding: "22px 46px",
                        borderRadius: 16,
                        fontSize: 40,
                        fontWeight: 900,
                        color: "white",
                        letterSpacing: 2,
                        background: answered ? (good ? "#1fa45a" : "rgba(40,40,48,0.7)") : "rgba(30,30,40,0.85)",
                        border: answered && good ? "3px solid #6dffad" : "2px solid rgba(255,255,255,0.3)",
                        boxShadow: answered && good ? "0 0 40px #3ee07a" : "none",
                        opacity: answered && !good ? 0.35 : 1,
                        transform: `scale(${answered && good ? 1 + 0.1 * sp(decide.start + 3.9, 9) : sp(decide.start + 0.15 + i * 0.08, 14)})`,
                      }}
                    >
                      {answered && good ? "✓ " : ""}
                      {o}
                    </div>
                  );
                })}
              </div>
            </AbsoluteFill>
          );
        })()
      ) : null}

      {/* ---------- lesson ---------- */}
      {beat?.step.k === "lesson" ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              ...panel,
              padding: "34px 60px",
              textAlign: "center",
              border: `3px solid ${GOLD}`,
              transform: `scale(${sp(beat.start, 12)})`,
              maxWidth: 1300,
              marginTop: -80,
            }}
          >
            <div style={{ fontSize: 28, letterSpacing: 10, color: GOLD }}>LESSON {beat.step.n}</div>
            <div style={{ fontSize: 64, fontWeight: 900, marginTop: 8 }}>{beat.step.text}</div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* ---------- outro ---------- */}
      {beat?.step.k === "outro" ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}>
          <div style={{ color: "white", textAlign: "center" }}>
            <div style={{ fontSize: 34, letterSpacing: 10, opacity: 0.75 }}>SAME HAND · 3 OPPONENTS</div>
            <div style={{ display: "flex", gap: 30, marginTop: 30 }}>
              {OPPONENTS.map((o, i) => (
                <div
                  key={o.n}
                  style={{
                    ...panel,
                    width: 440,
                    padding: "28px 26px",
                    border: `3px solid ${o.color}`,
                    transform: `translateY(${(1 - sp(beat.start + 0.2 + i * 0.25, 13)) * 300}px)`,
                  }}
                >
                  <div style={{ fontSize: 70 }}>{o.emoji}</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: o.color }}>{o.name}</div>
                  <div style={{ fontSize: 44, fontWeight: 900, marginTop: 10 }}>{["FOLD", "LET HIM BLUFF", "VALUE BET"][i]}</div>
                  <div style={{ fontSize: 22, opacity: 0.7, marginTop: 6 }}>Win chance at decision: {[EQUITY.s1_flop, EQUITY.s2_turn, EQUITY.s3_river][i]}%</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 46, fontWeight: 800, marginTop: 40, opacity: interpolate(t - beat.start, [1.5, 2.2], [0, 1], clamp) }}>
              Which ones did you get right? 👇
            </div>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
