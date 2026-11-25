import { AbsoluteFill, interpolate, spring } from "remotion";
import { LINES, TL, W, beatAt, beatOf, ease, vis, type Scene } from "./timeline";
import { COLORS, cfgAt } from "./Scene3D";

const FONT = "Inter, Helvetica, Arial, sans-serif";
const GOLD = "#ffd34d";
const CYAN = "#7fd8ff";
const RED = "#ff5d6c";
const GREEN = "#5ee38a";
const VIO = "#c48bff";
const INK = "#0b0714";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const card: React.CSSProperties = { background: "rgba(14,10,26,0.84)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 20, color: "white", fontFamily: FONT, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" };
const big = (size: number, color = "white"): React.CSSProperties => ({ fontSize: size, fontWeight: 900, color, fontFamily: FONT, letterSpacing: -1 });
type Ctx = { t: number; sp: (a: number, d?: number) => number; on: (a: number, d?: number) => number };

const In: React.FC<{ c: Ctx; at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ c, at, children, style }) => {
  const k = c.on(at);
  if (k <= 0) return null;
  return <div style={{ opacity: k, transform: `translateY(${(1 - c.sp(at, 16)) * 24}px)`, ...style }}>{children}</div>;
};
const Stamp: React.FC<{ c: Ctx; at: number; text: string; color: string; style?: React.CSSProperties }> = ({ c, at, text, color, style }) =>
  c.t >= at ? (
    <div style={{ border: `6px solid ${color}`, borderRadius: 14, padding: "6px 26px", ...big(56, color), background: "rgba(10,5,12,0.75)", transform: `rotate(-6deg) scale(${1 + 1.3 * (1 - c.sp(at, 9))})`, opacity: c.on(at, 0.08), whiteSpace: "nowrap", ...style }}>{text}</div>
  ) : null;

