import { AbsoluteFill, interpolate, spring } from "remotion";
import { LINES, TL, W, beatAt, beatOf, ease, vis, type Scene } from "./timeline";

const FONT = "Inter, Helvetica, Arial, sans-serif";
const AT = "#ff7ad9"; // astatine accent
const GOLD = "#ffd34d";
const CYAN = "#7fd8ff";
const RED = "#ff5d6c";
const GREEN = "#5ee38a";
const INK = "#0b0714";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const card: React.CSSProperties = {
  background: "rgba(14,10,26,0.82)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 20,
  color: "white",
  fontFamily: FONT,
  boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
};
const big = (size: number, color = "white"): React.CSSProperties => ({ fontSize: size, fontWeight: 900, color, fontFamily: FONT, letterSpacing: -1 });

type Ctx = { t: number; fps: number; sp: (start: number, damping?: number) => number; on: (at: number, dur?: number) => number };

/** Fade + rise in at time `at`. */
const In: React.FC<{ c: Ctx; at: number; children: React.ReactNode; style?: React.CSSProperties; dy?: number }> = ({ c, at, children, style, dy = 24 }) => {
  const k = c.on(at);
  if (k <= 0) return null;
  return <div style={{ opacity: k, transform: `translateY(${(1 - c.sp(at, 16)) * dy}px)`, ...style }}>{children}</div>;
};

/* ---------------- periodic table ---------------- */
// [symbol, period(1..7), group(1..18)] main-block elements only (no lanthanides/actinides rows)
const SYMBOLS =
  "H,He|Li,Be,B,C,N,O,F,Ne|Na,Mg,Al,Si,P,S,Cl,Ar|K,Ca,Sc,Ti,V,Cr,Mn,Fe,Co,Ni,Cu,Zn,Ga,Ge,As,Se,Br,Kr|Rb,Sr,Y,Zr,Nb,Mo,Tc,Ru,Rh,Pd,Ag,Cd,In,Sn,Sb,Te,I,Xe|Cs,Ba,La,Hf,Ta,W,Re,Os,Ir,Pt,Au,Hg,Tl,Pb,Bi,Po,At,Rn|Fr,Ra,Ac,Rf,Db,Sg,Bh,Hs,Mt,Ds,Rg,Cn,Nh,Fl,Mc,Lv,Ts,Og"
    .split("|")
    .map((row) => row.split(","));
const groupOf = (period: number, i: number, n: number) => {
  if (period === 1) return i === 0 ? 1 : 18;
  if (n === 8) return i < 2 ? i + 1 : i + 11;
  return i + 1;
};
const HALOGEN_WORD: Record<string, string> = { F: "fluorine", Cl: "chlorine", Br: "bromine", I: "iodine" };

const PeriodicTable: React.FC<{ c: Ctx; k: number; shrink: number }> = ({ c, k, shrink }) => {
  const s04 = "s04";
  const groupT = W(s04, "halogens");
  const hereT = W(s04, "here");
  const cell = 64;
  const scale = 1 - 0.32 * shrink;
  return (
    <div style={{ position: "absolute", left: "50%", top: lerpN(90, 40, shrink), transform: `translateX(-50%) scale(${scale})`, transformOrigin: "top center", opacity: k }}>
      <div style={{ position: "relative", width: cell * 18, height: cell * 7 }}>
        {SYMBOLS.flatMap((row, pi) =>
          row.map((sym, i) => {
            const g = groupOf(pi + 1, i, row.length);
            const isAt = sym === "At";
            const halo = g === 17;
            const litWord = HALOGEN_WORD[sym];
            const lit = isAt ? c.t >= hereT : litWord ? c.t >= W(s04, litWord) : false;
            const groupLit = halo && c.t >= groupT;
            const appear = c.on(beatOf(s04).start + (pi * 18 + g) * 0.006, 0.3);
            const pulse = isAt && lit ? 1 + 0.08 * Math.sin(c.t * 6) : 1;
            return (
              <div
                key={sym}
                style={{
                  position: "absolute",
                  left: (g - 1) * cell,
                  top: pi * cell,
                  width: cell - 6,
                  height: cell - 6,
                  borderRadius: 8,
                  background: isAt && lit ? AT : lit ? "#3b8cff" : groupLit ? "rgba(127,216,255,0.22)" : "rgba(255,255,255,0.08)",
                  border: `2px solid ${isAt ? AT : groupLit ? CYAN : "rgba(255,255,255,0.12)"}`,
                  color: "white",
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: appear * (groupLit || isAt || c.t < groupT ? 1 : 0.45),
                  transform: `scale(${pulse * (0.6 + 0.4 * appear)})`,
                  boxShadow: isAt && lit ? `0 0 30px ${AT}` : undefined,
                }}
              >
                {sym}
              </div>
            );
          }),
        )}
        {c.t >= groupT ? (
          <div style={{ position: "absolute", left: 16 * cell - 30, top: -46, ...big(26, CYAN), opacity: c.on(groupT), whiteSpace: "nowrap" }}>HALOGENS ↓</div>
        ) : null}
      </div>
    </div>
  );
};
const lerpN = (a: number, b: number, k: number) => a + (b - a) * k;

