import { AbsoluteFill, interpolate, spring } from "remotion";
import { LINES, SPOKEN, TL, beatAt, findBeat, spokenStart, stateAt, wordAt, type Gag } from "./timeline";

const FONT = "Inter, Helvetica, Arial, sans-serif";
const GOLD = "#f2c95b";
const GREEN = "#3ee07a";
const RED = "#ff4d5e";
const INK = "#120c10";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const panel: React.CSSProperties = {
  background: "rgba(14,10,14,0.82)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 18,
  color: "white",
  fontFamily: FONT,
  boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
};
const sticker = (size: number, color = "white"): React.CSSProperties => ({
  fontSize: size,
  fontWeight: 900,
  color,
  WebkitTextStroke: `${Math.round(size / 7)}px ${INK}`,
  paintOrder: "stroke",
  fontFamily: FONT,
});
type Sp = (start: number, damping?: number) => number;

/** Ivey's checks up to time t (for the tally in the corner). */
const iveyChecks = (t: number) => TL.acts.filter((a) => a.t <= t && a.act.a === "check" && a.act.who === "ivey");

/* ---------------- subtitles ---------------- */
type Word = { text: string; s: number; e: number };
const CHUNKS: { id: string; words: Word[] }[] = [];
for (const sp of SPOKEN) {
  if (sp.id === "wyc") continue; // the big WOULD YOU CALL card already says it
  const words = LINES[sp.id].captions.map((c) => ({ text: c.text.trim(), s: sp.t + c.startMs / 1000, e: sp.t + c.endMs / 1000 })).filter((w) => w.text);
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    const end = /[.!?…,:]$/.test(w.text);
    if (cur.length >= 5 || (end && cur.length >= 2)) {
      CHUNKS.push({ id: sp.id, words: cur });
      cur = [];
    }
  }
  if (cur.length) CHUNKS.push({ id: sp.id, words: cur });
}