/* ---------------- subtitles ---------------- */
type Wd = { text: string; s: number; e: number };
const CHUNKS: Wd[][] = [];
for (const b of TL.beats) {
  if (!b.id) continue;
  let cur: Wd[] = [];
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
      <div style={{ maxWidth: 1280, textAlign: "center" }}>
        {CHUNKS[i].map((w, k) => (
          <span key={k} style={{ display: "inline-block", margin: "0 9px", fontSize: 50, fontWeight: 900, fontFamily: FONT, color: t >= w.s ? (t < w.e + 0.05 ? GOLD : "white") : "rgba(255,255,255,0.5)", WebkitTextStroke: `8px ${INK}`, paintOrder: "stroke" }}>
            {w.text.replace(/[,.…]+$/, "")}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ---------------- window analogy ---------------- */
const WindowGag: React.FC<{ c: Ctx }> = ({ c }) => {
  const t = c.t;
  const ppT = W("e11", "million");
  const bbT = W("e11", "baseball");
  const shT = W("e11", "shatters");
  const balls = Array.from({ length: 40 }, (_, i) => i);
  const broken = t >= shT;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {/* window */}
      <g transform="translate(1180 200)">
        <rect x={0} y={0} width={520} height={600} rx={10} fill="#2a1d18" />
        <rect x={24} y={24} width={472} height={552} fill={broken ? "rgba(140,190,255,0.08)" : "rgba(140,190,255,0.28)"} stroke="#c9d8f0" strokeWidth={4} />
        {!broken ? <path d="M60 80 L160 60 M80 140 L190 110" stroke="rgba(255,255,255,0.5)" strokeWidth={8} strokeLinecap="round" /> : null}
        {broken
          ? Array.from({ length: 14 }, (_, i) => {
              const a = (i / 14) * Math.PI * 2;
              return <line key={i} x1={260} y1={300} x2={260 + Math.cos(a) * 320} y2={300 + Math.sin(a) * 320} stroke="#e8f1ff" strokeWidth={4} />;
            })
          : null}
        {broken
          ? Array.from({ length: 22 }, (_, i) => {
              const d = (t - shT) * (300 + (i % 5) * 80);
              const a = (i / 22) * Math.PI * 2;
              const x = 260 + Math.cos(a) * d;
              const y = 300 + Math.sin(a) * d * 0.6 + (t - shT) ** 2 * 500;
              return <polygon key={`s${i}`} points={`${x},${y} ${x + 22},${y + 8} ${x + 6},${y + 26}`} fill="rgba(200,225,255,0.8)" opacity={Math.max(0, 1 - (t - shT) / 1.4)} />;
            })
          : null}
      </g>
      {/* ping-pong barrage */}
      {t >= ppT && t < bbT + 0.5
        ? balls.map((i) => {
            const ph = ((t - ppT) * 2.2 + i / 40) % 1;
            const x = 220 + ph * 980;
            const y = 260 + ((i * 53) % 520);
            const back = ph > 0.92 ? (ph - 0.92) * 600 : 0;
            return <circle key={i} cx={x - back} cy={y} r={14} fill="#fff" stroke="#c9c9c9" strokeWidth={3} />;
          })
        : null}
      {/* baseball */}
      {t >= bbT && t < shT + 0.6 ? (
        <g transform={`translate(${200 + Math.min(1, (t - bbT) / Math.max(0.2, shT - bbT)) * 1240} ${520 - Math.sin(Math.min(1, (t - bbT) / Math.max(0.2, shT - bbT)) * Math.PI) * 120}) rotate(${t * 600})`}>
          <circle r={44} fill="#f4efe4" stroke="#bbb" strokeWidth={4} />
          <path d="M-30 -30 Q-8 0 -30 30 M30 -30 Q8 0 30 30" stroke="#d33" strokeWidth={5} fill="none" strokeDasharray="6 5" />
        </g>
      ) : null}
    </svg>
  );
};

/* ---------------- Millikan graph ---------------- */
const MillikanGraph: React.FC<{ c: Ctx }> = ({ c }) => {
  const t = c.t;
  const b = beatOf("e14");
  const x0 = 980, y0 = 860, w = 760, h = 520;
  const pts = Array.from({ length: 8 }, (_, i) => ({ fx: 0.22 + i * 0.1, at: b.start + 2.2 + i * 0.55, jit: ((i * 37) % 7 - 3) * 0.006 }));
  const line = ease((t - W("e14", "measurements")) / 0.8);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <line x1={x0} y1={y0} x2={x0 + w} y2={y0} stroke="white" strokeWidth={4} />
      <line x1={x0} y1={y0} x2={x0} y2={y0 - h} stroke="white" strokeWidth={4} />
      <text x={x0 + w / 2} y={y0 + 54} textAnchor="middle" fill="white" fontSize={28} fontWeight={800} fontFamily={FONT}>light frequency (color) →</text>
      <text x={x0 - 30} y={y0 - h / 2} textAnchor="middle" fill="white" fontSize={28} fontWeight={800} fontFamily={FONT} transform={`rotate(-90 ${x0 - 30} ${y0 - h / 2})`}>electron energy →</text>
      <line x1={x0 + 0.14 * w} y1={y0} x2={x0 + (0.14 + 0.82 * line) * w} y2={y0 - 0.82 * line * h * 0.95} stroke={GOLD} strokeWidth={6} />
      {line > 0 ? <text x={x0 + 0.14 * w + 12} y={y0 - 14} fill={GOLD} fontSize={24} fontWeight={800} fontFamily={FONT}>Einstein's prediction</text> : null}
      {pts.map((p, i) =>
        t >= p.at ? <circle key={i} cx={x0 + p.fx * w} cy={y0 - ((p.fx - 0.14) * 0.95 + p.jit) * h} r={12} fill={CYAN} opacity={c.on(p.at, 0.2)} /> : null,
      )}
    </svg>
  );
};

/* ---------------- tech icons ---------------- */
const TechIcon: React.FC<{ kind: "camera" | "sensor" | "solar" }> = ({ kind }) => (
  <svg viewBox="-100 -100 200 200" width={220} height={220}>
    {kind === "camera" ? (
      <g>
        <rect x={-80} y={-50} width={160} height={110} rx={18} fill="#2b3040" stroke="white" strokeWidth={6} />
        <rect x={-30} y={-70} width={60} height={26} rx={6} fill="#2b3040" stroke="white" strokeWidth={6} />
        <circle r={36} fill="#11151f" stroke={CYAN} strokeWidth={8} />
        <circle r={14} fill={CYAN} opacity={0.6} />
      </g>
    ) : kind === "sensor" ? (
      <g>
        <rect x={-50} y={-30} width={100} height={70} rx={10} fill="#2b3040" stroke="white" strokeWidth={6} />
        <circle cx={0} cy={4} r={18} fill={GOLD} />
        {[-60, -30, 0, 30, 60].map((a) => (
          <line key={a} x1={Math.sin((a * Math.PI) / 180) * 50} y1={-60} x2={Math.sin((a * Math.PI) / 180) * 80} y2={-90} stroke={GOLD} strokeWidth={6} strokeLinecap="round" />
        ))}
      </g>
    ) : (
      <g transform="skewX(-12)">
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={-90 + (i % 4) * 46} y={-50 + Math.floor(i / 4) * 40} width={42} height={36} fill="#1f4fa8" stroke="#bcd3ff" strokeWidth={3} />
        ))}
        <circle cx={70} cy={-80} r={18} fill={GOLD} />
      </g>
    )}
  </svg>
);