const Cousins: React.FC<{ c: Ctx }> = ({ c }) => {
  const items = [
    { sym: "Cl", name: "Chlorine", ic: "🧂", what: "table salt", at: W("s05", "salt"), col: "#3b8cff" },
    { sym: "I", name: "Iodine", ic: "💊", what: "multivitamins", at: W("s05", "multivitamin"), col: "#3b8cff" },
    { sym: "At", name: "Astatine", ic: "❓", what: "missing", at: W("s05", "missing"), col: AT },
  ];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center", gap: 40 }}>
      {items.map((it) => (
        <In key={it.sym} c={c} at={it.at}>
          <div style={{ ...card, width: 330, padding: "20px 24px", display: "flex", alignItems: "center", gap: 18, border: `2px solid ${it.col}` }}>
            <div style={{ width: 84, height: 84, borderRadius: 12, background: it.col, display: "flex", alignItems: "center", justifyContent: "center", ...big(40) }}>{it.sym}</div>
            <div>
              <div style={{ fontSize: 22, opacity: 0.7, fontWeight: 700 }}>{it.name}</div>
              <div style={{ fontSize: 34, fontWeight: 900 }}>
                {it.ic} {it.what}
              </div>
            </div>
          </div>
        </In>
      ))}
    </div>
  );
};