const Subtitles: React.FC<{ t: number }> = ({ t }) => {
  const i = CHUNKS.findIndex((c, k) => t >= c.words[0].s - 0.05 && t < Math.min(c.words[c.words.length - 1].e + 0.35, CHUNKS[k + 1]?.words[0].s ?? Infinity));
  if (i < 0) return null;
  const c = CHUNKS[i];
  const color = c.id.startsWith("m_") ? "#7ff5e6" : c.id.startsWith("mom") ? "#ffb3d1" : "#ffffff";
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 1500, textAlign: "center", lineHeight: 1.15 }}>
        {c.words.map((w, k) => {
          const on = t >= w.s;
          const pop = interpolate(t - w.s, [0, 0.08, 0.16], [1, 1.12, 1], clamp);
          return (
            <span key={k} style={{ ...sticker(58, on ? (t < w.e + 0.05 ? GOLD : color) : "rgba(255,255,255,0.55)"), display: "inline-block", margin: "0 10px", transform: `scale(${on ? pop : 1})` }}>
              {w.text.replace(/[,.…]+$/, "")}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- gag cards ---------------- */
const StatsCard: React.FC<{ t: number; start: number; sp: Sp }> = ({ t, start, sp }) => {
  const at = spokenStart("c_stats");
  const rows = [
    { w: "Heart", ic: "❤️", k: "HEART RATE", v: "12 bpm" },
    { w: "Emotions", ic: "😐", k: "EMOTIONS", v: "NOT FOUND" },
    { w: "Hobbies", ic: "🎯", k: "HOBBIES", v: "ruining your day" },
  ];
  return (
    <div style={{ ...panel, position: "absolute", left: 90, top: 150, width: 640, padding: "22px 30px", border: "3px solid #b9c4ff", transform: `translateX(${(1 - sp(start + 0.2, 14)) * -800}px) rotate(-2deg)` }}>
      <div style={{ fontSize: 22, letterSpacing: 6, color: "#b9c4ff", fontWeight: 900 }}>PLAYER PROFILE</div>
      <div style={{ fontSize: 56, fontWeight: 900, marginTop: 2 }}>PHIL IVEY</div>
      {rows.map((r) => {
        const rt = wordAt("c_stats", at, r.w);
        return (
          <div key={r.k} style={{ display: "flex", gap: 14, alignItems: "baseline", marginTop: 14, opacity: interpolate(t - rt, [0, 0.15], [0, 1], clamp), transform: `scale(${t >= rt ? sp(rt, 12) : 0})`, transformOrigin: "left center" }}>
            <span style={{ fontSize: 36 }}>{r.ic}</span>
            <span style={{ fontSize: 24, opacity: 0.7, fontWeight: 800, width: 170 }}>{r.k}</span>
            <span style={{ fontSize: 36, fontWeight: 900, color: r.v === "NOT FOUND" ? RED : GOLD }}>{r.v}</span>
          </div>
        );
      })}
    </div>
  );
};

const YachtDream: React.FC<{ t: number; start: number; end: number; sp: Sp }> = ({ t, start, end, sp }) => {
  const at = spokenStart("m_yacht");
  const y1 = wordAt("m_yacht", at, "yacht", 0);
  const y2 = wordAt("m_yacht", at, "second");
  const y3 = wordAt("m_yacht", at, "tiny");
  const out = 1 - interpolate(t, [end - 0.4, end], [0, 1], clamp);
  const boat = (t0: number, size: number, x: number, y: number) =>
    t >= t0 ? <div style={{ position: "absolute", left: x, top: y + Math.sin(t * 3 + x) * 8, fontSize: size, transform: `scale(${sp(t0, 9)})` }}>🛥️</div> : null;
  return (
    <div style={{ position: "absolute", left: 640, top: 40, width: 820, height: 420, opacity: out, transform: `scale(${sp(start, 13)})`, transformOrigin: "20% 100%" }}>
      <svg width={820} height={420} style={{ position: "absolute", inset: 0 }}>
        <path d="M80 220 Q40 120 150 100 Q190 20 300 50 Q380 0 470 50 Q580 10 640 90 Q770 90 750 210 Q800 320 660 330 Q600 400 470 360 Q380 410 280 360 Q150 390 120 310 Q20 300 80 220Z" fill="#eef6ff" stroke={INK} strokeWidth={6} />
        <circle cx={70} cy={380} r={16} fill="#eef6ff" stroke={INK} strokeWidth={5} />
        <circle cx={30} cy={410} r={9} fill="#eef6ff" stroke={INK} strokeWidth={4} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 66, textAlign: "center", fontSize: 38, fontWeight: 900, color: "#3a6fd8", fontFamily: FONT }}>my future 💭</div>
      {boat(y1, 130, 150, 130)}
      {boat(y2, 130, 380, 120)}
      {boat(y3, 56, 590, 220)}
      {t >= y3 ? <div style={{ position: "absolute", left: 470, top: 290, ...sticker(26, GOLD) }}>(yacht for my yacht)</div> : null}
    </div>
  );
};

const BrainCam: React.FC<{ t: number; start: number }> = ({ t, start }) => {
  const s2 = spokenStart("c_brain2");
  const load = Math.min(1, (t - start) / Math.max(0.5, s2 - start));
  return (
    <div style={{ ...panel, position: "absolute", left: 60, top: 60, padding: "14px 24px", border: `2px solid ${RED}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: RED, opacity: Math.floor(t * 2) % 2 ? 1 : 0.3 }} />
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 3 }}>🧠 IVEY BRAIN CAM</div>
      </div>
      <div style={{ width: 380, height: 16, borderRadius: 8, background: "rgba(255,255,255,0.15)", marginTop: 12, overflow: "hidden" }}>
        <div style={{ width: `${load * 100}%`, height: "100%", background: t >= s2 ? GREEN : GOLD }} />
      </div>
      <div style={{ fontSize: 20, marginTop: 8, opacity: 0.8 }}>{t >= s2 ? "thoughts detected: 1 (sandwich)" : "scanning for emotions..."}</div>
    </div>
  );
};

const PhoneCall: React.FC<{ t: number; start: number; sp: Sp }> = ({ t, start, sp }) => {
  const momT = spokenStart("mom_phone");
  const connected = t >= momT - 0.6;
  const secs = Math.max(0, Math.floor(t - momT + 1));
  const ring = !connected ? Math.sin(t * 40) * 3 : 0;
  const btn = (bg: string): React.CSSProperties => ({ width: 90, height: 90, borderRadius: 45, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 });
  return (
    <div style={{ position: "absolute", right: 120, top: 110, width: 360, height: 640, borderRadius: 48, background: "#111217", border: "8px solid #2b2d36", boxShadow: "0 20px 50px rgba(0,0,0,0.6)", transform: `translateY(${(1 - sp(start, 14)) * 900}px) rotate(${4 + ring}deg)`, color: "white", fontFamily: FONT, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 70 }}>
      <div style={{ width: 150, height: 150, borderRadius: 75, background: "#ffb3d1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 90 }}>👩</div>
      <div style={{ fontSize: 52, fontWeight: 900, marginTop: 22 }}>MOM ❤️</div>
      <div style={{ fontSize: 26, opacity: 0.75, marginTop: 6 }}>{connected ? `00:${String(secs).padStart(2, "0")}` : "calling..."}</div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: 60, marginBottom: 60 }}>
        <div style={btn(RED)}>📞</div>
        {!connected ? <div style={btn(GREEN)}>📞</div> : null}
      </div>
    </div>
  );
};

const Learned: React.FC<{ t: number; start: number; sp: Sp }> = ({ t, start, sp }) => {
  const at = spokenStart("m_learned");
  const items = [
    { w: "One", n: "1", text: "when Ivey checks, it means nothing", c: "white" },
    { w: "Two", n: "2", text: "when Ivey checks, it means EVERYTHING", c: GOLD },
    { w: "Three", n: "3", text: "I'm going home 🚶", c: RED },
  ];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "rgba(8,5,7,0.72)" }}>
      <div style={{ ...panel, padding: "34px 60px", border: `3px solid ${GOLD}`, width: 1300, transform: `scale(${sp(start, 13)}) rotate(-1deg)`, marginBottom: 120 }}>
        <div style={{ fontSize: 34, letterSpacing: 10, color: GOLD, textAlign: "center", fontWeight: 900 }}>THINGS I LEARNED TODAY</div>
        {items.map((it) => {
          const wt = wordAt("m_learned", at, it.w);
          return (
            <div key={it.n} style={{ display: "flex", gap: 22, alignItems: "baseline", fontSize: 52, fontWeight: 900, marginTop: 24, color: it.c, opacity: t >= wt ? 1 : 0, transform: `translateX(${t >= wt ? (1 - sp(wt, 12)) * -80 : 0}px)` }}>
              <span style={{ color: GOLD }}>{it.n}.</span>
              <span>{it.text}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- HUD ---------------- */
export const IveyHud2D: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const s = stateAt(t);
  const b = beatAt(t);
  const sp: Sp = (start, damping = 13) => spring({ frame: Math.round((t - start) * fps), fps, config: { damping } });
  const decide = findBeat("decide");
  const reveal = findBeat("reveal");
  const outro = findBeat("outro");
  const gag = b.step.k === "gag" ? (b.step as { gag: Gag }).gag : null;
  const showTable = !["title", "outro", "cold", "rewind"].includes(b.step.k) && gag !== "learned";
  const revealed = s.revealAt !== null && t >= s.revealAt + 0.3;
  const checks = iveyChecks(t);
  const lastCheck = checks[checks.length - 1];
  const tallyT = lastCheck ? lastCheck.t + 0.35 : 0;
  const shownChecks = lastCheck ? (t >= tallyT ? checks.length : checks.length - 1) : 0;
  const tallyOn = shownChecks > 0 && t < reveal.end + 3 && showTable && gag !== "brain" && gag !== "phone";

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {showTable ? (
        <>
          {/* name plates */}
          <div style={{ ...panel, position: "absolute", left: 340, top: 575, width: 400, padding: "8px 16px" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#5fe3d4" }}>YOU</div>
            <div style={{ fontSize: 15, opacity: 0.75 }}>Button · {s.hand || "Ace-Queen suited"}</div>
          </div>
          <div style={{ ...panel, position: "absolute", left: 1180, top: 575, width: 400, padding: "8px 16px" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#b9c4ff" }}>PHIL IVEY</div>
            <div style={{ fontSize: 15, opacity: 0.75 }}>Under the gun · {revealed ? "Aces full of eights 🙂" : "? ?"}</div>
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
              <div style={{ padding: "6px 20px", borderRadius: 12, background: s.label.includes("IVEY") ? "#3a2a5a" : "#0f4a44", color: "white", fontSize: 24, fontWeight: 900, transform: `scale(${sp(s.labelAt, 14)})` }}>{s.label}</div>
            </div>
          ) : null}
          {/* pop sticker */}
          {s.pop && t - s.pop.t < 1.6 ? (
            <div style={{ position: "absolute", left: 640, top: 150, ...sticker(56, s.pop.color), transform: `rotate(-6deg) scale(${sp(s.pop.t, 10)})`, opacity: interpolate(t - s.pop.t, [1.2, 1.6], [1, 0], clamp) }}>{s.pop.text}</div>
          ) : null}
        </>
      ) : null}

      {/* check tally */}
      {tallyOn ? (
        <div style={{ ...panel, position: "absolute", right: 40, top: 40, padding: "12px 22px", border: `2px solid ${shownChecks >= 3 ? RED : "rgba(255,255,255,0.25)"}`, transform: `scale(${t >= tallyT ? 1 + 0.25 * (1 - sp(tallyT, 8)) : 1})` }}>
          <div style={{ fontSize: 18, letterSpacing: 4, opacity: 0.75, fontWeight: 800 }}>IVEY CHECKS</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: shownChecks >= 3 ? RED : GOLD }}>{shownChecks}</div>
            <div style={{ fontSize: 22, opacity: 0.85, maxWidth: 190 }}>{shownChecks >= 3 ? "totally harmless 🙂" : "nothing to see here"}</div>
          </div>
        </div>
      ) : null}

      {/* gags */}
      {gag === "stats" ? <StatsCard t={t} start={b.start} sp={sp} /> : null}
      {gag === "yacht" ? <YachtDream t={t} start={b.start} end={b.end} sp={sp} /> : null}
      {gag === "brain" ? <BrainCam t={t} start={b.start} /> : null}
      {gag === "phone" ? <PhoneCall t={t} start={b.start} sp={sp} /> : null}
      {gag === "learned" ? <Learned t={t} start={b.start} sp={sp} /> : null}

      {/* cold open */}
      {b.step.k === "cold" ? (
        <>
          <div style={{ position: "absolute", left: 60, top: 50, ...sticker(44), opacity: interpolate(t - b.start, [0, 0.15, 1.0, 1.2], [0, 1, 1, 0], clamp) }}>*record scratch*</div>
          <div style={{ position: "absolute", left: 60, top: 50, ...sticker(44), opacity: interpolate(t - b.start, [1.2, 1.4], [0, 1], clamp) }}>*freeze frame*</div>
          <div style={{ position: "absolute", left: 1060, top: 170, ...sticker(68, GOLD), transform: `rotate(-4deg) scale(${sp(b.start + 1.4, 10)})` }}>← yep, that's me</div>
        </>
      ) : null}
      {b.step.k === "rewind" ? (
        <AbsoluteFill>
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 2px, transparent 2px, transparent 5px)" }} />
          <div style={{ position: "absolute", left: 60, top: 50, fontFamily: "monospace", fontSize: 72, fontWeight: 900, color: "white", textShadow: "4px 0 #ff2d55, -4px 0 #2de1ff" }}>◀◀ REWIND</div>
          <div style={{ position: "absolute", right: 60, top: 70, fontFamily: "monospace", fontSize: 40, color: "white", opacity: Math.floor(t * 4) % 2 ? 1 : 0.4 }}>3 MINUTES EARLIER</div>
        </AbsoluteFill>
      ) : null}

      {/* title */}
      {b.step.k === "title" ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: "white", background: "rgba(10,6,8,0.55)" }}>
          <div style={{ fontSize: 30, letterSpacing: 12, color: GOLD, fontWeight: 900, opacity: interpolate(t, [b.start + 0.3, b.start + 1.0], [0, 1], clamp) }}>A POKER HORROR STORY</div>
          <div style={{ textAlign: "center", lineHeight: 0.95, transform: `scale(${sp(b.start + 0.6, 11)}) rotate(-2deg)`, marginTop: 10 }}>
            <div style={sticker(150)}>HE CHECKED</div>
            <div style={sticker(150, GOLD)}>THREE TIMES</div>
          </div>
          <div style={{ ...sticker(56, "#b9c4ff"), marginTop: 16, marginBottom: 120, opacity: interpolate(t, [b.end - 4, b.end - 3.2], [0, 1], clamp) }}>vs PHIL IVEY</div>
        </AbsoluteFill>
      ) : null}

      {/* decision */}
      {t >= decide.start && t < decide.end + 1.6
        ? (() => {
            const dt = t - decide.start;
            const count = Math.max(1, 3 - Math.floor(dt - 1.4));
            return (
              <div style={{ position: "absolute", left: 0, right: 0, top: 40, display: "flex", flexDirection: "column", alignItems: "center", opacity: interpolate(t, [decide.end + 1.1, decide.end + 1.6], [1, 0], clamp) }}>
                <div style={{ ...panel, padding: "20px 50px", textAlign: "center", border: `2px solid ${GOLD}` }}>
                  <div style={{ fontSize: 22, letterSpacing: 6, opacity: 0.8 }}>325K TO CALL · POT 775K</div>
                  <div style={{ fontSize: 84, fontWeight: 900, transform: `scale(${sp(decide.start, 11)})` }}>WOULD YOU CALL?</div>
                  <div style={{ display: "flex", gap: 28, justifyContent: "center", marginTop: 8 }}>
                    <div style={{ padding: "12px 40px", borderRadius: 14, fontSize: 40, fontWeight: 900, background: "#3a1218", border: `3px solid ${RED}` }}>FOLD 🐔</div>
                    <div style={{ fontSize: 70, fontWeight: 900, color: GOLD, width: 80 }}>{dt > 1.4 && dt < 4.4 ? count : "?"}</div>
                    <div style={{ padding: "12px 40px", borderRadius: 14, fontSize: 40, fontWeight: 900, background: "#0f3a22", border: `3px solid ${GREEN}` }}>CALL 🦸</div>
                  </div>
                  <div style={{ fontSize: 24, marginTop: 10, opacity: 0.85 }}>lock in your answer in the comments 👇</div>
                </div>
              </div>
            );
          })()
        : null}

      {/* reveal */}
      {t >= reveal.start + 1.2 && t < reveal.end + 3 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 60, display: "flex", justifyContent: "center" }}>
          <div style={{ ...panel, padding: "14px 40px", border: `3px solid ${RED}`, transform: `scale(${sp(reveal.start + 1.2, 10)}) rotate(-2deg)`, textAlign: "center" }}>
            <div style={{ fontSize: 72, fontWeight: 900, color: RED }}>ACES FULL 💀</div>
            <div style={{ fontSize: 28, fontWeight: 700, opacity: 0.9 }}>he had it the whole time</div>
          </div>
        </div>
      ) : null}

      {/* outro */}
      {b.step.k === "outro" ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "rgba(8,5,7,0.6)", color: "white" }}>
          <div style={{ ...sticker(110), transform: `scale(${sp(outro.start, 10)}) rotate(-2deg)` }}>Would YOU have called?</div>
          <div style={{ fontSize: 40, opacity: 0.9, marginTop: 24, marginBottom: 120, fontWeight: 700 }}>comment below 👇 · subscribe or Ivey will check-raise you too</div>
        </AbsoluteFill>
      ) : null}

      <Subtitles t={t} />
    </AbsoluteFill>
  );
};
