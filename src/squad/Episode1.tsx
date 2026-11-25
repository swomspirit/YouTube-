import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { Chibi, INK, Longshot, type Face, type Pose } from "./Chibi";
import { B, FPS, LINES, MUSIC, TL, W, beatAt, talker, type Shot } from "./timeline";

export { DURATION as SQUAD_EP1_DURATION, FPS as SQUAD_FPS } from "./timeline";

const FONT = "Inter, 'Arial Black', Arial, sans-serif";
const GROUND = 1560;
const S = 0.78; // character scale in the world
const HEAD = 440 * S;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/* ---------------- background: an original desert town, softly blurred ---------------- */
const Town: React.FC = () => (
  <svg viewBox="-200 0 1480 1920" width={1480} height={1920} style={{ position: "absolute", left: -200, top: 0 }}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6d9a2" />
        <stop offset="1" stopColor="#eab37a" />
      </linearGradient>
    </defs>
    <rect x={-200} y={0} width={1480} height={1920} fill="url(#sky)" />
    {/* far rooftops */}
    <path d="M-200 700 L-60 700 L-60 560 L120 560 L120 640 L300 640 L300 520 L520 520 L520 610 L760 610 L760 500 L980 500 L980 620 L1280 620 L1280 900 L-200 900Z" fill="#d6a06c" />
    {/* main wall */}
    <rect x={-200} y={760} width={1480} height={740} fill="#c98d5c" />
    {[-120, 140, 900, 1120].map((x) => (
      <rect key={x} x={x} y={880} width={120} height={170} rx={8} fill="#7a4f37" />
    ))}
    {/* arch */}
    <path d="M380 1500 L380 1020 Q540 860 700 1020 L700 1500Z" fill="#5c3a2a" />
    <path d="M350 1500 L350 1010 Q540 820 730 1010 L730 1500" fill="none" stroke="#e2b07e" strokeWidth={30} />
    {/* awning */}
    <path d="M820 1040 L1180 1040 L1220 1110 L780 1110Z" fill="#2fa58a" />
    {/* crates */}
    <rect x={-120} y={1290} width={220} height={210} fill="#a8703f" stroke="#7a4f2c" strokeWidth={14} />
    <rect x={60} y={1360} width={150} height={140} fill="#b77d47" stroke="#7a4f2c" strokeWidth={12} />
    <rect x={930} y={1320} width={240} height={180} fill="#a8703f" stroke="#7a4f2c" strokeWidth={14} />
    {/* ground */}
    <rect x={-200} y={1500} width={1480} height={420} fill="#d9a46c" />
    <rect x={-200} y={1500} width={1480} height={16} fill="#b98654" />
  </svg>
);

/* ---------------- camera ---------------- */
type Frame = { fx: number; fy: number; sx: number; sy: number; z: number };
const voltX = (t: number) => (t >= B("thanks").start - 0.01 ? 470 : 250);
const MENDER_X = 600;
const framing = (shot: Shot, t: number): Frame => {
  switch (shot) {
    case "volt":
      return { fx: voltX(t), fy: GROUND - HEAD, sx: 540, sy: 800, z: 1.75 };
    case "mender":
      return { fx: MENDER_X, fy: GROUND - HEAD, sx: 540, sy: 800, z: 1.75 };
    case "floor":
      return { fx: 470 - HEAD, fy: GROUND - 14, sx: 540, sy: 900, z: 1.6 };
    default:
      return { fx: 470, fy: 1180, sx: 540, sy: 960, z: 1 };
  }
};
const camera = (t: number) => {
  const i = TL.beats.findIndex((b) => b === beatAt(t));
  const b = TL.beats[i];
  const cur = framing(b.shot, t);
  const prev = i > 0 ? framing(TL.beats[i - 1].shot, b.start - 0.01) : cur;
  const k = ease((t - b.start) / 0.22);
  const push = 1 + 0.018 * (t - b.start);
  const f: Frame = { fx: lerp(prev.fx, cur.fx, k), fy: lerp(prev.fy, cur.fy, k), sx: lerp(prev.sx, cur.sx, k), sy: lerp(prev.sy, cur.sy, k), z: lerp(prev.z, cur.z, k) * push };
  // shake on gunshots
  let shake = 0;
  for (const kb of ["kill1", "kill2"]) {
    const d = t - B(kb).start - 0.05;
    if (d > 0 && d < 0.4) shake = Math.max(shake, (1 - d / 0.4) * 22);
  }
  return { ...f, ox: Math.sin(t * 90) * shake, oy: Math.cos(t * 77) * shake };
};