/* ---------------- half-lives (log scale) ---------------- */
const HalfLives: React.FC<{ c: Ctx; k: number }> = ({ c, k }) => {
  const id = "s08";
  const b = beatOf(id);
  const rows = [
    { name: "Uranium-238", val: "4.5 billion years", sec: 1.41e17, at: b.start + 0.2, col: "#8a93a8" },
    { name: "Astatine-210", val: "8.1 hours", sec: 29160, at: W(id, "two-ten"), col: AT, best: true },
    { name: "Astatine-219", val: "56 seconds", sec: 56, at: W(id, "nature"), col: AT },
    { name: "Astatine-218", val: "1.5 seconds", sec: 1.5, at: W(id, "minute"), col: AT },
    { name: "Astatine-217", val: "0.03 seconds", sec: 0.032, at: W(id, "fraction"), col: AT },
    { name: "Astatine-215", val: "0.0001 seconds", sec: 0.0001, at: W(id, "fraction") + 0.4, col: AT },
  ];
  const lo = Math.log10(1e-4);
  const hi = Math.log10(1.41e17);
  const W_ = 1000;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 90, display: "flex", justifyContent: "center", opacity: k }}>
      <div style={{ ...card, padding: "28px 40px", width: 1560 }}>
        <div style={{ fontSize: 26, letterSpacing: 8, color: GOLD, fontWeight: 900 }}>HALF-LIFE</div>
        <div style={{ fontSize: 20, opacity: 0.6, marginBottom: 14 }}>time for half of it to decay away (log scale)</div>
        {rows.map((r) => {
          const grow = ease((c.t - r.at) / 0.8);
          const w = ((Math.log10(r.sec) - lo) / (hi - lo)) * W_;
          return (
            <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 20, height: 74, opacity: c.on(r.at) }}>
              <div style={{ width: 250, fontSize: 28, fontWeight: 800, color: r.col === AT ? "#ffd2f1" : "#c9cfdb" }}>{r.name}</div>
              <div style={{ width: W_, height: 36, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ width: Math.max(8, w * grow), height: "100%", background: r.col, borderRadius: 10, boxShadow: r.best ? `0 0 20px ${AT}` : undefined }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, width: 260, color: r.best ? GOLD : "white" }}>{r.val}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- decay chain ---------------- */
const DecayChain: React.FC<{ c: Ctx; k: number }> = ({ c, k }) => {
  const s09 = beatOf("s09");
  const nodes = [
    { n: "U-238", at: W("s09", "uranium") },
    { n: "Th-234", at: W("s09", "decaying") },
    { n: "…", at: W("s09", "step") },
    { n: "Rn-222", at: W("s09", "step", 1) },
    { n: "Po-218", at: W("s09", "step", 1) + 0.3 },
    { n: "…", at: W("s09", "into") },
    { n: "Pb-206", at: W("s09", "lead"), stable: true },
  ];
  const sideT = W("s10", "side");
  const existT = W("s10", "exists");
  const goneT = W("s10", "gone");
  const nodeW = 170;
  const gap = 44;
  const x0 = (1920 - (nodes.length * nodeW + (nodes.length - 1) * gap)) / 2;
  const poX = x0 + 4 * (nodeW + gap) + nodeW / 2;
  const atAlive = c.t >= existT && c.t < goneT + 0.3;
  const blink = atAlive ? 1 : c.t >= goneT + 0.3 ? 0.18 : c.on(sideT);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: k }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", ...big(30, GOLD), letterSpacing: 6, opacity: c.on(s09.start + 0.3) }}>URANIUM DECAY CHAIN</div>
      <div style={{ position: "absolute", left: x0, top: 280, display: "flex", gap }}>
        {nodes.map((nd, i) => (
          <div key={i} style={{ width: nodeW, opacity: c.on(nd.at), transform: `scale(${0.7 + 0.3 * c.sp(nd.at, 12)})` }}>
            <div style={{ ...card, height: 110, display: "flex", alignItems: "center", justifyContent: "center", ...big(36, nd.stable ? GREEN : "white"), border: `2px solid ${nd.stable ? GREEN : "rgba(255,255,255,0.2)"}` }}>{nd.n}</div>
            {nd.stable ? <div style={{ textAlign: "center", fontSize: 22, color: GREEN, marginTop: 8, fontFamily: FONT, fontWeight: 800 }}>stable lead</div> : null}
            {i < nodes.length - 1 ? <div style={{ position: "absolute", marginLeft: nodeW + 4, marginTop: -72, ...big(30, "#9aa3b8") }}>→</div> : null}
          </div>
        ))}
      </div>
      {c.t >= sideT ? (
        <>
          <svg style={{ position: "absolute", left: 0, top: 0 }} width={1920} height={1080}>
            <path d={`M${poX} 392 C ${poX} 470, ${poX + 30} 500, ${poX + 30} ${lerpN(392, 560, ease((c.t - sideT) / 0.8))}`} stroke={AT} strokeWidth={5} fill="none" strokeDasharray="10 8" />
          </svg>
          <div style={{ position: "absolute", left: poX + 50, top: 450, fontSize: 24, color: "#ffd2f1", fontFamily: FONT, fontWeight: 800, opacity: c.on(sideT + 0.4) }}>rare side path (~2 in 10,000)</div>
          <div
            style={{
              position: "absolute",
              left: poX + 30 - 95,
              top: 570,
              width: 190,
              height: 120,
              ...card,
              border: `3px solid ${AT}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: c.t >= existT ? blink : c.on(sideT + 0.6) * 0.5,
              boxShadow: atAlive ? `0 0 40px ${AT}` : undefined,
              transform: `scale(${atAlive ? 1 + 0.05 * Math.sin(c.t * 10) : 1})`,
            }}
          >
            <div style={big(38, AT)}>At-218</div>
            <div style={{ fontSize: 20, opacity: 0.8 }}>{c.t >= goneT + 0.3 ? "gone 💨" : "~1.5 s"}</div>
          </div>
        </>
      ) : null}
    </div>
  );
};

/* ---------------- cancer cells ---------------- */
const Cells: React.FC<{ c: Ctx; k: number }> = ({ c, k }) => {
  const id = "s21";
  const seekT = W(id, "seeks");
  const fireT = W(id, "fires");
  const destroyT = W(id, "destroy");
  const cellsT = W(id, "cell");
  const cells: { x: number; y: number; tumor: boolean }[] = [];
  for (let r = 0; r < 6; r++)
    for (let q = 0; q < 11; q++) {
      const x = 600 + q * 112 + (r % 2) * 56;
      const y = 250 + r * 100;
      const dx = x - 1180;
      const dy = y - 490;
      cells.push({ x, y, tumor: dx * dx * 0.6 + dy * dy < 190 * 190 });
    }
  const tumors = cells.filter((x) => x.tumor);
  const fire = c.t >= fireT ? ((c.t - fireT) % 1.2) / 1.2 : -1;
  const dead = ease((c.t - destroyT) / 1.2);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: k }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {cells.map((cl, i) => (
          <g key={i} transform={`translate(${cl.x} ${cl.y})`}>
            <ellipse rx={54} ry={46} fill={cl.tumor ? `rgba(181,92,255,${0.75 - 0.5 * dead})` : "rgba(94,227,138,0.55)"} stroke={cl.tumor ? "#d9a6ff" : "#9ff0bb"} strokeWidth={3} strokeDasharray={cl.tumor && dead > 0.3 ? "6 8" : undefined} />
            <circle r={14} fill={cl.tumor ? "#7a2bc0" : "#2f9e5a"} opacity={cl.tumor ? 1 - 0.7 * dead : 1} />
          </g>
        ))}
        {/* carrier molecules homing in on tumor cells */}
        {tumors.map((tc, i) => {
          const start = { x: 200 + (i % 4) * 40, y: 120 + i * 60 };
          const m = ease((c.t - seekT - i * 0.12) / 1.6);
          if (c.t < seekT) return null;
          const x = lerpN(start.x, tc.x + 30, m);
          const y = lerpN(start.y, tc.y - 30, m);
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <line x1={-26} y1={-10} x2={0} y2={0} stroke="#cfd6ff" strokeWidth={5} />
              <circle r={11} fill={AT} stroke="white" strokeWidth={2} />
              {fire >= 0 && m > 0.95 && (i + Math.floor((c.t - fireT) / 1.2)) % 2 === 0
                ? Array.from({ length: 6 }, (_, j) => {
                    const a = (j / 6) * Math.PI * 2 + i;
                    const r = 10 + fire * 70;
                    return <line key={j} x1={Math.cos(a) * 10} y1={Math.sin(a) * 10} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke={GOLD} strokeWidth={4} opacity={1 - fire} strokeLinecap="round" />;
                  })
                : null}
            </g>
          );
        })}
      </svg>
      <In c={c} at={beatOf(id).start + 0.4} style={{ position: "absolute", left: 80, top: 70 }}>
        <div style={big(34, "#ffd2f1")}>Targeted alpha therapy (in clinical trials)</div>
      </In>
      <div style={{ position: "absolute", left: 50, top: 200, width: 480, display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
        <In c={c} at={seekT}>
          <div style={{ ...card, padding: "10px 18px", fontSize: 26, fontWeight: 800 }}>
            <span style={{ color: AT }}>●</span> At-211 on a tumor-seeking molecule
          </div>
        </In>
        <In c={c} at={fireT}>
          <div style={{ ...card, padding: "10px 18px", fontSize: 26, fontWeight: 800 }}>
            <span style={{ color: GOLD }}>✷</span> alpha range: a few cell widths
          </div>
        </In>
        <In c={c} at={cellsT}>
          <div style={{ ...card, padding: "10px 18px", fontSize: 26, fontWeight: 800 }}>
            <span style={{ color: GREEN }}>●</span> healthy cells mostly spared
          </div>
        </In>
      </div>
    </div>
  );
};

/* ---------------- subtitles ---------------- */
type Word = { text: string; s: number; e: number };
const CHUNKS: Word[][] = [];
for (const b of TL.beats) {
  if (!b.id) continue;
  let cur: Word[] = [];
  for (const cap of LINES[b.id].captions) {
    const w = { text: cap.text.trim(), s: b.voiceAt + cap.startMs / 1000, e: b.voiceAt + cap.endMs / 1000 };
    if (!w.text) continue;
    cur.push(w);
    if (cur.length >= 6 || (/[.!?…,:]$/.test(w.text) && cur.length >= 2)) {
      CHUNKS.push(cur);
      cur = [];
    }
  }
  if (cur.length) CHUNKS.push(cur);
}
const Subtitles: React.FC<{ t: number }> = ({ t }) => {
  const i = CHUNKS.findIndex((c, k) => t >= c[0].s - 0.05 && t < Math.min(c[c.length - 1].e + 0.35, CHUNKS[k + 1]?.[0].s ?? Infinity));
  if (i < 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 42, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 1600, textAlign: "center" }}>
        {CHUNKS[i].map((w, k) => (
          <span key={k} style={{ display: "inline-block", margin: "0 9px", fontSize: 50, fontWeight: 900, fontFamily: FONT, color: t >= w.s ? (t < w.e + 0.05 ? GOLD : "white") : "rgba(255,255,255,0.5)", WebkitTextStroke: `8px ${INK}`, paintOrder: "stroke" }}>
            {w.text.replace(/[,.…]+$/, "")}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ---------------- all overlays ---------------- */
export const Overlays: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const sp = (start: number, damping = 13) => spring({ frame: Math.round((t - start) * fps), fps, config: { damping } });
  const c: Ctx = { t, fps, sp, on: (at, dur = 0.35) => interpolate(t, [at, at + dur], [0, 1], clamp) };
  const b = beatAt(t);
  const V = (s: Scene | Scene[]) => vis(s, t);
  const is = (id: string) => b.id === id;

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "white" }}>
      {/* ---- Earth ---- */}
      {V("earth") > 0 && t < beatOf("s11").start ? (
        <div style={{ position: "absolute", inset: 0, opacity: V("earth") }}>
          <In c={c} at={W("s01", "entire")} style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center" }}>
            <div style={{ fontSize: 30, letterSpacing: 8, opacity: 0.8, fontWeight: 800 }}>ALL OF EARTH'S CRUST</div>
          </In>
          <In c={c} at={W("s01", "less")} style={{ position: "absolute", left: 0, right: 0, top: 118, textAlign: "center" }}>
            <div style={big(96, AT)}>less than 1 gram</div>
          </In>
          <In c={c} at={W("s02", "paperclip")} style={{ position: "absolute", right: 230, top: 330 }}>
            <div style={{ ...card, padding: "30px 40px", textAlign: "center", border: `2px solid ${CYAN}` }}>
              <svg width={240} height={120} viewBox="0 0 240 120">
                <path d="M40 90 H190 A26 26 0 0 0 190 38 H60 A16 16 0 0 0 60 70 H180" fill="none" stroke="#cfd8e6" strokeWidth={9} strokeLinecap="round" />
              </svg>
              <div style={big(48, CYAN)}>≈ 1 gram</div>
              <div style={{ fontSize: 24, opacity: 0.75 }}>one paperclip</div>
            </div>
          </In>
        </div>
      ) : null}
      {V("earth") > 0 && t >= beatOf("s11").start - 0.1 ? (
        <div style={{ position: "absolute", inset: 0, opacity: V("earth") }}>
          <In c={c} at={beatOf("s11").start + 0.3} style={{ position: "absolute", left: 80, top: 90 }}>
            <div style={{ fontSize: 26, letterSpacing: 6, opacity: 0.75, fontWeight: 800 }}>ASTATINE ON EARTH RIGHT NOW</div>
            <div style={big(84, AT)}>≈ 1 gram</div>
          </In>
          <In c={c} at={W("s11", "ounce")} style={{ position: "absolute", left: 80, top: 260 }}>
            <div style={{ fontSize: 30, opacity: 0.85, fontWeight: 700 }}>some estimates: up to ~28 g (1 oz)</div>
          </In>
          <In c={c} at={W("s11", "made")} style={{ position: "absolute", right: 90, top: 420 }}>
            <div style={{ ...card, padding: "18px 28px", fontSize: 34, fontWeight: 900 }}>
              <span style={{ color: GOLD }}>made</span> ⇄ <span style={{ color: RED }}>destroyed</span>
              <div style={{ fontSize: 22, opacity: 0.7, fontWeight: 700 }}>constantly, all at once</div>
            </div>
          </In>
        </div>
      ) : null}

      {/* ---- element tile ---- */}
      {V("tile") > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: V("tile") }}>
          <div style={{ display: "flex", alignItems: "center", gap: 80 }}>
            <div style={{ width: 420, height: 480, borderRadius: 30, background: "linear-gradient(160deg, #2a1240, #120a1e)", border: `5px solid ${AT}`, boxShadow: `0 0 80px rgba(255,122,217,0.45)`, padding: 34, position: "relative", transform: `scale(${0.6 + 0.4 * sp(beatOf("s03").start, 12)}) rotate(${-3 + 3 * sp(beatOf("s03").start, 12)}deg)` }}>
              <div style={{ ...big(56, "#ffd2f1") }}>85</div>
              <div style={{ ...big(200, AT), textAlign: "center", marginTop: -10 }}>At</div>
              <div style={{ ...big(48), textAlign: "center" }}>Astatine</div>
              <div style={{ fontSize: 30, textAlign: "center", opacity: 0.7, marginTop: 8 }}>[210]</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <In c={c} at={W("s03", "rare")}>
                <div style={{ ...card, padding: "14px 24px", fontSize: 34, fontWeight: 800 }}>🔍 why is it so rare?</div>
              </In>
              <In c={c} at={W("s03", "hands")}>
                <div style={{ ...card, padding: "14px 24px", fontSize: 34, fontWeight: 800 }}>🧤 can you get some?</div>
              </In>
              <In c={c} at={W("s03", "Spoiler")}>
                <div style={{ fontSize: 28, opacity: 0.8, fontStyle: "italic", paddingLeft: 10 }}>spoiler: probably not</div>
              </In>
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* ---- title ---- */}
      {V("title") > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: V("title"), background: "radial-gradient(ellipse at center, rgba(5,1,15,0.15), rgba(5,1,15,0.7))" }}>
          <div style={{ fontSize: 30, letterSpacing: 14, color: CYAN, fontWeight: 800 }}>ELEMENT 85</div>
          <div style={{ ...big(190, "white"), letterSpacing: 6, transform: `scale(${0.8 + 0.2 * sp(beatAt(t).start, 11)})`, textShadow: `0 0 60px ${AT}` }}>ASTATINE</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: "#ffd2f1" }}>the rarest element on Earth</div>
        </AbsoluteFill>
      ) : null}

      {/* ---- periodic table ---- */}
      {V("table") > 0 ? (
        <>
          <PeriodicTable c={c} k={V("table")} shrink={ease((t - beatOf("s05").start) / 0.7)} />
          {is("s05") || t >= beatOf("s05").start ? <div style={{ opacity: V("table") }}><Cousins c={c} /></div> : null}
        </>
      ) : null}

      {/* ---- nucleus ---- */}
      {V("nucleus") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: V("nucleus") }}>
          <In c={c} at={W("s06", "eighty-five")} style={{ position: "absolute", left: 110, top: 150 }}>
            <div style={big(78, RED)}>85 protons</div>
            <div style={{ fontSize: 30, opacity: 0.8, fontWeight: 700 }}>+ 125 neutrons (astatine-210)</div>
          </In>
          <In c={c} at={W("s06", "positively")} style={{ position: "absolute", right: 120, top: 170 }}>
            <div style={{ ...card, padding: "18px 26px", textAlign: "center" }}>
              <div style={big(64, RED)}>+ ⟷ +</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>like charges push apart</div>
            </div>
          </In>
          <In c={c} at={W("s07", "strong")} style={{ position: "absolute", right: 120, top: 400 }}>
            <div style={{ ...card, padding: "16px 24px", fontSize: 28, fontWeight: 800 }}>
              strong force: <span style={{ color: GOLD }}>losing</span> 😬
            </div>
          </In>
          <In c={c} at={W("s07", "radioactive")} style={{ position: "absolute", left: 110, top: 420 }}>
            <div style={big(60, GOLD)}>☢ radioactive</div>
          </In>
          {t >= W("s07", "stable") ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center" }}>
              <div style={{ border: `6px solid ${RED}`, borderRadius: 14, padding: "8px 30px", ...big(64, RED), transform: `rotate(-6deg) scale(${1 + 1.5 * (1 - sp(W("s07", "stable"), 9))})`, opacity: c.on(W("s07", "stable"), 0.1), background: "rgba(20,5,10,0.7)" }}>0 STABLE ISOTOPES</div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---- half-lives ---- */}
      {V("halflife") > 0 ? <HalfLives c={c} k={V("halflife")} /> : null}

      {/* ---- decay chain ---- */}
      {V("chain") > 0 ? <DecayChain c={c} k={V("chain")} /> : null}

      {/* ---- vaporizing chunk ---- */}
      {V("vapor") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: V("vapor") }}>
          <In c={c} at={W("s12", "seen")} style={{ position: "absolute", left: 110, top: 150 }}>
            <div style={big(64)}>👀 never seen</div>
          </In>
          <In c={c} at={W("s12", "heat")} style={{ position: "absolute", right: 110, top: 200 }}>
            <div style={{ ...card, padding: "16px 24px", fontSize: 30, fontWeight: 800 }}>🔥 heated by its own radioactivity</div>
          </In>
          {t >= W("s12", "vaporize") ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", ...big(72, "#ffb36b"), opacity: c.on(W("s12", "vaporize"), 0.2) }}>poof. 💨</div>
          ) : null}
        </div>
      ) : null}

      {/* ---- mystery ---- */}
      {V("mystery") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: V("mystery") }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontSize: 30, letterSpacing: 8, fontWeight: 800, opacity: 0.8 }}>ARTIST'S GUESS · NOT A REAL PHOTO</div>
          <In c={c} at={W("s13", "dark")} style={{ position: "absolute", right: 140, top: 380 }}>
            <div style={{ ...card, padding: "18px 26px", fontSize: 30, fontWeight: 800, lineHeight: 1.5 }}>
              predicted:
              <br />◼ dark
              <br />✨ shiny
              <br />🔩 metal-like
            </div>
          </In>
          <div style={{ position: "absolute", left: 220, top: 330, ...big(240, "rgba(255,255,255,0.12)") }}>?</div>
        </div>
      ) : null}

      {/* ---- Greek name ---- */}
      {V("greek") > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: V("greek") }}>
          <In c={c} at={W("s14", "Greek")}>
            <div style={{ ...big(150, "white"), fontFamily: "Georgia, serif", fontWeight: 700, letterSpacing: 2 }}>ἄστατος</div>
          </In>
          <In c={c} at={W("s14", "astatos")}>
            <div style={{ fontSize: 56, fontStyle: "italic", opacity: 0.85, textAlign: "center" }}>astatos</div>
          </In>
          <In c={c} at={W("s14", "unstable")}>
            <div style={{ ...big(84, AT), marginTop: 20 }}>= “unstable”</div>
          </In>
        </AbsoluteFill>
      ) : null}

      {/* ---- history ---- */}
      {V("history") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: V("history") }}>
          <div style={{ position: "absolute", left: 180, right: 180, top: 520, height: 6, background: "rgba(255,255,255,0.25)", borderRadius: 3 }} />
          <In c={c} at={W("s15", "Mendeleev")} style={{ position: "absolute", left: 200, top: 150, width: 640 }}>
            <div style={{ ...card, padding: "22px 28px" }}>
              <div style={big(64, GOLD)}>1869</div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>Mendeleev's periodic table</div>
              <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                {["F", "Cl", "Br", "I", "?"].map((s) => (
                  <div key={s} style={{ width: 70, height: 70, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", ...big(30, s === "?" ? AT : "white"), border: `2px ${s === "?" ? "dashed" : "solid"} ${s === "?" ? AT : "rgba(255,255,255,0.3)"}`, opacity: s === "?" ? c.on(W("s15", "empty")) : 1 }}>
                    {s}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 28, marginTop: 14, color: "#ffd2f1", fontWeight: 800, opacity: c.on(W("s15", "eka-iodine")) }}>“eka-iodine”: missing for decades</div>
            </div>
          </In>
          <In c={c} at={W("s16", "nineteen")} style={{ position: "absolute", right: 200, top: 150, width: 640 }}>
            <div style={{ ...card, padding: "22px 28px" }}>
              <div style={big(64, GOLD)}>1940</div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>UC Berkeley</div>
              <div style={{ fontSize: 24, opacity: 0.8, marginTop: 6 }}>Dale Corson, Kenneth MacKenzie & Emilio Segrè</div>
              <div style={{ fontSize: 28, marginTop: 14, fontWeight: 800 }}>bismuth + alpha particles → astatine</div>
            </div>
          </In>
          {t >= W("s16", "made") ? (
            <div style={{ position: "absolute", right: 260, top: 590, border: `6px solid ${GREEN}`, borderRadius: 14, padding: "6px 26px", ...big(60, GREEN), transform: `rotate(-5deg) scale(${1 + 1.2 * (1 - sp(W("s16", "made"), 9))})`, background: "rgba(5,20,10,0.7)" }}>MADE IT INSTEAD</div>
          ) : null}
        </div>
      ) : null}

      {/* ---- cyclotron ---- */}
      {V("cyclotron") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: V("cyclotron") }}>
          <In c={c} at={W("s17", "cyclotron")} style={{ position: "absolute", left: 100, top: 80 }}>
            <div style={{ fontSize: 26, letterSpacing: 8, opacity: 0.75, fontWeight: 800 }}>HOW IT'S MADE</div>
            <div style={big(80, "#ffb36b")}>the cyclotron</div>
          </In>
          <In c={c} at={W("s18", "helium")} style={{ position: "absolute", right: 100, top: 110 }}>
            <div style={{ ...card, padding: "14px 22px", fontSize: 28, fontWeight: 800 }}>
              <span style={{ color: GOLD }}>●</span> alpha particle = helium nucleus (2 protons + 2 neutrons)
            </div>
          </In>
          <In c={c} at={W("s18", "bismuth")} style={{ position: "absolute", right: 150, top: 560 }}>
            <div style={{ ...card, padding: "14px 22px", fontSize: 30, fontWeight: 800, border: `2px solid #d8c7e8` }}>🎯 bismuth-209 target</div>
          </In>
          {t >= beatOf("s19").start ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", justifyContent: "center", gap: 30, alignItems: "center" }}>
              {[
                { at: W("s19", "Bismuth"), sym: "Bi", z: "83", col: "#d8c7e8" },
                { at: W("s19", "alpha"), sym: "+", z: "", col: "white" },
                { at: W("s19", "two"), sym: "α", z: "2", col: GOLD },
                { at: W("s19", "eighty-five"), sym: "=", z: "", col: "white" },
                { at: W("s19", "Astatine"), sym: "At", z: "85", col: AT },
              ].map((e, i) =>
                e.z ? (
                  <div key={i} style={{ ...card, width: 190, height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `3px solid ${e.col}`, opacity: c.on(e.at), transform: `scale(${0.6 + 0.4 * sp(e.at, 11)})` }}>
                    <div style={big(90, e.col)}>{e.sym}</div>
                    <div style={{ fontSize: 30, fontWeight: 800 }}>{e.z} protons</div>
                  </div>
                ) : (
                  <div key={i} style={{ ...big(90), opacity: c.on(e.at) }}>{e.sym}</div>
                ),
              )}
            </div>
          ) : null}
          {t >= beatOf("s20").start ? (
            <div style={{ position: "absolute", left: 100, top: 560, opacity: c.on(beatOf("s20").start + 0.2) }}>
              <div style={{ ...card, padding: "18px 26px", display: "flex", alignItems: "center", gap: 24, border: `2px solid ${AT}` }}>
                <svg width={110} height={110} viewBox="-55 -55 110 110">
                  <circle r={48} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={8} />
                  <path d={arc(48, Math.max(0.001, 1 - ease((t - W("s20", "seven")) / 6) * 0.5))} fill="none" stroke={AT} strokeWidth={8} strokeLinecap="round" />
                  <line x1={0} y1={0} x2={Math.sin(t * 4) * 30} y2={-Math.cos(t * 4) * 30} stroke="white" strokeWidth={5} strokeLinecap="round" />
                </svg>
                <div>
                  <div style={big(48, AT)}>Astatine-211</div>
                  <div style={{ fontSize: 30, fontWeight: 800 }}>half-life ≈ 7.2 hours</div>
                  <div style={{ fontSize: 24, opacity: 0.75 * c.on(W("s20", "pull")) }}>pull it out of the target → use it fast</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---- cancer cells ---- */}
      {V("cells") > 0 ? <Cells c={c} k={V("cells")} /> : null}

      {/* ---- can you get some? ---- */}
      {V("access") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: V("access") }}>
          <In c={c} at={beatOf("s22").start + 0.2} style={{ position: "absolute", left: 140, top: 120, width: 640 }}>
            <div style={{ ...card, padding: "26px 30px", position: "relative" }}>
              <div style={{ fontSize: 24, opacity: 0.6, fontWeight: 700 }}>elementshop.example</div>
              <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 12 }}>
                <div style={{ width: 120, height: 120, borderRadius: 16, background: "#2a1240", border: `3px solid ${AT}`, display: "flex", alignItems: "center", justifyContent: "center", ...big(56, AT) }}>At</div>
                <div>
                  <div style={big(40)}>Astatine, 1 g</div>
                  <div style={{ fontSize: 28, opacity: 0.7 }}>🛒 Add to cart</div>
                </div>
              </div>
              {t >= W("s22", "buy") ? (
                <div style={{ position: "absolute", left: 120, top: 70, border: `6px solid ${RED}`, borderRadius: 12, padding: "4px 20px", ...big(54, RED), transform: `rotate(-10deg) scale(${1 + 1.2 * (1 - sp(W("s22", "buy"), 9))})`, background: "rgba(25,5,10,0.85)" }}>NOT FOR SALE</div>
              ) : null}
            </div>
          </In>
          <div style={{ position: "absolute", right: 140, top: 130, width: 820, display: "flex", flexDirection: "column", gap: 18 }}>
            <In c={c} at={W("s22", "billionths")}>
              <div style={{ ...card, padding: "16px 24px", fontSize: 32, fontWeight: 800 }}>⚖️ made in <span style={{ color: GOLD }}>billionths of a gram</span></div>
            </In>
            <In c={c} at={W("s22", "handful")}>
              <div style={{ ...card, padding: "16px 24px", fontSize: 32, fontWeight: 800 }}>🌍 at a <span style={{ color: GOLD }}>handful of research cyclotrons</span></div>
            </In>
            <In c={c} at={W("s22", "trials")}>
              <div style={{ ...card, padding: "16px 24px", fontSize: 32, fontWeight: 800 }}>🔬 for <span style={{ color: GOLD }}>scientists & clinical trials</span></div>
            </In>
            <In c={c} at={W("s23", "patient")}>
              <div style={{ ...card, padding: "16px 24px", fontSize: 32, fontWeight: 800, border: `2px solid ${CYAN}` }}>🏥 your most likely route: <span style={{ color: CYAN }}>a trial patient</span></div>
            </In>
            <In c={c} at={W("s23", "never")}>
              <div style={{ ...card, padding: "16px 24px", fontSize: 32, fontWeight: 800 }}>👁️ chance you'll see it: <span style={{ color: RED }}>zero</span></div>
            </In>
          </div>
        </div>
      ) : null}

      {/* ---- outro ---- */}
      {V("outro") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: V("outro") }}>
          <div style={{ position: "absolute", left: 100, top: 200, display: "flex", flexDirection: "column", gap: 20 }}>
            <In c={c} at={W("s24", "flash")}>
              <div style={big(60, GOLD)}>⚡ made in a flash</div>
            </In>
            <In c={c} at={W("s24", "hours")}>
              <div style={big(60, AT)}>⏳ gone in hours</div>
            </In>
            <In c={c} at={W("s24", "never")}>
              <div style={big(60, CYAN)}>👁️ never seen</div>
            </In>
          </div>
          <In c={c} at={W("s25", "subscribe")} style={{ position: "absolute", right: 120, top: 260 }}>
            <div style={{ background: "#ff2d3d", borderRadius: 16, padding: "18px 40px", ...big(56), transform: `scale(${1 + 0.04 * Math.sin(t * 5)})` }}>SUBSCRIBE</div>
          </In>
          <In c={c} at={W("s25", "comments")} style={{ position: "absolute", right: 120, top: 400 }}>
            <div style={{ ...card, padding: "16px 24px", fontSize: 34, fontWeight: 800 }}>which element next? 👇</div>
          </In>
        </div>
      ) : null}

      <Subtitles t={t} />
    </AbsoluteFill>
  );
};

/** SVG arc path (fraction k of a circle, clockwise from 12 o'clock). */
const arc = (r: number, k: number) => {
  const a = k * Math.PI * 2;
  const x = Math.sin(a) * r;
  const y = -Math.cos(a) * r;
  return `M0 ${-r} A${r} ${r} 0 ${k > 0.5 ? 1 : 0} 1 ${x} ${y}`;
};
