import { AbsoluteFill, interpolate, spring } from "remotion";
import { beatAt, findBeat, stateAt, TL } from "./timeline";

const FONT = "Inter, Helvetica, Arial, sans-serif";
const GOLD = "#f2c95b";
const GREEN = "#3ee07a";
const RED = "#ff4d5e";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const panel: React.CSSProperties = {
  background: "rgba(14,10,14,0.78)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 18,
  color: "white",
  fontFamily: FONT,
  boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
};

type Coach = { title: string; lines: { ic: string; text: string }[]; extra?: "beats" | "odds" };
const COACH: Record<string, Coach> = {
  t_pre: {
    title: "PREFLOP",
    lines: [
      { ic: "🃏", text: "Ace-Queen suited: a top-10 starting hand" },
      { ic: "✅", text: "vs an early raise on the button: CALL (3-bet also fine)" },
    ],
  },
  t_flop: {
    title: "FLOP · 8 8 A",
    lines: [
      { ic: "💪", text: "You have two pair: aces & eights, queen kicker" },
      { ic: "✅", text: "Strong hand → bet for value" },
    ],
  },
  t_turn: {
    title: "TURN · 7",
    lines: [
      { ic: "🧘", text: "Check back = keep the pot small" },
      { ic: "🎣", text: "…and give Ivey room to bluff" },
    ],
  },
  t_river: {
    title: "RIVER · 9",
    lines: [
      { ic: "⚠️", text: "Three checks does NOT always mean weak" },
      { ic: "🪤", text: "Great players check big hands to set a trap" },
    ],
  },
  t_beats: { title: "WHAT BEATS YOU?", lines: [], extra: "beats" },
  t_odds: { title: "POT ODDS", lines: [], extra: "odds" },
};

const BEATS = ["A-A", "A-8", "Any 8", "9-9", "7-7", "A-K", "J-10", "10-6"];

