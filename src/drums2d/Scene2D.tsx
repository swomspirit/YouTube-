import { impulse, lastHit, type Piece, type PreparedPerformance } from "../drums/hits";
import { beaterAngle } from "../drums/sticks";
import { SHOULDER, STRIKE, type P2 } from "./layout";
import { elbow2d, hand2d, tip2d } from "./pose2d";

/*
 * Flat 2D cartoon drum scene, v2: cel shading, layered stage, smears,
 * follow-through and scripted gags. Original character.
 * Local coordinates ~1000 x 900; the camera transform is applied outside.
 */
const INK = "#16141c";
const LW = 7;
const SKIN = "#f5c9a0";
const SKIN_SH = "#d99a74";
const SHELL = "#d72b42";
const SHELL_SH = "#a01a2e";
const SHELL_HI = "#ff6a7c";
const HEAD = "#f6f1e4";
const BRONZE = "#f3c450";
const BRONZE_SH = "#c78c22";
const CHROME = "#cfd5dd";
const SHIRT = "#1e1c26";
const SHIRT_SH = "#100f15";
const HAIR = "#262333";
const HAIR_HI = "#4a4566";
const BAND = "#e23b4e";
const o = { stroke: INK, strokeWidth: LW, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export type Mood = "idle" | "chill" | "focus" | "beast" | "victory";
export type Gags = {
  yawn?: [number, number];
  twirlAt?: number;
  tossAt?: number;
  ripAt?: number;
  cymbalFlyAt?: number;
  throneBreakAt?: number;
  hype?: [number, number];
  speedLines?: [number, number];
};

type Props = { perf: PreparedPerformance | null; now: number; t: number; accent: string; mood: Mood; crowdHype: number; gags?: Gags };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const pieceImp = (p: PreparedPerformance | null, piece: Piece, now: number, tau = 0.09) => (p ? impulse(p.byPiece[piece], now, tau) : 0);

/* ======================================================================= */
/* Background: layered stage                                                */
/* ======================================================================= */
const Defs: React.FC<{ accent: string }> = ({ accent }) => (
  <defs>
    <linearGradient id="bg-wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#0d0a1c" />
      <stop offset="0.55" stopColor="#251a44" />
      <stop offset="1" stopColor="#3a2560" />
    </linearGradient>
    <radialGradient id="bg-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={accent} stopOpacity="0.55" />
      <stop offset="0.6" stopColor={accent} stopOpacity="0.12" />
      <stop offset="1" stopColor={accent} stopOpacity="0" />
    </radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={accent} stopOpacity="0.55" />
      <stop offset="1" stopColor={accent} stopOpacity="0" />
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#3b2d5c" />
      <stop offset="1" stopColor="#160f27" />
    </linearGradient>
    <linearGradient id="shell" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={SHELL_SH} />
      <stop offset="0.25" stopColor={SHELL} />
      <stop offset="0.42" stopColor={SHELL_HI} />
      <stop offset="0.55" stopColor={SHELL} />
      <stop offset="1" stopColor={SHELL_SH} />
    </linearGradient>
    <radialGradient id="bronze" cx="0.45" cy="0.4" r="0.6">
      <stop offset="0" stopColor="#ffe9a3" />
      <stop offset="0.45" stopColor={BRONZE} />
      <stop offset="1" stopColor={BRONZE_SH} />
    </radialGradient>
    <filter id="blur-far" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
    <filter id="blur-haze" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="40" />
    </filter>
  </defs>
);

const Backdrop: React.FC<{ accent: string; t: number; kick: number; crash: number; mood: Mood; hype: number }> = ({ accent, t, kick, crash, mood, hype }) => {
  const fast = mood === "beast";
  return (
    <g>
      <rect x={-1400} y={-1000} width={3800} height={2900} fill="url(#bg-wall)" />
      {/* far crowd / venue, blurred */}
      <g filter="url(#blur-far)" opacity={0.55}>
        {Array.from({ length: 26 }, (_, i) => {
          const x = -700 + i * 92;
          const bob = Math.sin(t * (fast ? 9 : 5) + i) * 5 * hype;
          return <ellipse key={i} cx={x} cy={150 + (i % 3) * 14 + bob} rx={38} ry={50} fill="#120d22" />;
        })}
      </g>
      {/* lighting truss */}
      <rect x={-900} y={-140} width={2800} height={34} fill="#14111f" {...o} strokeWidth={5} />
      {Array.from({ length: 13 }, (_, i) => {
        const x = -700 + i * 200;
        const on = 0.45 + 0.55 * Math.max(kick, (Math.sin(t * 3 + i) + 1) / 2 * 0.5);
        return (
          <g key={i}>
            <circle cx={x} cy={-96} r={22} fill="#1b1729" {...o} strokeWidth={5} />
            <circle cx={x} cy={-96} r={12} fill={accent} opacity={on} />
            <circle cx={x} cy={-96} r={40} fill={accent} opacity={on * 0.25} />
          </g>
        );
      })}
      {/* haze glow behind drummer */}
      <ellipse cx={500} cy={380} rx={520 + kick * 30} ry={420 + kick * 24} fill="url(#bg-glow)" />
      {/* light beams */}
      {[-2, -1, 1, 2].map((k, i) => {
        const a = Math.sin(t * (fast ? 1.5 : 0.6) + i * 1.9) * 16 + k * 9;
        return (
          <g key={k} transform={`translate(${500 + k * 260}, -96) rotate(${a})`} opacity={0.35 + crash * 0.5}>
            <path d="M-24 0 L24 0 L260 1150 L-260 1150 Z" fill="url(#beam)" />
          </g>
        );
      })}
      {/* speaker stacks with shading */}
      {[-260, 1080].map((x) => (
        <g key={x}>
          {[0, 1, 2].map((r) => (
            <g key={r}>
              <rect x={x} y={300 + r * 156} width={180} height={150} rx={12} fill="#231d36" {...o} />
              <rect x={x + 8} y={308 + r * 156} width={164} height={20} rx={6} fill="#2f2747" />
              <circle cx={x + 90} cy={378 + r * 156} r={52 + (r === 1 ? kick * 7 : kick * 3)} fill="#0f0c18" {...o} />
              <circle cx={x + 90} cy={378 + r * 156} r={30} fill="#1a1528" />
              <circle cx={x + 82} cy={370 + r * 156} r={9} fill="#3d3558" />
            </g>
          ))}
        </g>
      ))}
      {/* stage riser + glossy floor + glow reflection */}
      <rect x={-400} y={760} width={1800} height={420} fill="url(#floor)" />
      <rect x={-400} y={760} width={1800} height={12} fill={accent} opacity={0.35 + kick * 0.4} />
      <ellipse cx={500} cy={800} rx={480} ry={46} fill="#120c20" />
      <ellipse cx={500} cy={790} rx={300} ry={20} fill={accent} opacity={0.12 + kick * 0.15} filter="url(#blur-far)" />
    </g>
  );
};

/* ======================================================================= */
/* Kit                                                                      */
/* ======================================================================= */
const Drum2D: React.FC<{ x: number; y: number; rx: number; ry: number; h: number; imp: number; tilt?: number; ripped?: number }> = ({ x, y, rx, ry, h, imp, tilt = 0, ripped = 0 }) => {
  const sq = 1 - imp * 0.09;
  return (
    <g transform={`translate(${x},${y}) rotate(${tilt}) scale(${1 + imp * 0.05},${sq})`}>
      <path d={`M${-rx} 0 V${h} A${rx} ${ry} 0 0 0 ${rx} ${h} V0`} fill="url(#shell)" {...o} />
      {/* chrome hoop on bottom + lugs */}
      <path d={`M${-rx} ${h - 6} A${rx} ${ry} 0 0 0 ${rx} ${h - 6}`} fill="none" stroke={CHROME} strokeWidth={6} />
      {[-0.7, -0.25, 0.25, 0.7].map((k) => (
        <rect key={k} x={k * rx - 5} y={h * 0.3} width={10} height={h * 0.4} rx={4} fill={CHROME} stroke={INK} strokeWidth={3} />
      ))}
      {/* head */}
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={imp > 0.06 ? "#ffffff" : HEAD} {...o} />
      <ellipse cx={-rx * 0.12} cy={-ry * 0.1} rx={rx * 0.8} ry={ry * 0.62} fill="none" stroke="#e2dccb" strokeWidth={3} />
      <path d={`M${-rx * 0.6} ${-ry * 0.45} Q${-rx * 0.2} ${-ry * 0.8} ${rx * 0.25} ${-ry * 0.6}`} fill="none" stroke="white" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
      {ripped > 0 ? (
        <g>
          <path d={`M${-rx * 0.5} ${-2} L${-rx * 0.15} ${-ry * 0.45} L${rx * 0.05} ${ry * 0.1} L${rx * 0.35} ${-ry * 0.35} L${rx * 0.5} ${ry * 0.2} L${rx * 0.1} ${ry * 0.55} L${-rx * 0.3} ${ry * 0.4} Z`} fill="#1a1620" stroke={INK} strokeWidth={4} />
          <path d={`M${rx * 0.05} ${ry * 0.1} L${rx * 0.25} ${-ry * (0.9 + Math.sin(ripped * 20) * 0.2)} L${rx * 0.35} ${-ry * 0.35}`} fill={HEAD} stroke={INK} strokeWidth={4} />
        </g>
      ) : null}
      {/* rim */}
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke={CHROME} strokeWidth={4} />
    </g>
  );
};

const CymbalShape: React.FC<{ rx: number; glow: number; china?: boolean }> = ({ rx, glow, china }) => (
  <g>
    <ellipse cx={0} cy={0} rx={rx} ry={rx * 0.17} fill="url(#bronze)" {...o} />
    {[0.8, 0.6, 0.4].map((k) => (
      <ellipse key={k} cx={0} cy={-1} rx={rx * k} ry={rx * 0.17 * k} fill="none" stroke={BRONZE_SH} strokeWidth={2} opacity={0.6} />
    ))}
    <path d={`M${-rx * 0.75} ${-rx * 0.06} Q${-rx * 0.3} ${-rx * 0.15} ${rx * 0.1} ${-rx * 0.12}`} fill="none" stroke="#fff6d0" strokeWidth={5} strokeLinecap="round" />
    <ellipse cx={0} cy={-5} rx={rx * 0.15} ry={rx * 0.07} fill={china ? "#e3a63c" : BRONZE_SH} stroke={INK} strokeWidth={4} />
    {glow > 0.05 ? <ellipse cx={0} cy={0} rx={rx * (1 + glow * 0.3)} ry={rx * 0.22 * (1 + glow)} fill="#fff6c8" opacity={glow * 0.55} /> : null}
  </g>
);

const Stand: React.FC<{ x: number; y1: number; y2: number }> = ({ x, y1, y2 }) => (
  <g>
    <line x1={x} y1={y1} x2={x} y2={y2} stroke={INK} strokeWidth={12} strokeLinecap="round" />
    <line x1={x} y1={y1} x2={x} y2={y2} stroke={CHROME} strokeWidth={5} />
    <line x1={x - 1.5} y1={y1} x2={x - 1.5} y2={y2} stroke="white" strokeWidth={1.5} opacity={0.7} />
    <path d={`M${x} ${y2 - 40} L${x - 46} ${y2} M${x} ${y2 - 40} L${x + 46} ${y2}`} stroke={INK} strokeWidth={8} strokeLinecap="round" />
  </g>
);

const cymbalState = (p: PreparedPerformance | null, piece: Piece, now: number) => {
  const h = p ? lastHit(p.byPiece[piece], now) : null;
  if (!h) return { wob: 0, glow: 0 };
  const dt = now - h.t;
  const amp = (h.v / 127) * Math.exp(-dt / 0.55);
  return { wob: amp * 14 * Math.sin(dt * 2 * Math.PI * 3), glow: (h.v / 127) * Math.exp(-dt / 0.18) };
};

/* ======================================================================= */
/* Drummer                                                                  */
/* ======================================================================= */
type Face = "chill" | "focus" | "beast" | "victory" | "idle" | "yawn" | "smug" | "ow" | "scream" | "fallen";

const HeadArt: React.FC<{ face: Face; fly: number; t: number; lag: number; scream: number }> = ({ face, fly, t, lag, scream }) => {
  const eye = (x: number, kind: "dot" | "closed" | "angry" | "x" | "wink" | "wide") => {
    if (kind === "closed") return <path d={`M${x - 13} 14 Q${x} 2 ${x + 13} 14`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />;
    if (kind === "wink") return <path d={`M${x - 13} 10 Q${x} 18 ${x + 13} 10`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />;
    if (kind === "x")
      return (
        <g stroke={INK} strokeWidth={7} strokeLinecap="round">
          <line x1={x - 10} y1={4} x2={x + 10} y2={22} />
          <line x1={x + 10} y1={4} x2={x - 10} y2={22} />
        </g>
      );
    const ry = kind === "wide" ? 17 : kind === "angry" ? 10 : 13;
    return (
      <g>
        <ellipse cx={x} cy={14} rx={kind === "wide" ? 11 : 9} ry={ry} fill={INK} />
        <circle cx={x - 3} cy={14 - ry * 0.45} r={3.6} fill="white" />
      </g>
    );
  };
  const brows: Record<string, React.ReactNode> = {
    angry: (
      <g stroke={INK} strokeWidth={8} strokeLinecap="round">
        <line x1={-54} y1={-10} x2={-22} y2={2} />
        <line x1={54} y1={-10} x2={22} y2={2} />
      </g>
    ),
    focus: (
      <g stroke={INK} strokeWidth={7} strokeLinecap="round">
        <line x1={-52} y1={-6} x2={-24} y2={-2} />
        <line x1={52} y1={-6} x2={24} y2={-2} />
      </g>
    ),
    up: (
      <g stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none">
        <path d="M-52 -8 Q-38 -18 -24 -10" />
        <path d="M52 -8 Q38 -18 24 -10" />
      </g>
    ),
  };
  let eyes: React.ReactNode;
  let brow: React.ReactNode = brows.up;
  let mouth: React.ReactNode;
  const big = (open: number) => (
    <g>
      <path d={`M-28 44 Q0 ${44 + open * 56} 28 44 Q0 38 -28 44Z`} fill="#5b1a24" {...o} strokeWidth={6} />
      <path d={`M-14 ${50 + open * 30} Q0 ${44 + open * 40} 14 ${50 + open * 30}`} fill="#e86b7a" />
      <path d="M-20 46 H20" stroke="white" strokeWidth={6} />
    </g>
  );
  switch (face) {
    case "beast":
      eyes = <>{eye(-36, "angry")}{eye(36, "angry")}</>;
      brow = brows.angry;
      mouth =
        scream > 0.15 ? big(scream) : (
          <g>
            <rect x={-26} y={38} width={52} height={20} rx={7} fill="white" {...o} strokeWidth={5} />
            <line x1={-9} y1={38} x2={-9} y2={58} stroke={INK} strokeWidth={3} />
            <line x1={9} y1={38} x2={9} y2={58} stroke={INK} strokeWidth={3} />
          </g>
        );
      break;
    case "scream":
      eyes = <>{eye(-36, "angry")}{eye(36, "angry")}</>;
      brow = brows.angry;
      mouth = big(1);
      break;
    case "focus":
      eyes = <>{eye(-36, "dot")}{eye(36, "dot")}</>;
      brow = brows.focus;
      mouth = <path d="M-12 50 Q0 46 12 50" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      break;
    case "yawn":
      eyes = <>{eye(-36, "closed")}{eye(36, "closed")}</>;
      mouth = <ellipse cx={0} cy={58} rx={22} ry={26} fill="#5b1a24" {...o} strokeWidth={6} />;
      break;
    case "smug":
      eyes = <>{eye(-36, "wink")}{eye(36, "dot")}</>;
      mouth = <path d="M-20 46 Q8 62 26 40" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      break;
    case "ow":
      eyes = <>{eye(-36, "x")}{eye(36, "x")}</>;
      mouth = big(0.6);
      break;
    case "victory":
      eyes = <>{eye(-36, "closed")}{eye(36, "closed")}</>;
      mouth = big(0.7);
      break;
    case "chill":
      eyes = <>{eye(-36, "closed")}{eye(36, "closed")}</>;
      mouth = <path d="M-18 44 Q0 60 18 44" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      break;
    default:
      eyes = <>{eye(-36, "dot")}{eye(36, "dot")}</>;
      mouth = <path d="M-16 46 Q0 56 16 46" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
  }
  const sweat =
    face === "beast" || face === "scream"
      ? [0, 1, 2].map((i) => {
          const p = (t * 1.4 + i * 0.33) % 1;
          const x = (i - 1) * 105;
          return <path key={i} d={`M${x} ${-50 + p * 100} q-10 15 0 22 q10 -7 0 -22z`} fill="#9fe3ff" stroke={INK} strokeWidth={3} opacity={1 - p} />;
        })
      : null;
  return (
    <g>
      {/* headband tails (follow-through: they lag behind the head) */}
      <g transform={`translate(86 -36) rotate(${20 + lag * 70})`}>
        <path d="M0 0 Q40 10 70 0 Q46 20 8 18 Z" fill={BAND} {...o} strokeWidth={5} />
        <path d="M4 8 Q44 34 64 30 Q40 42 4 22 Z" fill="#b82a3b" {...o} strokeWidth={5} />
      </g>
      {/* back hair */}
      <path d={`M-104 -6 Q-116 -118 0 -126 Q116 -118 104 -6 Q66 ${-60 - fly} 0 -62 Q-66 ${-60 - fly} -104 -6Z`} fill={HAIR} {...o} />
      {/* ears */}
      <ellipse cx={-96} cy={20} rx={16} ry={22} fill={SKIN} {...o} strokeWidth={5} />
      <ellipse cx={96} cy={20} rx={16} ry={22} fill={SKIN} {...o} strokeWidth={5} />
      {/* face with cel shadow */}
      <circle cx={0} cy={0} r={98} fill={SKIN} {...o} />
      <path d="M40 -86 A98 98 0 0 1 60 76 Q90 10 40 -86Z" fill={SKIN_SH} opacity={0.55} />
      <path d="M-80 -30 Q0 -70 80 -30 Q0 -40 -80 -30Z" fill={SKIN_SH} opacity={0.5} />
      <ellipse cx={-62} cy={36} rx={17} ry={9} fill="#f2907f" opacity={0.6} />
      <ellipse cx={62} cy={36} rx={17} ry={9} fill="#f2907f" opacity={0.6} />
      <path d="M-4 22 Q4 34 -6 36" fill="none" stroke={SKIN_SH} strokeWidth={5} strokeLinecap="round" />
      {eyes}
      {brow}
      {mouth}
      {/* spiky fringe with highlights */}
      <path
        d={`M-102 -16 L-86 ${-74 - fly} L-62 -42 L-40 ${-104 - fly} L-12 -48 L14 ${-108 - fly} L40 -48 L64 ${-94 - fly} L80 -42 L102 ${-66 - fly} L104 -14 Q62 -70 0 -62 Q-62 -70 -102 -16Z`}
        fill={HAIR}
        {...o}
      />
      <path d={`M-40 ${-90 - fly * 0.8} L-30 -56 M14 ${-94 - fly * 0.8} L20 -58 M64 ${-82 - fly * 0.8} L66 -54`} stroke={HAIR_HI} strokeWidth={6} strokeLinecap="round" />
      {/* headband */}
      <path d="M-100 -24 Q0 -74 100 -24" fill="none" stroke={INK} strokeWidth={24} />
      <path d="M-100 -24 Q0 -74 100 -24" fill="none" stroke={BAND} strokeWidth={15} />
      <path d="M-60 -50 Q0 -70 40 -56" fill="none" stroke="#ff8a97" strokeWidth={4} strokeLinecap="round" />
      {sweat}
      {face === "yawn" ? (
        <g fontFamily="Arial Black, Arial" fontWeight={900} fill="white" stroke={INK} strokeWidth={4} paintOrder="stroke">
          {[0, 1, 2].map((i) => {
            const p = (t * 0.7 + i * 0.33) % 1;
            return (
              <text key={i} x={110 + p * 70} y={-80 - p * 110} fontSize={30 + i * 10} opacity={1 - p}>
                Z
              </text>
            );
          })}
        </g>
      ) : null}
    </g>
  );
};

/** Stick (+ optional motion smear trail). */
const StickArt: React.FC<{ from: P2; to: P2; ghosts?: { from: P2; to: P2 }[] }> = ({ from, to, ghosts = [] }) => (
  <g>
    {ghosts.map((g, i) => (
      <line key={i} x1={g.from.x} y1={g.from.y} x2={g.to.x} y2={g.to.y} stroke="#fff1d0" strokeWidth={14 - i * 3} strokeLinecap="round" opacity={0.35 - i * 0.1} />
    ))}
    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={INK} strokeWidth={15} strokeLinecap="round" />
    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#e8c690" strokeWidth={8} strokeLinecap="round" />
    <line x1={from.x + (to.x - from.x) * 0.1} y1={from.y + (to.y - from.y) * 0.1 - 2} x2={to.x} y2={to.y - 2} stroke="#fff1d6" strokeWidth={2.5} strokeLinecap="round" />
  </g>
);

const ArmArt: React.FC<{ hand: "R" | "L"; h: P2 }> = ({ hand, h }) => {
  const s = SHOULDER[hand];
  const e = elbow2d(s, h, 112, 104, hand === "R" ? -1 : 1);
  const path = `M${s.x} ${s.y} L${e.x} ${e.y} L${h.x} ${h.y}`;
  return (
    <g>
      <path d={path} fill="none" stroke={INK} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke={SKIN} strokeWidth={27} strokeLinecap="round" strokeLinejoin="round" />
      {/* cel shadow strip along the arm */}
      <path d={`M${s.x + 6} ${s.y + 8} L${e.x + 6} ${e.y + 8} L${h.x + 4} ${h.y + 6}`} fill="none" stroke={SKIN_SH} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      {hand === "R" ? (
        <g>
          <path d={`M${s.x + (e.x - s.x) * 0.3} ${s.y + (e.y - s.y) * 0.3} L${s.x + (e.x - s.x) * 0.72} ${s.y + (e.y - s.y) * 0.72}`} stroke="#2b5f8a" strokeWidth={13} strokeLinecap="round" opacity={0.9} />
          <circle cx={s.x + (e.x - s.x) * 0.5} cy={s.y + (e.y - s.y) * 0.5} r={5} fill="#e23b4e" />
        </g>
      ) : null}
      {/* wristband + fist */}
      <circle cx={e.x + (h.x - e.x) * 0.8} cy={e.y + (h.y - e.y) * 0.8} r={17} fill={BAND} stroke={INK} strokeWidth={5} />
      <circle cx={h.x} cy={h.y} r={22} fill={SKIN} {...o} />
      <path d={`M${h.x - 12} ${h.y - 6} Q${h.x} ${h.y - 14} ${h.x + 12} ${h.y - 6}`} fill="none" stroke={SKIN_SH} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

/* ======================================================================= */
/* Crowd, sparks, effects                                                   */
/* ======================================================================= */
const Crowd: React.FC<{ t: number; beat: number; hype: number; accent: string }> = ({ t, beat, hype, accent }) => (
  <g>
    {Array.from({ length: 16 }, (_, i) => {
      const x = -160 + i * 88 + (i % 2) * 20;
      const phase = (beat + (i % 3) * 0.12) % 1;
      const jump = hype * 20 * Math.pow(Math.cos(Math.PI * phase), 2);
      const y = 935 - jump + (i % 2) * 24;
      const horns = hype > 0.6 && i % 3 === 0;
      return (
        <g key={i} fill="#08060e">
          <ellipse cx={x} cy={y + 95} rx={60} ry={82} />
          <circle cx={x} cy={y} r={42} />
          <path d={`M${x - 30} ${y - 30} Q${x} ${y - 52} ${x + 30} ${y - 30}`} fill="none" stroke={accent} strokeWidth={3} opacity={0.35} />
          {horns ? (
            <g>
              <path d={`M${x + 32} ${y + 30} L${x + 62} ${y - 72 - jump}`} stroke="#08060e" strokeWidth={22} strokeLinecap="round" />
              <path d={`M${x + 54} ${y - 68 - jump} l-8 -30 M${x + 68} ${y - 68 - jump} l8 -30`} stroke="#08060e" strokeWidth={10} strokeLinecap="round" />
            </g>
          ) : null}
          {i % 5 === 2 && hype > 0.3 ? (
            <g>
              <rect x={x - 72} y={y - 44} width={24} height={38} rx={4} fill="#0e0b16" stroke={accent} strokeWidth={2} />
              <rect x={x - 68} y={y - 40} width={16} height={26} fill={accent} opacity={0.75 + Math.sin(t * 3 + i) * 0.25} />
            </g>
          ) : null}
        </g>
      );
    })}
  </g>
);

const Spark: React.FC<{ x: number; y: number; amt: number; color: string; big?: boolean }> = ({ x, y, amt, color, big }) =>
  amt > 0.08 ? (
    <g transform={`translate(${x},${y})`} opacity={amt}>
      {Array.from({ length: big ? 10 : 6 }, (_, i) => {
        const a = (i / (big ? 10 : 6)) * Math.PI * 2 + 0.3;
        const r1 = (big ? 40 : 24) * (1.4 - amt);
        const r2 = r1 + (big ? 54 : 28) * amt;
        return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1 * 0.6} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2 * 0.6} stroke={color} strokeWidth={big ? 9 : 6} strokeLinecap="round" />;
      })}
    </g>
  ) : null;

const SpeedLines: React.FC<{ t: number; amt: number }> = ({ t, amt }) =>
  amt > 0 ? (
    <g opacity={amt * 0.55}>
      {Array.from({ length: 40 }, (_, i) => {
        const a = (i / 40) * Math.PI * 2 + Math.floor(t * 15) * 0.37;
        const r1 = 520 + ((i * 53) % 200);
        return <line key={i} x1={500 + Math.cos(a) * r1} y1={420 + Math.sin(a) * r1} x2={500 + Math.cos(a) * 1600} y2={420 + Math.sin(a) * 1600} stroke="white" strokeWidth={6 + (i % 3) * 4} />;
      })}
    </g>
  ) : null;

const Stars: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g>
    {[0, 1, 2].map((i) => {
      const a = t * 6 + (i * Math.PI * 2) / 3;
      return (
        <text key={i} x={x + Math.cos(a) * 110} y={y + Math.sin(a) * 26} fontSize={46} textAnchor="middle" fill="#ffd34d" stroke={INK} strokeWidth={3} paintOrder="stroke">
          ★
        </text>
      );
    })}
  </g>
);

/* ======================================================================= */
/* Full scene                                                               */
/* ======================================================================= */
export const DrumScene2D: React.FC<Props> = ({ perf, now, t, accent, mood, crowdHype, gags = {} }) => {
  const kick = pieceImp(perf, "kick", now, 0.1);
  const crashS = cymbalState(perf, "crash", now);
  const crash2S = cymbalState(perf, "crash2", now);
  const rideS = cymbalState(perf, "ride", now);
  const chinaS = cymbalState(perf, "china", now);
  const hh = cymbalState(perf, "hihat", now);
  const crashAmt = Math.max(crashS.glow, chinaS.glow, crash2S.glow);

  const beatLen = perf ? 60 / perf.bpm : 0.6;
  const fast = !!perf && perf.bpm > 140;
  const period = fast ? beatLen * 2 : beatLen;
  const phaseAt = (x: number) => (perf ? ((((x - perf.countIn) / period) % 1) + 1) % 1 : (x * 0.6) % 1);
  const beatPhase = phaseAt(now);
  const playing = !!perf && now >= perf.countIn && now < perf.duration - 1.5;
  const bangAmt = playing ? (mood === "beast" ? 1 : mood === "focus" ? 0.55 : 0.35) : 0.1;
  const bangAt = (x: number) => bangAmt * Math.pow(Math.cos(Math.PI * phaseAt(x)), 2);
  const bang = bangAt(now);
  const lag = bangAt(now - 0.09) - bang; // follow-through for the headband tails

  // ---- gag states ----
  const inYawn = gags.yawn && now >= gags.yawn[0] && now < gags.yawn[1];
  const inHype = gags.hype && now >= gags.hype[0] && now < gags.hype[1];
  const twirl = gags.twirlAt !== undefined && now >= gags.twirlAt ? now - gags.twirlAt : -1;
  const toss = gags.tossAt !== undefined && now >= gags.tossAt ? now - gags.tossAt : -1;
  const ripped = gags.ripAt !== undefined && now >= gags.ripAt ? now - gags.ripAt : 0;
  const flyC = gags.cymbalFlyAt !== undefined && now >= gags.cymbalFlyAt ? now - gags.cymbalFlyAt : -1;
  const fall = gags.throneBreakAt !== undefined && now >= gags.throneBreakAt ? now - gags.throneBreakAt : -1;
  const bonked = toss >= 1.0;
  const fallen = fall >= 0;

  let face: Face = mood === "victory" ? "victory" : mood === "idle" ? "idle" : mood;
  if (inYawn) face = "yawn";
  if (inHype) face = "scream";
  if (twirl >= 0) face = "smug";
  if (toss >= 0) face = bonked ? (toss < 2.6 ? "ow" : "victory") : "focus";
  if (fallen) face = "ow";
  const scream = face === "beast" ? crashAmt : 0;

  // ---- sticks ----
  const tipR = tip2d(perf, "R", now);
  const tipL = tip2d(perf, "L", now);
  const handR = hand2d(tipR, "R");
  const handL = hand2d(tipL, "L");
  const ghosts = (hand: "R" | "L", tipNow: P2) => {
    const out: { from: P2; to: P2 }[] = [];
    for (let k = 1; k <= 3; k++) {
      const tp = tip2d(perf, hand, now - k / 90);
      const speed = Math.hypot(tp.x - tipNow.x, tp.y - tipNow.y) / k;
      if (speed < 9) break;
      const hp = hand2d(tp, hand);
      out.push({ from: hp, to: tp });
    }
    return out;
  };
  const stickFor = (hand: "R" | "L", h: P2, tip: P2) => {
    // twirl: stick spins around the fist
    if (twirl >= 0) {
      const a = twirl * Math.PI * 2 * 2.2 + (hand === "R" ? 0 : 1.2);
      const r = 75;
      return <StickArt from={{ x: h.x - Math.cos(a) * r, y: h.y - Math.sin(a) * r }} to={{ x: h.x + Math.cos(a) * r, y: h.y + Math.sin(a) * r }} />;
    }
    if (hand === "R" && toss >= 0) return null; // R stick is in the air
    const end = { x: h.x + (h.x - tip.x) * 0.25, y: h.y + (h.y - tip.y) * 0.25 };
    return <StickArt from={end} to={tip} ghosts={ghosts(hand, tip)} />;
  };

  // thrown stick: hand -> peak -> lands on head (t=1.0) -> bounces away
  let thrown: React.ReactNode = null;
  if (toss >= 0) {
    const g = 1400;
    const start = { x: 470, y: 470 };
    const headTop = { x: 500, y: 180 };
    let x: number;
    let y: number;
    let rot: number;
    if (toss < 1.0) {
      const v0 = start.y - headTop.y + 0.5 * g;
      x = start.x + (headTop.x - start.x) * toss;
      y = start.y - v0 * toss + 0.5 * g * toss * toss;
      rot = toss * 1080;
    } else {
      const d = toss - 1.0;
      x = headTop.x + 380 * d;
      y = headTop.y - 420 * d + 0.5 * 1800 * d * d;
      rot = 1080 + d * 720;
    }
    if (y < 1300) {
      thrown = (
        <g transform={`translate(${x},${y}) rotate(${rot})`}>
          <StickArt from={{ x: -80, y: 0 }} to={{ x: 80, y: 0 }} />
        </g>
      );
    }
  }

  // body offset: headbang squash, or falling off the broken stool
  const fallY = fallen ? easeOut(fall / 0.45) * 330 : 0;
  const fallRot = fallen ? easeOut(fall / 0.45) * -18 : 0;
  const breathe = Math.sin(t * 2) * 2;

  const drumImp = (piece: Piece) => pieceImp(perf, piece, now);
  const sparkFor = (piece: Piece, big = false) => {
    if (!perf) return null;
    const h = lastHit(perf.byPiece[piece], now);
    if (!h) return null;
    const dt = now - h.t;
    if (dt > 0.18) return null;
    const p = STRIKE[piece];
    return <Spark key={piece} x={p.x} y={p.y} amt={(1 - dt / 0.18) * (h.v / 127)} color={big ? "#fff2a8" : "white"} big={big} />;
  };
  const kickPress = 1 - beaterAngle(perf, "RF", now) / -0.75;
  const speed = gags.speedLines && now >= gags.speedLines[0] && now < gags.speedLines[1] ? 1 : 0;

  // flying cymbal (crash2) after the final hit
  const c2 = { x: STRIKE.crash2.x, y: STRIKE.crash2.y - 6, rot: -8 + crash2S.wob };
  if (flyC >= 0) {
    c2.x -= 900 * flyC;
    c2.y += -1100 * flyC + 0.5 * 1600 * flyC * flyC;
    c2.rot += flyC * 900;
  }

  return (
    <g>
      <Defs accent={accent} />
      <Backdrop accent={accent} t={t} kick={kick} crash={crashAmt} mood={mood} hype={crowdHype} />
      <SpeedLines t={t} amt={speed} />

      {/* back cymbals */}
      <Stand x={STRIKE.china.x} y1={STRIKE.china.y} y2={780} />
      <g transform={`translate(${STRIKE.china.x},${STRIKE.china.y}) rotate(${-14 + chinaS.wob})`}>
        <CymbalShape rx={95} glow={chinaS.glow} china />
      </g>
      <Stand x={STRIKE.crash2.x} y1={STRIKE.crash2.y} y2={780} />
      {c2.y < 1400 ? (
        <g transform={`translate(${c2.x},${c2.y}) rotate(${c2.rot})`}>
          <CymbalShape rx={110} glow={crash2S.glow} />
        </g>
      ) : null}

      {/* drummer body (behind the kit) */}
      <g transform={`translate(0, ${bang * 14 + breathe + fallY}) rotate(${fallRot}, 500, 640)`}>
        {/* torso with cel shading + print */}
        <path d="M404 660 Q394 430 438 378 H562 Q606 430 596 660 Z" fill={SHIRT} {...o} />
        <path d="M540 384 Q590 440 590 660 H560 Q566 470 520 388Z" fill={SHIRT_SH} />
        <path d="M452 382 Q500 422 548 382" fill="none" stroke={SKIN} strokeWidth={18} />
        <path d="M486 470 L516 470 L500 506 L526 506 L480 572 L492 524 L468 524 Z" fill={accent} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <g transform={`translate(500, ${282 + bang * 28}) rotate(${Math.sin(t * 1.7) * 3 + bang * 5 + (fallen ? -25 : 0)})`}>
          <HeadArt face={face} fly={bang * (mood === "beast" ? 26 : 10)} t={t} lag={lag} scream={scream} />
        </g>
      </g>

      {/* kit */}
      <Stand x={STRIKE.ride.x} y1={STRIKE.ride.y} y2={780} />
      <g transform={`translate(${STRIKE.ride.x},${STRIKE.ride.y + 6}) rotate(${10 + rideS.wob})`}>
        <CymbalShape rx={128} glow={rideS.glow} />
      </g>
      <Drum2D x={262} y={580} rx={98} ry={26} h={150} imp={drumImp("floor")} />
      <g transform={`translate(500, 700) scale(${1 + kick * 0.045})`}>
        <circle r={152} fill="url(#shell)" {...o} />
        <circle r={132} fill="#141118" {...o} strokeWidth={5} />
        <circle r={132} fill="none" stroke={CHROME} strokeWidth={4} />
        <circle r={84} fill="none" stroke={accent} strokeWidth={10} opacity={0.6 + kick * 0.4} />
        <path d="M-10 -64 L26 -64 L6 -8 L40 -8 L-20 72 L-4 12 L-38 12 Z" fill={accent} stroke={INK} strokeWidth={5} strokeLinejoin="round" opacity={0.75 + kick * 0.25} />
        <path d="M-120 -60 A132 132 0 0 1 -40 -126" fill="none" stroke="white" strokeWidth={5} opacity={0.35} strokeLinecap="round" />
      </g>
      <rect x={480} y={842 - kickPress * 6} width={40} height={14} rx={5} fill={CHROME} {...o} strokeWidth={4} />
      <Drum2D x={428} y={492} rx={66} ry={19} h={64} imp={drumImp("tom2")} tilt={-6} />
      <Drum2D x={572} y={492} rx={62} ry={18} h={58} imp={drumImp("tom1")} tilt={6} />
      <Drum2D x={640} y={555} rx={84} ry={22} h={46} imp={drumImp("snare")} ripped={ripped} />
      {/* hi-hat */}
      <Stand x={790} y1={460} y2={780} />
      <g transform="translate(790, 472)">
        <CymbalShape rx={92} glow={0} />
      </g>
      <g transform={`translate(790, ${458 - (perf && lastHit(perf.hhOpen, now)?.i === "hho" ? 14 : 2)}) rotate(${hh.wob * 0.5})`}>
        <CymbalShape rx={92} glow={hh.glow * 0.6} />
      </g>
      <Stand x={STRIKE.crash.x} y1={STRIKE.crash.y} y2={780} />
      <g transform={`translate(${STRIKE.crash.x},${STRIKE.crash.y}) rotate(${9 + crashS.wob})`}>
        <CymbalShape rx={118} glow={crashS.glow} />
      </g>

      {/* arms + sticks (in front of the kit) */}
      {!fallen ? (
        <g transform={`translate(0, ${bang * 8 + breathe})`}>
          <ArmArt hand="L" h={handL} />
          {stickFor("L", handL, tipL)}
          <ArmArt hand="R" h={handR} />
          {stickFor("R", handR, tipR)}
        </g>
      ) : (
        // fell off the stool: sneakers sticking up over the kit + sticks flying away
        <g>
          {[-1, 1].map((sd) => {
            const up = easeOut((fall - 0.25) / 0.35);
            const wig = Math.sin(fall * 14 + sd) * 6 * clamp01(fall - 0.6);
            return (
              <g key={sd} transform={`translate(${500 + sd * 70}, ${640 - up * 150}) rotate(${sd * 18 + wig})`}>
                <rect x={-20} y={0} width={40} height={140} rx={16} fill="#2b3a66" {...o} />
                <path d="M-34 -6 Q-36 -46 0 -46 Q40 -46 40 -6 Z" fill="white" {...o} />
                <path d="M-34 -10 H40" stroke={BAND} strokeWidth={8} />
              </g>
            );
          })}
          {[0, 1].map((i) => {
            const d = fall;
            const x = 500 + (i ? 1 : -1) * (160 + 360 * d);
            const y = 420 - 900 * d + 0.5 * 1700 * d * d;
            return y < 1300 ? (
              <g key={i} transform={`translate(${x},${y}) rotate(${d * 900 * (i ? 1 : -1)})`}>
                <StickArt from={{ x: -80, y: 0 }} to={{ x: 80, y: 0 }} />
              </g>
            ) : null;
          })}
          {/* dust cloud */}
          {Array.from({ length: 9 }, (_, i) => {
            const k = clamp01(fall / 0.9);
            const a = (i / 9) * Math.PI;
            return (
              <circle
                key={`d${i}`}
                cx={500 + Math.cos(a) * (120 + 260 * k)}
                cy={760 - Math.sin(a) * 70 * k}
                r={40 + 50 * k}
                fill="#cfc6dd"
                stroke={INK}
                strokeWidth={4}
                opacity={(1 - k) * 0.9}
              />
            );
          })}
        </g>
      )}

      {thrown}
      {bonked && toss < 3 ? <Stars x={500} y={150} t={t} /> : null}

      {(["snare", "tom1", "tom2", "floor", "hihat", "ride"] as Piece[]).map((pc) => sparkFor(pc))}
      {(["crash", "crash2", "china"] as Piece[]).map((pc) => sparkFor(pc, true))}

      <Crowd t={t} beat={beatPhase} hype={crowdHype} accent={accent} />
    </g>
  );
};
