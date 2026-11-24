import { cardLabel, isRed } from "../poker/cards";
import { BOARD, HERO, IVEY, TL, beatAt, findBeat, stateAt, type Who } from "./timeline";

/*
 * 2D TV-style poker table, flat cartoon with cel shading.
 * Two original characters: "You" (left, button) and a calm pro labelled "Phil Ivey" (right).
 * The Ivey character is a generic design with a nameplate, not a likeness of the real person.
 */
const INK = "#1a1520";
const o = { stroke: INK, strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const SEAT = { hero: { x: 560 }, ivey: { x: 1360 } };
const TABLE_Y = 640; // top edge of the felt (in front of the players)
const BET = { hero: { x: 735, y: 700 }, ivey: { x: 1185, y: 700 } };
const STACK = { hero: { x: 400, y: 735 }, ivey: { x: 1520, y: 735 } };
const POT = { x: 960, y: 668 };

/* ---------------- cards ---------------- */
const Card2D: React.FC<{ c: string; x: number; y: number; w?: number; faceUp: number; rot?: number; glow?: string }> = ({ c, x, y, w = 96, faceUp, rot = 0, glow }) => {
  const h = w * 1.4;
  const sx = Math.abs(Math.cos(Math.PI * (1 - faceUp)));
  const showFace = faceUp > 0.5;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${sx},1)`}>
      {glow ? <rect x={-w / 2 - 8} y={-h / 2 - 8} width={w + 16} height={h + 16} rx={14} fill={glow} opacity={0.45} /> : null}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.1} fill={showFace ? "#fbfaf6" : "#b3122e"} stroke="#2a2030" strokeWidth={4} />
      {showFace ? (
        <g fill={isRed(c) ? "#d0172f" : "#15131b"} fontWeight={900} textAnchor="middle">
          <text y={-h * 0.04} fontSize={w * 0.62} fontFamily='"Arial Black", Arial'>
            {cardLabel(c).slice(0, -1)}
          </text>
          <text y={h * 0.36} fontSize={w * 0.52} fontFamily="Arial">
            {cardLabel(c).slice(-1)}
          </text>
        </g>
      ) : (
        <g>
          <rect x={-w / 2 + 8} y={-h / 2 + 8} width={w - 16} height={h - 16} rx={6} fill="none" stroke="#f4f1ea" strokeWidth={3} />
          <path d={`M${-w / 2 + 14} 0 L0 ${-h / 2 + 14} L${w / 2 - 14} 0 L0 ${h / 2 - 14}Z`} fill="none" stroke="#f4f1ea" strokeWidth={3} opacity={0.6} />
        </g>
      )}
    </g>
  );
};

/* ---------------- chips ---------------- */
const Chips: React.FC<{ amountK: number; x: number; y: number }> = ({ amountK, x, y }) => {
  if (amountK <= 0) return null;
  const denoms = [
    { v: 100, c: "#1a1a22", e: "#f2c95b" },
    { v: 25, c: "#1f8a4c", e: "#e9f5ec" },
    { v: 5, c: "#c8202f", e: "#fbe9eb" },
    { v: 1, c: "#eeeae0", e: "#3a6fd8" },
  ];
  const cols: { c: string; e: string; n: number }[] = [];
  let left = amountK;
  for (const d of denoms) {
    let n = Math.floor(left / d.v);
    left -= n * d.v;
    while (n > 0) {
      const k = Math.min(8, n);
      cols.push({ c: d.c, e: d.e, n: k });
      n -= k;
    }
  }
  const shown = cols.slice(0, 7);
  return (
    <g transform={`translate(${x},${y})`}>
      {shown.map((col, i) => {
        const cx = (i - (shown.length - 1) / 2) * 34;
        return (
          <g key={i}>
            {Array.from({ length: col.n }, (_, j) => (
              <g key={j} transform={`translate(${cx}, ${-j * 7})`}>
                <ellipse cx={0} cy={4} rx={17} ry={7} fill={col.c} stroke={INK} strokeWidth={2.5} />
                <ellipse cx={0} cy={0} rx={17} ry={7} fill={col.c} stroke={INK} strokeWidth={2.5} />
                <ellipse cx={0} cy={0} rx={10} ry={4} fill="none" stroke={col.e} strokeWidth={2.5} strokeDasharray="4 3" />
              </g>
            ))}
          </g>
        );
      })}
    </g>
  );
};

/* ---------------- characters ---------------- */
type Face = "focus" | "happy" | "smug" | "confident" | "shocked" | "panic" | "nervous" | "deadpan" | "poker" | "cold" | "smirk";

const Eyes: React.FC<{ face: Face; look: number; blink: boolean; lid?: number }> = ({ face, look, blink, lid = 0 }) => {
  const lx = look * 7;
  if (blink) return <g stroke={INK} strokeWidth={6} strokeLinecap="round"><line x1={-46} y1={10} x2={-22} y2={10} /><line x1={22} y1={10} x2={46} y2={10} /></g>;
  if (face === "happy" || face === "deadpan" && false)
    return (
      <g fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round">
        <path d="M-46 14 Q-34 0 -22 14" />
        <path d="M22 14 Q34 0 46 14" />
      </g>
    );
  const wide = face === "shocked" || face === "panic";
  const ry = wide ? 17 : face === "deadpan" ? 5 : 13;
  return (
    <g>
      {wide ? (
        <>
          <ellipse cx={-34} cy={10} rx={18} ry={20} fill="white" stroke={INK} strokeWidth={5} />
          <ellipse cx={34} cy={10} rx={18} ry={20} fill="white" stroke={INK} strokeWidth={5} />
        </>
      ) : null}
      <ellipse cx={-34 + lx} cy={10} rx={wide ? 7 : 9} ry={wide ? 8 : ry} fill={INK} />
      <ellipse cx={34 + lx} cy={10} rx={wide ? 7 : 9} ry={wide ? 8 : ry} fill={INK} />
      {!wide && face !== "deadpan" ? (
        <>
          <circle cx={-37 + lx} cy={5} r={3.5} fill="white" />
          <circle cx={31 + lx} cy={5} r={3.5} fill="white" />
        </>
      ) : null}
      {lid > 0 ? (
        <g fill="currentColor">
          <rect x={-50} y={-6} width={32} height={10 + lid * 10} rx={4} />
          <rect x={18} y={-6} width={32} height={10 + lid * 10} rx={4} />
        </g>
      ) : null}
    </g>
  );
};

const Brows: React.FC<{ face: Face }> = ({ face }) => {
  const d: Record<string, string> = {
    focus: "M-50 -16 L-22 -12 M50 -16 L22 -12",
    confident: "M-50 -20 L-22 -12 M50 -20 L22 -12",
    smug: "M-50 -14 L-22 -20 M50 -20 L22 -12",
    shocked: "M-50 -30 Q-36 -40 -22 -30 M50 -30 Q36 -40 22 -30",
    panic: "M-50 -18 L-22 -30 M50 -18 L22 -30",
    nervous: "M-50 -18 L-22 -28 M50 -18 L22 -28",
    deadpan: "M-50 -10 L-22 -10 M50 -10 L22 -10",
    poker: "M-50 -14 L-22 -14 M50 -14 L22 -14",
    cold: "M-50 -22 L-22 -12 M50 -14 L22 -14",
    smirk: "M-50 -14 L-22 -14 M50 -22 L22 -16",
    happy: "M-50 -22 Q-36 -30 -22 -22 M50 -22 Q36 -30 22 -22",
  };
  return <path d={d[face] ?? d.focus} stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none" />;
};

const Mouth: React.FC<{ face: Face; talk: number }> = ({ face, talk }) => {
  if (talk > 0.05 || face === "shocked" || face === "panic")
    return <ellipse cx={0} cy={50} rx={14 + talk * 4} ry={6 + Math.max(talk, face === "shocked" ? 1 : face === "panic" ? 0.7 : 0) * 12} fill="#5b1a24" stroke={INK} strokeWidth={5} />;
  switch (face) {
    case "happy":
    case "confident":
      return <path d="M-20 44 Q0 62 20 44" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
    case "smug":
    case "smirk":
      return <path d="M-16 50 Q6 56 22 42" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
    case "nervous":
      return <path d="M-18 52 Q-9 46 0 52 Q9 58 18 52" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
    case "deadpan":
      return <path d="M-16 52 H16" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
    default:
      return <path d="M-12 50 Q0 53 12 50" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
  }
};

/** Arm from shoulder to a hand position (2-segment, elbow bends outward). */
const Arm: React.FC<{ sx: number; sy: number; hx: number; hy: number; side: 1 | -1; sleeve: string; skin: string }> = ({ sx, sy, hx, hy, side, sleeve, skin }) => {
  const mx = (sx + hx) / 2 + side * 40;
  const my = (sy + hy) / 2 + 30;
  const path = `M${sx} ${sy} Q${mx} ${my} ${hx} ${hy}`;
  return (
    <g>
      <path d={path} fill="none" stroke={INK} strokeWidth={50} strokeLinecap="round" />
      <path d={path} fill="none" stroke={sleeve} strokeWidth={38} strokeLinecap="round" />
      <ellipse cx={hx} cy={hy} rx={26} ry={20} fill={skin} {...o} strokeWidth={5} />
      <path d={`M${hx - 14} ${hy - 4} Q${hx} ${hy - 14} ${hx + 14} ${hy - 4}`} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={4} />
    </g>
  );
};

type CharProps = { face: Face; look: number; blink: boolean; breathe: number; talk: number; handL: { x: number; y: number }; handR: { x: number; y: number }; part?: "body" | "arms" };

const HeroChar: React.FC<CharProps> = ({ face, look, blink, breathe, talk, handL, handR, part = "body" }) => {
  const SKIN = "#f3c6a0";
  const SH = "#d9a07c";
  const HOOD = "#1fb5a6";
  const HOOD_SH = "#16897e";
  const x = SEAT.hero.x;
  if (part === "arms")
    return (
      <g>
        <Arm sx={x - 120} sy={470 + breathe} hx={handL.x} hy={handL.y} side={-1} sleeve={HOOD} skin={SKIN} />
        <Arm sx={x + 120} sy={470 + breathe} hx={handR.x} hy={handR.y} side={1} sleeve={HOOD} skin={SKIN} />
      </g>
    );
  return (
    <g>
      {/* ponytail behind */}
      <path d={`M${x + 70} ${300 + breathe} Q${x + 170} ${330 + breathe} ${x + 120} ${460 + breathe} Q${x + 110} ${390 + breathe} ${x + 60} ${360 + breathe}Z`} fill="#3a2418" {...o} />
      {/* torso */}
      <path d={`M${x - 150} ${TABLE_Y + 10} Q${x - 160} ${440 + breathe} ${x - 70} ${412 + breathe} H${x + 70} Q${x + 160} ${440 + breathe} ${x + 150} ${TABLE_Y + 10}Z`} fill={HOOD} {...o} />
      <path d={`M${x + 60} ${416 + breathe} Q${x + 150} ${450} ${x + 140} ${TABLE_Y + 10} H${x + 90} Q${x + 100} ${480} ${x + 40} ${420 + breathe}Z`} fill={HOOD_SH} />
      <path d={`M${x - 22} ${440 + breathe} V${520 + breathe} M${x + 22} ${440 + breathe} V${515 + breathe}`} stroke="#f4f1ea" strokeWidth={5} strokeLinecap="round" />
      {/* head */}
      <g transform={`translate(${x}, ${330 + breathe}) rotate(${look * 4})`}>
        <path d="M-60 60 Q0 110 60 60" fill={SKIN} {...o} />
        <circle r={100} fill={SKIN} {...o} />
        <path d="M45 -85 A100 100 0 0 1 62 78 Q92 0 45 -85Z" fill={SH} opacity={0.55} />
        <ellipse cx={-62} cy={34} rx={16} ry={9} fill="#f29a8f" opacity={0.6} />
        <ellipse cx={62} cy={34} rx={16} ry={9} fill="#f29a8f" opacity={0.6} />
        <g color={SKIN}>
          <Eyes face={face} look={look} blink={blink} />
        </g>
        <Brows face={face} />
        <Mouth face={face} talk={talk} />
        {/* hair: bangs + top */}
        <path d="M-104 -6 Q-110 -110 0 -112 Q110 -110 104 -6 Q90 -50 54 -60 Q20 -30 -10 -62 Q-40 -34 -74 -54 Q-96 -40 -104 -6Z" fill="#3a2418" {...o} />
        <path d="M-40 -96 Q0 -108 40 -98" fill="none" stroke="#6b4530" strokeWidth={6} strokeLinecap="round" />
        <circle cx={-98} cy={40} r={7} fill="none" stroke="#f2c95b" strokeWidth={4} />
        {face === "panic" || face === "nervous" ? <path d="M70 -40 q-8 14 0 20 q8 -6 0 -20z" fill="#9fe3ff" stroke={INK} strokeWidth={3} /> : null}
      </g>
    </g>
  );
};

const IveyChar: React.FC<CharProps> = ({ face, look, blink, breathe, talk, handL, handR, part = "body" }) => {
  const SKIN = "#8d5a3c";
  const SH = "#6e4329";
  const HOOD = "#4a4f5c";
  const HOOD_SH = "#363a45";
  const x = SEAT.ivey.x;
  if (part === "arms")
    return (
      <g>
        <Arm sx={x - 120} sy={470 + breathe} hx={handL.x} hy={handL.y} side={-1} sleeve={HOOD} skin={SKIN} />
        <Arm sx={x + 120} sy={470 + breathe} hx={handR.x} hy={handR.y} side={1} sleeve={HOOD} skin={SKIN} />
      </g>
    );
  return (
    <g>
      <path d={`M${x - 155} ${TABLE_Y + 10} Q${x - 165} ${440 + breathe} ${x - 72} ${410 + breathe} H${x + 72} Q${x + 165} ${440 + breathe} ${x + 155} ${TABLE_Y + 10}Z`} fill={HOOD} {...o} />
      <path d={`M${x - 60} ${414 + breathe} Q${x - 150} ${450} ${x - 140} ${TABLE_Y + 10} H${x - 90} Q${x - 100} ${480} ${x - 40} ${420 + breathe}Z`} fill={HOOD_SH} />
      <path d={`M${x} ${430 + breathe} V${TABLE_Y}`} stroke="#2c2f38" strokeWidth={6} />
      {/* headphones around the neck */}
      <path d={`M${x - 70} ${418 + breathe} Q${x} ${470 + breathe} ${x + 70} ${418 + breathe}`} fill="none" stroke="#15151b" strokeWidth={14} />
      <ellipse cx={x - 74} cy={420 + breathe} rx={20} ry={26} fill="#15151b" stroke={INK} strokeWidth={4} />
      <ellipse cx={x + 74} cy={420 + breathe} rx={20} ry={26} fill="#15151b" stroke={INK} strokeWidth={4} />
      <ellipse cx={x + 74} cy={420 + breathe} rx={8} ry={10} fill="#3ba3ff" />
      <g transform={`translate(${x}, ${328 + breathe}) rotate(${look * 4})`}>
        <path d="M-60 60 Q0 110 60 60" fill={SKIN} {...o} />
        <circle r={100} fill={SKIN} {...o} />
        <path d="M-45 -85 A100 100 0 0 0 -62 78 Q-92 0 -45 -85Z" fill={SH} opacity={0.55} />
        <g color={SKIN}>
          <Eyes face={face} look={look} blink={blink} lid={face === "poker" || face === "cold" ? 0.6 : face === "smirk" ? 0.4 : 0} />
        </g>
        <Brows face={face} />
        <Mouth face={face} talk={talk} />
        {/* beanie */}
        <path d="M-102 -20 Q-104 -128 0 -130 Q104 -128 102 -20 Z" fill="#1d1d24" {...o} />
        <rect x={-106} y={-38} width={212} height={34} rx={14} fill="#2a2a33" {...o} />
        <path d="M-80 -70 Q-40 -110 10 -112" fill="none" stroke="#3a3a46" strokeWidth={6} strokeLinecap="round" />
      </g>
    </g>
  );
};

/* ---------------- room + table ---------------- */
const Room: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <defs>
      <linearGradient id="wall2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1c1418" />
        <stop offset="1" stopColor="#2e1f1c" />
      </linearGradient>
      <radialGradient id="lampglow" cx="0.5" cy="0.3" r="0.6">
        <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="felt2" cx="0.5" cy="0.35" r="0.7">
        <stop offset="0" stopColor="#1a8a4f" />
        <stop offset="1" stopColor="#0b5230" />
      </radialGradient>
      <filter id="soft2">
        <feGaussianBlur stdDeviation="5" />
      </filter>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#wall2)" />
    {/* wood panels + framed art, softly blurred for depth */}
    <g filter="url(#soft2)" opacity={0.85}>
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={i * 200 + 10} y={60} width={180} height={460} rx={8} fill="#2a1c1a" stroke="#3a2723" strokeWidth={6} />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={`b${i}`} cx={120 + i * 220} cy={140 + (i % 3) * 40} r={26 + (i % 2) * 10} fill="#ffcf8a" opacity={0.18 + 0.06 * Math.sin(t * 0.8 + i)} />
      ))}
    </g>
    <ellipse cx={960} cy={420} rx={900} ry={480} fill="url(#lampglow)" />
    {/* hanging lamp */}
    <line x1={960} y1={0} x2={960} y2={60} stroke="#111" strokeWidth={6} />
    <path d="M860 120 Q960 40 1060 120 Z" fill="#1f5c3a" {...o} />
    <ellipse cx={960} cy={120} rx={100} ry={14} fill="#ffe7b0" {...o} strokeWidth={4} />
  </g>
);

const Table: React.FC = () => (
  <g>
    <ellipse cx={960} cy={830} rx={960} ry={260} fill="#2b1710" {...o} />
    <ellipse cx={960} cy={815} rx={900} ry={225} fill="url(#felt2)" {...o} />
    <ellipse cx={960} cy={815} rx={760} ry={175} fill="none" stroke="#e4d9a6" strokeWidth={3} opacity={0.5} />
    <path d="M220 760 Q960 640 1700 760" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={20} />
  </g>
);

/* ---------------- scene ---------------- */
const lastActBefore = (who: Who, t: number) => {
  let best: { t: number; kind: "bet" | "check" } | null = null;
  for (const a of TL.acts) {
    if (a.t > t) break;
    if ((a.act.a === "bet" || a.act.a === "check") && a.act.who === who) best = { t: a.t, kind: a.act.a };
  }
  return best;
};

const talkingNow = (t: number, prefix: string) => {
  const b = beatAt(t);
  const st = b.step as { id?: string; voice?: string };
  const id = st.id ?? st.voice;
  if (!id || !id.startsWith(prefix)) return 0;
  return 0.5 + 0.5 * Math.abs(Math.sin(t * 13));
};

export const PokerScene2D: React.FC<{ t: number }> = ({ t }) => {
  const s = stateAt(t);
  const b = beatAt(t);
  const slow = findBeat("slowmo");
  const decide = findBeat("decide");
  const reveal = findBeat("reveal");
  const id = (b.step as { id?: string }).id ?? "";

  // hero expressions follow the story
  let heroFace: Face = "focus";
  if (b.step.k === "peek") heroFace = "happy";
  if (id === "m_flop" || id === "m_turn") heroFace = "smug";
  if (id === "m_river" || id === "m_bet") heroFace = "confident";
  if (b.step.k === "slowmo") heroFace = t - slow.start > 4 ? "shocked" : "confident";
  if (id === "m_panic" || id === "t_beats" || id === "t_odds") heroFace = id === "m_panic" ? "panic" : "nervous";
  if (b.step.k === "decide" || id === "m_decide") heroFace = "nervous";
  if (b.step.k === "reveal") heroFace = t - reveal.start > 1.1 ? "shocked" : "nervous";
  if (id === "m_cool" || b.step.k === "win") heroFace = "deadpan";
  let iveyFace: Face = "poker";
  if (b.step.k === "slowmo" && t - slow.start > 4) iveyFace = "cold";
  if (t >= reveal.start + 1.1) iveyFace = "smirk";

  const blink = (seed: number) => (t * 1.0 + seed) % 3.7 < 0.12;
  const breathe = (seed: number) => Math.sin(t * 1.6 + seed) * 3;

  // hands: rest near own cards; push chips on bets; knock on checks
  const hands = (who: Who) => {
    const sx = SEAT[who].x;
    const dir = who === "hero" ? 1 : -1;
    const restL = { x: sx - 120, y: 682 };
    const restR = { x: sx + 120, y: 682 };
    const act = lastActBefore(who, t);
    let push = 0;
    let knock = 0;
    if (act) {
      const dt = t - act.t;
      if (act.kind === "bet") push = dt < 0.35 ? ease(dt / 0.35) : 1 - ease((dt - 0.6) / 0.4);
      else knock = dt < 0.5 ? Math.abs(Math.sin((dt / 0.5) * Math.PI * 2)) : 0;
    }
    const pushHand = who === "hero" ? "R" : "L";
    const target = { x: BET[who].x - dir * 20, y: BET[who].y - 10 };
    const moved = { x: lerp((pushHand === "R" ? restR : restL).x, target.x, push), y: lerp((pushHand === "R" ? restR : restL).y, target.y, push) };
    const other = pushHand === "R" ? restL : restR;
    const knocked = { x: (pushHand === "R" ? restR : restL).x, y: (pushHand === "R" ? restR : restL).y - knock * 30 };
    const main = push > 0 ? moved : knocked;
    return pushHand === "R" ? { L: other, R: main } : { L: main, R: other };
  };
  const hH = hands("hero");
  const hI = hands("ivey");

  // chips: bets slide from stack to bet spot; pot to winner
  const slide = (who: Who) => (s.lastBet && s.lastBet.who === who ? ease((t - s.lastBet.t) / (s.lastBet.big ? 0.9 : 0.4)) : 1);
  const k = (x: number) => Math.round(x / 1000);
  const heroBetPos = { x: lerp(STACK.hero.x, BET.hero.x, slide("hero")), y: lerp(STACK.hero.y, BET.hero.y, slide("hero")) };
  const iveyBetPos = { x: lerp(STACK.ivey.x, BET.ivey.x, slide("ivey")), y: lerp(STACK.ivey.y, BET.ivey.y, slide("ivey")) };
  const win = s.winAt !== null ? ease((t - s.winAt) / 0.9) : 0;
  const potPos = { x: lerp(POT.x, STACK.ivey.x, win), y: lerp(POT.y, STACK.ivey.y, win) };

  // hole cards
  const peekB = findBeat("peek");
  const heroUp = ease((t - peekB.start - 0.2) / 0.35);
  const revealK = s.revealAt !== null ? ease((t - s.revealAt) / 0.4) : 0;

  return (
    <g>
      <Room t={t} />
      <g transform={`translate(${SEAT.hero.x} 640) scale(1.18) translate(${-SEAT.hero.x} -640)`}>
        <HeroChar face={heroFace} look={heroFace === "smug" ? 1 : 0.4} blink={blink(0)} breathe={breathe(0)} talk={talkingNow(t, "m_")} handL={hH.L} handR={hH.R} />
      </g>
      <g transform={`translate(${SEAT.ivey.x} 640) scale(1.18) translate(${-SEAT.ivey.x} -640)`}>
        <IveyChar face={iveyFace} look={-0.5} blink={blink(1.7)} breathe={breathe(1.3)} talk={0} handL={hI.L} handR={hI.R} />
      </g>
      <Table />
      {/* arms reach over the rail onto the felt */}
      <g transform={`translate(${SEAT.hero.x} 640) scale(1.18) translate(${-SEAT.hero.x} -640)`}>
        <HeroChar part="arms" face={heroFace} look={0} blink={false} breathe={breathe(0)} talk={0} handL={hH.L} handR={hH.R} />
      </g>
      <g transform={`translate(${SEAT.ivey.x} 640) scale(1.18) translate(${-SEAT.ivey.x} -640)`}>
        <IveyChar part="arms" face={iveyFace} look={0} blink={false} breathe={breathe(1.3)} talk={0} handL={hI.L} handR={hI.R} />
      </g>
      {/* dealer button */}
      <g transform="translate(300,800)">
        <ellipse cx={0} cy={4} rx={30} ry={13} fill="#d9d4c6" stroke={INK} strokeWidth={3} />
        <ellipse cx={0} cy={0} rx={30} ry={13} fill="#f4f1ea" stroke={INK} strokeWidth={3} />
        <text y={6} textAnchor="middle" fontSize={16} fontWeight={900} fill={INK} fontFamily="Arial">
          D
        </text>
      </g>
      {/* hole cards in front of each player */}
      {HERO.map((c, i) => (
        <Card2D key={c} c={c} x={SEAT.hero.x - 40 + i * 62} y={735} w={74} faceUp={heroUp} rot={-6 + i * 10} />
      ))}
      {IVEY.map((c, i) => (
        <Card2D key={c} c={c} x={SEAT.ivey.x - 40 + i * 62} y={735} w={74} faceUp={revealK} rot={-6 + i * 10} glow={revealK > 0.9 ? "#ff4d5e" : undefined} />
      ))}
      {/* chips */}
      <Chips amountK={300 - Math.min(300, k(s.heroBet))} x={STACK.hero.x} y={STACK.hero.y} />
      <Chips amountK={300 - Math.min(300, k(s.iveyBet))} x={STACK.ivey.x} y={STACK.ivey.y} />
      <Chips amountK={k(s.heroBet)} x={heroBetPos.x} y={heroBetPos.y} />
      <Chips amountK={k(s.iveyBet)} x={iveyBetPos.x} y={iveyBetPos.y} />
      <Chips amountK={k(s.pot)} x={potPos.x} y={potPos.y} />
      {/* board */}
      {BOARD.map((c, i) => {
        const dealt = i < s.dealt.length;
        if (!dealt) return null;
        const slideIn = ease((t - s.dealt[i]) / 0.3);
        const flip = ease((t - s.flips[i]) / 0.3);
        return <Card2D key={c} c={c} x={lerp(1600, 720 + i * 120, slideIn)} y={835} w={100} faceUp={flip} />;
      })}
      {/* decision spotlight dims the room a bit */}
      {t >= decide.start && t < decide.end ? <rect x={0} y={0} width={1920} height={1080} fill="black" opacity={0.25} /> : null}
    </g>
  );
};