export const IveyHud2D: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const s = stateAt(t);
  const b = beatAt(t);
  const sp = (start: number, damping = 13) => spring({ frame: Math.round((t - start) * fps), fps, config: { damping } });
  const decide = findBeat("decide");
  const reveal = findBeat("reveal");
  const outro = findBeat("outro");
  const id = (b.step as { id?: string }).id ?? "";
  const showTable = b.step.k !== "title" && b.step.k !== "lesson" && b.step.k !== "outro";
  const coach = b.step.k === "coach" ? COACH[id] : null;
  const revealed = s.revealAt !== null && t >= s.revealAt + 0.3;

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {showTable ? (
        <>
          {/* name plates */}
          <div style={{ ...panel, position: "absolute", left: 340, top: 575, width: 400, padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#5fe3d4" }}>YOU</div>
              <div style={{ fontSize: 15, opacity: 0.75 }}>Button · {s.hand || "Ace-Queen suited"}</div>
            </div>
          </div>
          <div style={{ ...panel, position: "absolute", left: 1180, top: 575, width: 400, padding: "8px 16px" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#b9c4ff" }}>PHIL IVEY</div>
            <div style={{ fontSize: 15, opacity: 0.75 }}>Under the gun · {revealed ? "Aces full of eights" : "? ?"}</div>
          </div>
          {/* pot */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 455, display: "flex", justifyContent: "center" }}>
            <div style={{ ...panel, padding: "6px 22px", fontSize: 28, fontWeight: 900 }}>
              POT <span style={{ color: GOLD }}>{Math.round((s.pot + s.heroBet + s.iveyBet) / 1000)}K</span>
            </div>
          </div>
          {/* action label */}
          {s.label && t - s.labelAt < 3.5 ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 510, display: "flex", justifyContent: "center" }}>
              <div style={{ padding: "6px 20px", borderRadius: 12, background: s.label.includes("IVEY") ? "#3a2a5a" : "#0f4a44", color: "white", fontSize: 24, fontWeight: 900, transform: `scale(${sp(s.labelAt, 14)})` }}>
                {s.label}
              </div>
            </div>
          ) : null}
          {/* light pop sticker near the hero */}
          {s.pop && t - s.pop.t < 1.6 ? (
            <div
              style={{
                position: "absolute",
                left: 640,
                top: 150,
                fontSize: 48,
                fontWeight: 900,
                color: s.pop.color,
                WebkitTextStroke: "8px #120c10",
                paintOrder: "stroke",
                transform: `rotate(-6deg) scale(${sp(s.pop.t, 10)})`,
                opacity: interpolate(t - s.pop.t, [1.2, 1.6], [1, 0], clamp),
              }}
            >
              {s.pop.text}
            </div>
          ) : null}
        </>
      ) : null}

      {/* coach panel */}
      {coach ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 26, display: "flex", justifyContent: "center" }}>
          <div style={{ ...panel, width: 760, padding: "18px 28px", border: `2px solid ${GOLD}`, transform: `translateY(${(1 - sp(b.start, 15)) * -60}px)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: GOLD, color: "#1a1208", fontWeight: 900, fontSize: 16, padding: "3px 10px", borderRadius: 6, letterSpacing: 2 }}>COACH</div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2 }}>{coach.title}</div>
            </div>
            {coach.lines.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 12, fontSize: 27, fontWeight: 700, marginTop: 12, opacity: interpolate(t - b.start, [0.3 + i * 1.6, 0.6 + i * 1.6], [0, 1], clamp) }}>
                <span>{l.ic}</span>
                <span>{l.text}</span>
              </div>
            ))}
            {coach.extra === "beats" ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                {BEATS.map((h, i) => (
                  <div
                    key={h}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      background: "#3a1218",
                      border: `2px solid ${RED}`,
                      fontSize: 26,
                      fontWeight: 900,
                      opacity: interpolate(t - b.start, [1.2 + i * 1.1, 1.5 + i * 1.1], [0, 1], clamp),
                    }}
                  >
                    {h}
                  </div>
                ))}
                <div style={{ fontSize: 22, opacity: interpolate(t - b.start, [10.5, 11], [0, 0.9], clamp), marginTop: 6, width: "100%" }}>
                  A river check-raise from a pro is usually one of these.
                </div>
              </div>
            ) : null}
            {coach.extra === "odds" ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 27, fontWeight: 700 }}>
                  Call <span style={{ color: RED, fontWeight: 900 }}>325K</span> to win <span style={{ color: GOLD, fontWeight: 900 }}>1.1M</span>
                </div>
                <div style={{ position: "relative", height: 34, borderRadius: 10, background: "rgba(255,255,255,0.1)", marginTop: 12, overflow: "hidden" }}>
                  <div style={{ width: `${29.5 * clamp01(t - b.start - 4)}%`, height: "100%", background: GOLD }} />
                  <div style={{ position: "absolute", left: 14, top: 4, fontSize: 22, fontWeight: 900, color: "#1a1208" }}>
                    {Math.round(29.5 * clamp01(t - b.start - 4))}%
                  </div>
                </div>
                <div style={{ fontSize: 24, marginTop: 10, opacity: interpolate(t - b.start, [6.5, 7], [0, 1], clamp) }}>
                  You must win at least <b style={{ color: GOLD }}>30%</b> of the time to make this call profitable.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* title */}
      {b.step.k === "title" ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: "white", background: "rgba(10,6,8,0.55)" }}>
          <div style={{ fontSize: 30, letterSpacing: 12, color: GOLD, opacity: interpolate(t, [0.4, 1.2], [0, 1], clamp) }}>A REAL HAND, EXPLAINED</div>
          <div style={{ fontSize: 140, fontWeight: 900, letterSpacing: -3, transform: `scale(${sp(b.start + 0.6, 11)})` }}>WOULD YOU CALL?</div>
          <div style={{ fontSize: 56, fontWeight: 900, color: "#b9c4ff", opacity: interpolate(t, [b.end - 4, b.end - 3.2], [0, 1], clamp) }}>vs PHIL IVEY</div>
        </AbsoluteFill>
      ) : null}

      {/* decision */}
      {t >= decide.start && t < decide.end + 1.6 ? (
        (() => {
          const dt = t - decide.start;
          const count = Math.max(1, 3 - Math.floor(dt - 1.4));
          return (
            <div style={{ position: "absolute", left: 0, right: 0, top: 40, display: "flex", flexDirection: "column", alignItems: "center", opacity: interpolate(t, [decide.end + 1.1, decide.end + 1.6], [1, 0], clamp) }}>
              <div style={{ ...panel, padding: "20px 50px", textAlign: "center", border: `2px solid ${GOLD}` }}>
                <div style={{ fontSize: 22, letterSpacing: 6, opacity: 0.8 }}>325K TO CALL · POT 775K · YOU NEED 30%</div>
                <div style={{ fontSize: 84, fontWeight: 900, transform: `scale(${sp(decide.start, 11)})` }}>WOULD YOU CALL?</div>
                <div style={{ display: "flex", gap: 28, justifyContent: "center", marginTop: 8 }}>
                  <div style={{ padding: "12px 46px", borderRadius: 14, fontSize: 40, fontWeight: 900, background: "#3a1218", border: `3px solid ${RED}` }}>FOLD</div>
                  <div style={{ fontSize: 70, fontWeight: 900, color: GOLD, width: 80 }}>{dt > 1.4 && dt < 4.4 ? count : "?"}</div>
                  <div style={{ padding: "12px 46px", borderRadius: 14, fontSize: 40, fontWeight: 900, background: "#0f3a22", border: `3px solid ${GREEN}` }}>CALL</div>
                </div>
                <div style={{ fontSize: 24, marginTop: 10, opacity: 0.85 }}>Comment your answer 👇</div>
              </div>
            </div>
          );
        })()
      ) : null}

      {/* reveal result banner */}
      {t >= reveal.start + 1.2 && t < reveal.end + 3 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 60, display: "flex", justifyContent: "center" }}>
          <div style={{ ...panel, padding: "14px 40px", border: `3px solid ${RED}`, transform: `scale(${sp(reveal.start + 1.2, 10)})`, textAlign: "center" }}>
            <div style={{ fontSize: 60, fontWeight: 900, color: RED }}>ACES FULL</div>
            <div style={{ fontSize: 26, fontWeight: 700, opacity: 0.9 }}>A-A-A-8-8 beats your two pair (A-A-8-8-Q)</div>
          </div>
        </div>
      ) : null}

      {/* lesson summary */}
      {b.step.k === "lesson" ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "rgba(8,5,7,0.72)" }}>
          <div style={{ ...panel, padding: "34px 54px", border: `3px solid ${GOLD}`, maxWidth: 1450 }}>
            <div style={{ fontSize: 30, letterSpacing: 10, color: GOLD, textAlign: "center" }}>KEY TAKEAWAYS</div>
            {[
              ["✅", "Ace-Queen suited vs an early raise: call (or 3-bet)."],
              ["💰", "Two pair on 8-8-A: bet for value, but don't expect 3 streets vs a pro."],
              ["⚠️", "Check, check, check… then a huge check-raise = usually the nuts."],
              ["🧮", "You needed 30%. Against this range you win far less → fold."],
            ].map(([ic, txt], i) => (
              <div key={i} style={{ display: "flex", gap: 18, fontSize: 38, fontWeight: 800, marginTop: 20, opacity: interpolate(t - b.start, [0.3 + i * 2.4, 0.7 + i * 2.4], [0, 1], clamp) }}>
                <span>{ic}</span>
                <span>{txt}</span>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      ) : null}

      {/* outro */}
      {b.step.k === "outro" ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "rgba(8,5,7,0.6)", color: "white" }}>
          <div style={{ fontSize: 110, fontWeight: 900, transform: `scale(${sp(outro.start, 10)})` }}>Would YOU have called?</div>
          <div style={{ fontSize: 40, opacity: 0.85, marginTop: 24 }}>Tell me in the comments 👇 · Subscribe for more hand breakdowns</div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
void TL;