/* ---------------- character state over time ---------------- */
const fall = (t: number, at: number, dir: 1 | -1) => {
  const d = t - at;
  if (d < 0) return 0;
  const k = Math.min(1, d / 0.32);
  const bounce = d > 0.32 && d < 0.6 ? Math.sin(((d - 0.32) / 0.28) * Math.PI) * 6 : 0;
  return dir * (88 * k * k - bounce);
};
const voltState = (t: number): { face: Face; pose: Pose; hop: number; holding: "rifle" | null; rot: number; look: number } => {
  const k = beatAt(t).key;
  const kill2 = B("kill2").start + 0.05;
  if (t >= kill2) return { face: "dead", pose: t >= B("worth").start ? "thumbsUp" : "idle", hop: 0, holding: null, rot: fall(t, kill2, -1), look: 0 };
  if (k === "ask") return t < W("ask", "Please") ? { face: "sparkle", pose: "wave", hop: 0, holding: null, rot: 0, look: 0 } : { face: "plead", pose: "plead", hop: 0, holding: null, rot: 0, look: 0 };
  if (k === "me") {
    const angry = t >= W("me", "literally");
    return { face: "angry", pose: angry ? "angry" : "pointSelf", hop: t < B("me").voiceAt + 0.4 ? Math.sin(((t - B("me").voiceAt) / 0.4) * Math.PI) * 60 : 0, holding: null, rot: 0, look: 0 };
  }
  if (k === "anyone" || k === "here") return { face: "deadpan", pose: k === "here" ? "pointSelf" : "idle", hop: 0, holding: null, rot: 0, look: 0.6 };
  if (k === "kill1") return { face: t > B("kill1").start + 0.15 ? "shock" : "normal", pose: "idle", hop: 0, holding: null, rot: 0, look: 0.8 };
  if (k === "thanks") return { face: "deadpan", pose: "sniper", hop: 0, holding: t >= B("thanks").start + 0.4 ? "rifle" : null, rot: 0, look: 0 };
  return { face: "normal", pose: "idle", hop: 0, holding: null, rot: 0, look: 0.5 };
};
const menderState = (t: number): { face: Face; pose: Pose; holding: "cash" | "rifle" | null; rot: number; look: number } => {
  const k = beatAt(t).key;
  const kill1 = B("kill1").start + 0.05;
  if (t >= kill1) return { face: "dead", pose: "idle", holding: null, rot: fall(t, kill1, 1), look: 0 };
  const rifle = t >= B("shiny").voiceAt - 0.45;
  if (rifle) return { face: k === "shiny" ? "sparkle" : "smug", pose: "sniper", holding: "rifle", rot: 0, look: 0 };
  if (k === "anyone") return { face: "normal", pose: "cash", holding: "cash", rot: 0, look: Math.sin((t - B("anyone").start) * 3.5) };
  if (k === "rich" || k === "me" || k === "here") return { face: k === "rich" ? "happy" : "smug", pose: "cash", holding: "cash", rot: 0, look: k === "here" ? -0.6 : 0 };
  return { face: "smug", pose: "idle", holding: null, rot: 0, look: -0.4 };
};
const talkOf = (who: string, t: number) => (talker(t) === who ? 0.45 + 0.55 * Math.abs(Math.sin(t * 15)) : 0);

/* ---------------- UI pieces ---------------- */
const Pill: React.FC<{ children: React.ReactNode; color: string; style?: React.CSSProperties }> = ({ children, color, style }) => (
  <div style={{ background: "rgba(20,14,24,0.82)", border: `4px solid ${color}`, borderRadius: 22, padding: "10px 26px", color: "white", fontFamily: FONT, fontWeight: 900, ...style }}>{children}</div>
);
const BuyCard: React.FC<{ name: string; price: string; color: string; k: number; children: React.ReactNode }> = ({ name, price, color, k, children }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", opacity: Math.min(1, k * 3), transform: `scale(${0.6 + 0.4 * k})` }}>
    <div style={{ width: 380, height: 300, background: color, border: `6px solid rgba(255,255,255,0.85)`, borderRadius: 14, position: "relative", boxShadow: "0 12px 30px rgba(0,0,0,0.35)" }}>
      <svg viewBox="-200 -120 400 200" width={380} height={190} style={{ position: "absolute", top: 10, left: 0 }}>
        {children}
      </svg>
      <div style={{ position: "absolute", left: 24, bottom: 54, fontSize: 34, fontWeight: 900, color: "white", fontFamily: FONT }}>{price}</div>
      <div style={{ position: "absolute", left: 24, bottom: 14, fontSize: 36, fontWeight: 900, color: "white", fontFamily: FONT, letterSpacing: 1 }}>{name}</div>
    </div>
  </div>
);
const Peashooter = () => (
  <g transform="translate(0 -10)">
    <path d="M-110 -30 H70 L90 -10 V10 H-20 L-40 70 H-90 L-70 10 H-110Z" fill="#e8f1ff" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <circle cx={60} cy={-10} r={10} fill="#5fd36a" stroke={INK} strokeWidth={5} />
  </g>
);