/* ---------------- all overlays ---------------- */
export const Overlays: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const sp = (a: number, d = 13) => spring({ frame: Math.round((t - a) * fps), fps, config: { damping: d } });
  const c: Ctx = { t, sp, on: (a, d = 0.35) => interpolate(t, [a, a + d], [0, 1], clamp) };
  const b = beatAt(t);
  const V = (s: Scene) => vis(s, t);
  const id = b.id;
  const cfg = cfgAt(t);
  const elCount = (from: number, rate: number) => Math.max(0, Math.floor((t - from) * rate));

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "white" }}>
      {/* ---- hook ---- */}
      {V("hook") > 0 ? (
        <AbsoluteFill style={{ opacity: V("hook"), alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 60, marginBottom: 80 }}>
            {[
              { txt: "RELATIVITY", at: W("e01", "relativity") },
              { txt: "E = mc²", at: W("e01", "equals") },
            ].map((x) => (
              <div key={x.txt} style={{ position: "relative" }}>
                <In c={c} at={x.at}>
                  <div style={{ ...card, width: 560, height: 260, display: "flex", alignItems: "center", justifyContent: "center", ...big(80, x.txt === "E = mc²" ? GOLD : CYAN) }}>{x.txt}</div>
                </In>
                <div style={{ position: "absolute", left: 0, right: 0, top: 196, display: "flex", justifyContent: "center" }}>
                  <Stamp c={c} at={W("e01", "either")} text="✗ NOT IT" color={RED} style={{ fontSize: 40 }} />
                </div>
              </div>
            ))}
          </div>
          <In c={c} at={W("e01", "Nobel")}>
            <div style={{ fontSize: 40, fontWeight: 800, opacity: 0.85 }}>🏅 so what did he actually win it for?</div>
          </In>
        </AbsoluteFill>
      ) : null}

      {/* ---- lab captions ---- */}
      {V("lab") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: V("lab") }}>
          {id === "e02" ? (
            <In c={c} at={W("e02", "light")} style={{ position: "absolute", left: 0, right: 0, top: 80, textAlign: "center" }}>
              <div style={big(84)}>what is light, <span style={{ color: GOLD }}>really?</span></div>
            </In>
          ) : null}
          {id === "e04" ? (
            <>
              <In c={c} at={W("e04", "Shine")} style={{ position: "absolute", left: 120, top: 220 }}>
                <div style={{ ...card, padding: "10px 20px", fontSize: 32, fontWeight: 900 }}>💡 light</div>
              </In>
              <In c={c} at={W("e04", "metal")} style={{ position: "absolute", right: 260, top: 180 }}>
                <div style={{ ...card, padding: "10px 20px", fontSize: 32, fontWeight: 900 }}>🔩 metal</div>
              </In>
              <In c={c} at={W("e04", "electrons")} style={{ position: "absolute", left: 760, top: 120 }}>
                <div style={{ ...card, padding: "10px 20px", fontSize: 32, fontWeight: 900, color: CYAN }}>⚡ electrons fly out</div>
              </In>
            </>
          ) : null}
          {id === "e05" ? (
            <In c={c} at={W("e05", "wave")} style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
              <div style={{ ...card, padding: "18px 30px", width: 1040 }}>
                <div style={{ fontSize: 24, letterSpacing: 6, color: GOLD, fontWeight: 900 }}>WAVE THEORY PREDICTION</div>
                <div style={{ fontSize: 38, fontWeight: 800, marginTop: 8, opacity: c.on(W("e05", "brighter")) }}>
                  brighter light → stronger wave → <span style={{ color: CYAN }}>faster electrons</span>
                </div>
              </div>
            </In>
          ) : null}
          {(id === "e06" || id === "e07" || id === "e08") && cfg && cfg.mode === "wave" ? (
            <div style={{ position: "absolute", left: 90, top: 80, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ ...card, padding: "12px 22px", fontSize: 36, fontWeight: 900, border: `3px solid ${COLORS[cfg.color as "red"]}` }}>
                {cfg.I > 0.6 ? "BRIGHT" : "DIM"} {cfg.color === "red" ? "RED" : cfg.color === "blue" ? "BLUE-VIOLET" : "VIOLET"} light
              </div>
              <div style={{ ...card, padding: "12px 22px", fontSize: 34, fontWeight: 900 }}>
                electrons: <span style={{ color: cfg.eRate > 0 ? CYAN : RED }}>{id === "e06" ? 0 : id === "e07" ? elCount(W("e07", "Electrons"), 3) : elCount(beatOf("e07").end, 7) + 14}</span>
              </div>
              {id === "e08" ? (
                <div style={{ ...card, padding: "12px 22px", fontSize: 30, fontWeight: 800 }}>
                  energy per electron: <span style={{ color: t >= W("e08", "color") ? GOLD : "white" }}>{t >= W("e08", "color") ? "HIGHER ⬆" : "the same"}</span>
                </div>
              ) : null}
            </div>
          ) : null}
          {id === "e06" ? (
            <div style={{ position: "absolute", right: 200, top: 120 }}>
              <Stamp c={c} at={W("e06", "Not")} text="0 ELECTRONS" color={RED} />
            </div>
          ) : null}
          {id === "e08" ? (
            <div style={{ position: "absolute", right: 160, top: 120 }}>
              <Stamp c={c} at={W("e08", "Waves")} text="WAVES CAN'T EXPLAIN THIS" color={RED} style={{ fontSize: 44 }} />
            </div>
          ) : null}
          {id === "e09" ? (
            <In c={c} at={W("e09", "photons")} style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center" }}>
              <div style={big(96, VIO)}>PHOTONS</div>
              <div style={{ fontSize: 34, fontWeight: 800, opacity: 0.9 }}>light comes in packets of energy</div>
            </In>
          ) : null}
          {id === "e10" ? (
            <div style={{ position: "absolute", left: 90, top: 90, display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { name: "red photon", col: COLORS.red, e: 0.38, at: W("e10", "Red") },
                { name: "violet photon", col: VIO, e: 0.95, at: W("e10", "Violet") },
              ].map((p) => (
                <In key={p.name} c={c} at={p.at}>
                  <div style={{ ...card, padding: "12px 20px", width: 560 }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: p.col }}>{p.name}</div>
                    <div style={{ height: 24, background: "rgba(255,255,255,0.08)", borderRadius: 8, marginTop: 8, overflow: "hidden" }}>
                      <div style={{ width: `${p.e * 100 * ease((t - p.at) / 0.7)}%`, height: "100%", background: p.col }} />
                    </div>
                  </div>
                </In>
              ))}
              <In c={c} at={W("e10", "energy")}>
                <div style={{ fontSize: 28, opacity: 0.8, fontWeight: 700 }}>energy = h × frequency</div>
              </In>
            </div>
          ) : null}
          {id === "e12" ? (
            <div style={{ position: "absolute", left: 90, top: 80 }}>
              <div style={{ ...card, padding: "16px 22px", width: 600 }}>
                <div style={{ fontSize: 26, letterSpacing: 5, color: GOLD, fontWeight: 900 }}>ONE PHOTON → ONE ELECTRON</div>
                <div style={{ position: "relative", height: 120, marginTop: 14 }}>
                  <div style={{ position: "absolute", left: 0, right: 0, top: 30, borderTop: `4px dashed ${GOLD}` }} />
                  <div style={{ position: "absolute", right: 0, top: 0, fontSize: 22, color: GOLD, fontWeight: 800 }}>exit fee</div>
                  <div style={{ position: "absolute", left: 40, bottom: 0, width: 90, height: 60, background: COLORS.red, borderRadius: 6 }} />
                  <div style={{ position: "absolute", left: 160, bottom: 0, width: 90, height: 112, background: VIO, borderRadius: 6 }} />
                </div>
                <div style={{ display: "flex", gap: 40, marginTop: 8, fontSize: 24, fontWeight: 800 }}>
                  <span style={{ color: COLORS.red, opacity: c.on(W("e12", "not")) }}>red: bounces ✗</span>
                  <span style={{ color: CYAN, opacity: c.on(W("e12", "escapes")) }}>violet: escapes ✓</span>
                </div>
              </div>
            </div>
          ) : null}
          {id === "e17" ? (
            <In c={c} at={W("e17", "quantum")} style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center" }}>
              <div style={big(100, CYAN)}>QUANTUM PHYSICS</div>
              <div style={{ fontSize: 34, fontWeight: 800 }}>light is a wave <span style={{ color: GOLD }}>and</span> a particle</div>
            </In>
          ) : null}
          {id === "e19" ? (
            <div style={{ position: "absolute", left: 90, top: 120, display: "flex", flexDirection: "column", gap: 18 }}>
              <In c={c} at={W("e19", "space")}>
                <div style={{ fontSize: 40, fontWeight: 800, opacity: 0.7 }}>famous for: space & time</div>
              </In>
              <In c={c} at={W("e19", "Nobel")}>
                <div style={big(64, GOLD)}>Nobel Prize: what light is made of</div>
              </In>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---- title ---- */}
      {V("title") > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: V("title"), background: "radial-gradient(ellipse at center, rgba(5,3,15,0.2), rgba(5,3,15,0.85))" }}>
          <div style={{ fontSize: 32, letterSpacing: 14, color: GOLD, fontWeight: 800 }}>NOBEL PRIZE IN PHYSICS · 1921</div>
          <div style={{ ...big(150), letterSpacing: 4, transform: `scale(${0.85 + 0.15 * sp(b.start + 0.2, 11)})`, textShadow: `0 0 50px ${VIO}` }}>EINSTEIN'S NOBEL</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: "#e5d4ff" }}>the discovery that made light a particle</div>
        </AbsoluteFill>
      ) : null}

      {/* ---- 1905 ---- */}
      {V("y1905") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: V("y1905") }}>
          <In c={c} at={beatOf("e03").voiceAt} style={{ position: "absolute", left: 120, top: 110 }}>
            <div style={big(170, GOLD)}>1905</div>
            <div style={{ fontSize: 38, fontWeight: 800 }}>Albert Einstein, age 26</div>
            <div style={{ fontSize: 30, opacity: 0.8 }}>patent clerk · Bern, Switzerland</div>
          </In>
          <div style={{ position: "absolute", right: 120, top: 120, display: "flex", flexDirection: "column", gap: 16, width: 760 }}>
            {[
              { t: "Light quanta: the photoelectric effect", hl: true },
              { t: "Brownian motion: atoms are real" },
              { t: "Special relativity" },
              { t: "E = mc²" },
            ].map((p, i) => {
              const hl = p.hl && t >= W("e03", "photoelectric");
              return (
                <In key={p.t} c={c} at={W("e03", "four") + i * 0.35}>
                  <div style={{ ...card, padding: "18px 24px", fontSize: 32, fontWeight: 800, border: hl ? `3px solid ${GOLD}` : card.border, transform: `scale(${hl ? 1.06 : 1})`, boxShadow: hl ? `0 0 40px rgba(255,211,77,0.4)` : card.boxShadow, opacity: t >= W("e03", "photoelectric") && !p.hl ? 0.45 : 1 }}>
                    📄 {p.t}
                  </div>
                </In>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ---- window analogy ---- */}
      {V("window") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: V("window") }}>
          <WindowGag c={c} />
          <In c={c} at={W("e11", "million")} style={{ position: "absolute", left: 100, top: 80 }}>
            <div style={{ ...card, padding: "12px 22px", fontSize: 34, fontWeight: 900 }}>
              🏓 × 1,000,000 = <span style={{ color: COLORS.red }}>red photons</span>
            </div>
          </In>
          <In c={c} at={W("e11", "baseball")} style={{ position: "absolute", left: 100, top: 170 }}>
            <div style={{ ...card, padding: "12px 22px", fontSize: 34, fontWeight: 900 }}>
              ⚾ × 1 = <span style={{ color: VIO }}>one violet photon</span>
            </div>
          </In>
        </div>
      ) : null}

      {/* ---- equation ---- */}
      {V("equation") > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: V("equation"), paddingBottom: 140 }}>
          <div style={{ display: "flex", gap: 70, alignItems: "flex-start" }}>
            {[
              { s: "K", col: CYAN, lab: "electron's energy", at: W("e13", "electron's") },
              { s: "=", col: "white", lab: "", at: W("e13", "equals") },
              { s: "hf", col: VIO, lab: "photon's energy", at: W("e13", "photon's") },
              { s: "−", col: "white", lab: "", at: W("e13", "minus") },
              { s: "φ", col: GOLD, lab: "exit fee (work function)", at: W("e13", "cost") },
            ].map((e, i) => (
              <div key={i} style={{ textAlign: "center", opacity: c.on(e.at), transform: `scale(${0.7 + 0.3 * sp(e.at, 11)})` }}>
                <div style={{ ...big(170, e.col), fontFamily: "Georgia, serif", fontStyle: "italic" }}>{e.s}</div>
                <div style={{ fontSize: 30, fontWeight: 800, maxWidth: 260, color: e.col }}>{e.lab}</div>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      ) : null}

      {/* ---- Millikan ---- */}
      {V("millikan") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: V("millikan") }}>
          <In c={c} at={W("e14", "Millikan")} style={{ position: "absolute", left: 120, top: 160, width: 700 }}>
            <div style={{ ...card, padding: "24px 30px" }}>
              <div style={big(56)}>Robert Millikan</div>
              <div style={{ fontSize: 30, opacity: 0.8, marginTop: 6 }}>American physicist</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 16 }}>🔬 ~10 years of experiments</div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8, opacity: c.on(W("e14", "expecting")) }}>expected Einstein to be wrong</div>
            </div>
          </In>
          <MillikanGraph c={c} />
          <div style={{ position: "absolute", left: 1150, top: 150 }}>
            <Stamp c={c} at={W("e14", "matched")} text="CONFIRMED ✓" color={GREEN} />
          </div>
        </div>
      ) : null}

      {/* ---- Nobel ---- */}
      {V("nobel") > 0 ? (
        <AbsoluteFill style={{ opacity: V("nobel"), alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 70 }}>
            <div style={{ width: 360, height: 360, borderRadius: 180, background: "radial-gradient(circle at 35% 30%, #fff1b0, #e0a72e 55%, #9a6a12)", border: "10px solid #f5d27a", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", transform: `scale(${0.6 + 0.4 * sp(beatOf("e15").start + 0.2, 10)}) rotate(${(1 - sp(beatOf("e15").start + 0.2, 12)) * -30}deg)`, boxShadow: "0 0 80px rgba(255,200,80,0.5)" }}>
              <div style={{ ...big(44, "#5a3a00") }}>NOBEL<br />PRIZE<br /><span style={{ fontSize: 34 }}>PHYSICS 1921</span></div>
            </div>
            <div style={{ width: 860 }}>
              <In c={c} at={W("e15", "received")}>
                <div style={{ fontSize: 30, opacity: 0.8, fontWeight: 800 }}>awarded in 1922 to Albert Einstein</div>
              </In>
              <In c={c} at={W("e15", "especially")}>
                <div style={{ ...card, padding: "22px 28px", marginTop: 14, fontSize: 36, fontStyle: "italic", lineHeight: 1.3 }}>
                  “…especially for his discovery of the <span style={{ color: GOLD, fontWeight: 900 }}>law of the photoelectric effect</span>.”
                </div>
              </In>
              <In c={c} at={W("e15", "Relativity")}>
                <div style={{ fontSize: 30, marginTop: 18, fontWeight: 800 }}>
                  relativity? <span style={{ color: RED }}>still too controversial</span>
                </div>
              </In>
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* ---- fun facts ---- */}
      {V("fun") > 0 ? (
        <AbsoluteFill style={{ opacity: V("fun"), alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 50 }}>
            <In c={c} at={W("e16", "money")}>
              <div style={{ ...card, width: 700, padding: "30px 34px" }}>
                <div style={{ fontSize: 80 }}>💰</div>
                <div style={{ fontSize: 40, fontWeight: 900, marginTop: 10 }}>The prize money</div>
                <div style={{ fontSize: 32, marginTop: 10, opacity: 0.9 }}>
                  went to his ex-wife, <span style={{ color: GOLD }}>Mileva Marić</span>, as agreed in their divorce
                </div>
              </div>
            </In>
            <In c={c} at={W("e16", "lecture")}>
              <div style={{ ...card, width: 700, padding: "30px 34px" }}>
                <div style={{ fontSize: 80 }}>🎤</div>
                <div style={{ fontSize: 40, fontWeight: 900, marginTop: 10 }}>His Nobel lecture topic</div>
                <div style={{ fontSize: 32, marginTop: 10, opacity: 0.9 }}>
                  …<span style={{ color: CYAN, fontWeight: 900, opacity: c.on(W("e16", "relativity")) }}>relativity</span> 🙃
                </div>
              </div>
            </In>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* ---- everyday tech ---- */}
      {V("tech") > 0 ? (
        <AbsoluteFill style={{ opacity: V("tech"), alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 60, marginBottom: 80 }}>
            {[
              { k: "camera" as const, name: "camera sensors", at: W("e18", "Camera") },
              { k: "sensor" as const, name: "light sensors", at: W("e18", "light") },
              { k: "solar" as const, name: "solar panels", at: W("e18", "solar") },
            ].map((x) => (
              <In key={x.k} c={c} at={x.at}>
                <div style={{ ...card, width: 400, padding: "26px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <TechIcon kind={x.k} />
                  <div style={{ fontSize: 36, fontWeight: 900, marginTop: 8 }}>{x.name}</div>
                </div>
              </In>
            ))}
          </div>
          <In c={c} at={W("e18", "photon")}>
            <div style={{ fontSize: 38, fontWeight: 800 }}>
              <span style={{ color: VIO }}>photon</span> in → <span style={{ color: CYAN }}>electron</span> out
            </div>
          </In>
        </AbsoluteFill>
      ) : null}

      {/* ---- outro ---- */}
      {V("outro") > 0 ? (
        <AbsoluteFill style={{ opacity: V("outro"), alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...big(90), textShadow: `0 0 40px ${VIO}` }}>light is made of photons</div>
          <div style={{ display: "flex", gap: 30, marginTop: 40, alignItems: "center" }}>
            <In c={c} at={W("e20", "subscribe")}>
              <div style={{ background: "#ff2d3d", borderRadius: 16, padding: "18px 40px", ...big(52), transform: `scale(${1 + 0.04 * Math.sin(t * 5)})` }}>SUBSCRIBE</div>
            </In>
            <In c={c} at={W("e20", "comments")}>
              <div style={{ ...card, padding: "16px 26px", fontSize: 34, fontWeight: 800 }}>which discovery next? 👇</div>
            </In>
          </div>
        </AbsoluteFill>
      ) : null}

      <Subtitles t={t} />
    </AbsoluteFill>
  );
};