/* ---------------- captions ---------------- */
type Wd = { text: string; s: number; e: number };
const CHUNKS: Wd[][] = [];
for (const b of TL.beats) {
  if (!b.id || LINES[b.id].speaker === "ann") continue;
  let cur: Wd[] = [];
  for (const c of LINES[b.id].captions) {
    const w = { text: c.text.trim(), s: b.voiceAt + c.startMs / 1000, e: b.voiceAt + c.endMs / 1000 };
    if (!w.text) continue;
    cur.push(w);
    if (cur.length >= 3 || /[.!?]$/.test(w.text)) {
      CHUNKS.push(cur);
      cur = [];
    }
  }
  if (cur.length) CHUNKS.push(cur);
}
const Captions: React.FC<{ t: number }> = ({ t }) => {
  const i = CHUNKS.findIndex((c, k) => t >= c[0].s - 0.05 && t < Math.min(c[c.length - 1].e + 0.3, CHUNKS[k + 1]?.[0].s ?? Infinity));
  if (i < 0) return null;
  const c = CHUNKS[i];
  const pop = interpolate(t - c[0].s, [0, 0.08, 0.16], [0.85, 1.08, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1220, textAlign: "center", transform: `scale(${pop})` }}>
      {c.map((w, k) => (
        <span key={k} style={{ display: "inline-block", margin: "0 12px", fontSize: 96, fontWeight: 900, fontFamily: FONT, color: t >= w.s ? "#f3f53a" : "rgba(243,245,58,0.5)", WebkitTextStroke: `16px ${INK}`, paintOrder: "stroke", letterSpacing: -1, lineHeight: 1.1 }}>
          {w.text}
        </span>
      ))}
    </div>
  );
};

/* ---------------- episode ---------------- */
export const SquadEp1: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const sp = (at: number, damping = 12) => spring({ frame: Math.round((t - at) * FPS), fps: FPS, config: { damping } });
  const cam = camera(t);
  const world = `translate(${cam.sx + cam.ox} ${cam.sy + cam.oy}) scale(${cam.z}) translate(${-cam.fx} ${-cam.fy})`;
  const v = voltState(t);
  const m = menderState(t);
  const vx = voltX(t);
  const kill1 = B("kill1").start + 0.05;
  const kill2 = B("kill2").start + 0.05;
  const thanks = B("thanks").start;
  const rifleOnFloor = (t >= kill1 + 0.3 && t < thanks + 0.4) || t >= kill2 + 0.3;
  const rifleFloorX = t >= kill2 ? 330 : 470;
  const shot = beatAt(t).shot;
  const peaAt = W("ask", "Peashooter");
  const longAt = B("shiny").voiceAt - 0.45;
  const fourAt = W("ask", "four");
  const defeat = B("defeat");
  const flash = Math.max(0, ...[kill1, kill2].map((k) => (t >= k && t < k + 0.18 ? 1 - (t - k) / 0.18 : 0)));
  const musicEnd = Math.round(kill1 * FPS);

  return (
    <AbsoluteFill style={{ background: "#eab37a", overflow: "hidden" }}>
      {/* blurred background with light parallax */}
      <div style={{ position: "absolute", inset: 0, filter: "blur(12px) saturate(1.05) brightness(0.95)", transform: `translateX(${-(cam.fx - 470) * 0.12}px) scale(${1.06 + (cam.z - 1) * 0.12})` }}>
        <Town />
      </div>
      {/* characters */}
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={world}>
          <ellipse cx={vx} cy={GROUND + 6} rx={130 * S} ry={22} fill="rgba(60,30,10,0.25)" />
          <ellipse cx={MENDER_X} cy={GROUND + 6} rx={130 * S} ry={22} fill="rgba(60,30,10,0.25)" />
          {rifleOnFloor ? <Longshot x={rifleFloorX} y={GROUND - 14} rot={0} s={0.7} /> : null}
          <g transform={`translate(${MENDER_X} ${GROUND}) rotate(${m.rot}) scale(${S})`}>
            <Chibi who="mender" t={t} face={m.face} pose={m.pose} talk={talkOf("mender", t)} look={m.look} holding={m.holding} />
          </g>
          <g transform={`translate(${vx} ${GROUND}) rotate(${v.rot}) scale(${S})`}>
            <Chibi who="volt" t={t} face={v.face} pose={v.pose} talk={talkOf("volt", t)} look={v.look} hop={v.hop} holding={v.holding} />
          </g>
        </g>
      </svg>
      {/* gunshot flash */}
      {flash > 0 ? <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(255,255,255,${0.5 * flash}), rgba(255,40,40,${0.35 * flash}))` }} /> : null}

      {/* round banners */}
      {t < B("ask").start ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center", transform: `scale(${sp(0.15)})` }}>
          <Pill color="#5fd3ff" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 30, letterSpacing: 8, opacity: 0.8 }}>ROUND 7</div>
            <div style={{ fontSize: 72, letterSpacing: 4 }}>BUY PHASE</div>
          </Pill>
        </div>
      ) : null}
      {beatAt(t).key === "start" ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 220, display: "flex", justifyContent: "center", transform: `scale(${sp(B("start").start)})` }}>
          <Pill color="#ff5d6c" style={{ fontSize: 76, letterSpacing: 4 }}>ROUND START</Pill>
        </div>
      ) : null}

      {/* buy cards */}
      {t >= peaAt && t < peaAt + 2.4 ? (
        <BuyCard name="PEASHOOTER" price="◈ 500" color="#7f93b8" k={sp(peaAt)}>
          <Peashooter />
        </BuyCard>
      ) : null}
      {t >= longAt && t < longAt + 2.6 ? (
        <BuyCard name="LONGSHOT" price="◈ 5,000" color="#3fbf98" k={sp(longAt)}>
          <Longshot x={-40} y={10} s={0.62} />
        </BuyCard>
      ) : null}

      {/* credits */}
      {shot === "volt" && t >= fourAt && t < B("rich").start ? (
        <div style={{ position: "absolute", left: 50, top: 90, transform: `scale(${sp(fourAt)})`, transformOrigin: "left top" }}>
          <Pill color="#ff5d6c" style={{ fontSize: 60 }}>
            ◈ <span style={{ color: "#ff8a95" }}>4</span>
          </Pill>
        </div>
      ) : null}
      {shot === "mender" && t < kill1 ? (
        <div style={{ position: "absolute", left: 50, top: 90 }}>
          <Pill color="#5fe39a" style={{ fontSize: 60 }}>
            ◈ <span style={{ color: "#8ff0b8" }}>{t >= longAt ? "4,350" : "9,350"}</span>
          </Pill>
        </div>
      ) : null}
      {beatAt(t).key === "anyone" && t > B("anyone").voiceAt + 1.2 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", fontSize: 58, fontStyle: "italic", fontWeight: 800, color: "white", fontFamily: FONT, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke", opacity: interpolate(t, [B("anyone").voiceAt + 1.2, B("anyone").voiceAt + 1.4], [0, 1], clamp) }}>*crickets*</div>
      ) : null}

      {/* kill feed */}
      <div style={{ position: "absolute", right: 36, top: 90, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
        {[
          { at: kill1, name: "MENDER" },
          { at: kill2, name: "VOLT" },
        ].map((k) =>
          t >= k.at && t < defeat.start + 0.2 ? (
            <div key={k.name} style={{ background: "rgba(150,20,30,0.85)", borderRadius: 10, padding: "8px 18px", fontSize: 40, fontWeight: 900, color: "white", fontFamily: FONT, transform: `translateX(${(1 - sp(k.at, 14)) * 300}px)` }}>
              🎯 ➜ ☠ {k.name}
            </div>
          ) : null,
        )}
      </div>

      {t < defeat.start ? <Captions t={t} /> : null}

      {/* defeat */}
      {t >= defeat.start ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: `rgba(30,6,10,${0.55 * ease((t - defeat.start) / 0.4)})` }}>
          <div style={{ width: "100%", background: "rgba(210,30,50,0.92)", padding: "26px 0", textAlign: "center", transform: `scaleY(${sp(defeat.start, 14)})` }}>
            <div style={{ fontSize: 150, fontWeight: 900, color: "white", fontFamily: FONT, letterSpacing: 14 }}>DEFEAT</div>
          </div>
          <div style={{ marginTop: 40, fontSize: 54, fontWeight: 900, whiteSpace: "nowrap", color: "#f3f53a", fontFamily: FONT, textAlign: "center", WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke", padding: "0 60px", opacity: interpolate(t, [defeat.start + 0.6, defeat.start + 0.9], [0, 1], clamp) }}>
            never ask the healer for a buy 💀
          </div>
          <div style={{ marginTop: 26, fontSize: 34, letterSpacing: 10, fontWeight: 800, color: "white", fontFamily: FONT, opacity: interpolate(t, [defeat.start + 1.1, defeat.start + 1.4], [0, 0.85], clamp) }}>SQUAD · EP 1</div>
        </AbsoluteFill>
      ) : null}

      {/* audio */}
      <Sequence from={0} durationInFrames={musicEnd} layout="none">
        <Audio src={staticFile(MUSIC.loop.file)} volume={(f) => interpolate(f, [0, 10], [0, 0.22], clamp) * (talker(f / FPS) ? 0.7 : 1)} />
      </Sequence>
      {TL.cues.map((c, i) => (
        <Sequence key={i} from={Math.round(c.t * FPS)} layout="none">
          <Audio src={staticFile(c.file)} volume={c.vol ?? 1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
