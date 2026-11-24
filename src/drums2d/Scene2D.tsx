import { impulse, lastHit, type Piece, type PreparedPerformance } from "../drums/hits";
import { beaterAngle } from "../drums/sticks";
import { SHOULDER, STRIKE } from "./layout";
import { elbow2d, hand2d, tip2d } from "./pose2d";

/*
 * Flat 2D cartoon drum scene: thick outlines, flat colours, chibi drummer.
 * Original character. Local coordinates ~1000 x 900; the camera transform is applied outside.
 */
const INK = "#16141c";
const LW = 7;
const SKIN = "#f2c49b";
const SHELL = "#d1283d";
const SHELL_DARK = "#9e1b2e";
const HEAD = "#f4efe2";
const BRONZE = "#f0be4a";
const BRONZE_DARK = "#c98f25";
const CHROME = "#c9ced6";
const o = { stroke: INK, strokeWidth: LW, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export type Mood = "idle" | "chill" | "focus" | "beast" | "victory";

type Props = { perf: PreparedPerformance | null; now: number; t: number; accent: string; mood: Mood; crowdHype: number };

const pieceImp = (p: PreparedPerformance | null, piece: Piece, now: number, tau = 0.09) => (p ? impulse(p.byPiece[piece], now, tau) : 0);

/* ---------------- background ---------------- */
const Backdrop: React.FC<{ accent: string; t: number; kick: number; crash: number; mood: Mood }> = ({ accent, t, kick, crash, mood }) => (
  <g>
    <rect x={-1200} y={-900} width={3400} height={2700} fill="#1a1430" />
    {/* big glow disc behind the drummer */}
    <circle cx={500} cy={360} r={330 + kick * 18} fill={accent} opacity={0.18 + kick * 0.12} />
    <circle cx={500} cy={360} r={250 + kick * 12} fill={accent} opacity={0.18 + kick * 0.1} />
    {/* speaker stacks */}
    {[-230, 1050].map((x) => (
      <g key={x}>
        {[0, 1, 2].map((r) => (
          <g key={r}>
            <rect x={x} y={290 + r * 160} width={180} height={150} rx={10} fill="#221d33" {...o} />
            <circle cx={x + 90} cy={365 + r * 160} r={50 + (r === 1 ? kick * 6 : 0)} fill="#0f0c18" {...o} />
            <circle cx={x + 90} cy={365 + r * 160} r={16} fill="#3a3352" />
          </g>
        ))}
      </g>
    ))}
    {/* spotlights */}
    {[-1, 1].map((sd, i) => {
      const a = Math.sin(t * (mood === "beast" ? 1.6 : 0.7) + i * 2) * 14 + sd * 22;
      return (
        <g key={sd} transform={`translate(${500 + sd * 420}, -200) rotate(${a})`}>
          <path d="M-30 0 L30 0 L240 1100 L-240 1100 Z" fill={accent} opacity={0.07 + crash * 0.12} />
        </g>
      );
    })}
    {/* riser */}
    <rect x={-300} y={760} width={1600} height={400} fill="#2b2340" />
    <rect x={-300} y={760} width={1600} height={16} fill="#3d3359" />
    <ellipse cx={500} cy={790} rx={470} ry={50} fill="#1f1830" />
  </g>
);

/* ---------------- drums ---------------- */
const Drum2D: React.FC<{ x: number; y: number; rx: number; ry: number; h: number; imp: number; tilt?: number }> = ({ x, y, rx, ry, h, imp, tilt = 0 }) => {
  const sq = 1 - imp * 0.08;
  return (
    <g transform={`translate(${x},${y}) rotate(${tilt}) scale(${1 + imp * 0.05},${sq})`}>
      <path d={`M${-rx} 0 V${h} A${rx} ${ry} 0 0 0 ${rx} ${h} V0`} fill={SHELL} {...o} />
      <path d={`M${-rx * 0.55} ${ry * 0.6} V${h + ry * 0.8}`} stroke={SHELL_DARK} strokeWidth={10} opacity={0.5} />
      <rect x={-rx} y={h * 0.35} width={rx * 2} height={6} fill={CHROME} opacity={0.6} />
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={imp > 0.05 ? "#ffffff" : HEAD} {...o} />
      <ellipse cx={0} cy={0} rx={rx * 0.86} ry={ry * 0.72} fill="none" stroke="#d9d2c0" strokeWidth={3} />
    </g>
  );
};

const Cymbal2D: React.FC<{ x: number; y: number; rx: number; tilt: number; wob: number; glow: number; standTo: number; china?: boolean }> = ({
  x, y, rx, tilt, wob, glow, standTo, china,
}) => (
  <g>
    <line x1={x} y1={y} x2={x} y2={standTo} stroke={INK} strokeWidth={11} />
    <line x1={x} y1={y} x2={x} y2={standTo} stroke={CHROME} strokeWidth={5} />
    <g transform={`translate(${x},${y}) rotate(${tilt + wob})`}>
      <ellipse cx={0} cy={0} rx={rx} ry={rx * 0.16} fill={china ? "#e3a63c" : BRONZE} {...o} />
      <ellipse cx={0} cy={-2} rx={rx * 0.62} ry={rx * 0.09} fill="none" stroke={BRONZE_DARK} strokeWidth={3} />
      <ellipse cx={0} cy={-4} rx={rx * 0.16} ry={rx * 0.06} fill={BRONZE_DARK} stroke={INK} strokeWidth={4} />
      {glow > 0.05 ? <ellipse cx={0} cy={0} rx={rx * (1 + glow * 0.25)} ry={rx * 0.2 * (1 + glow)} fill="#fff6c8" opacity={glow * 0.6} /> : null}
    </g>
  </g>
);

const cymbalState = (p: PreparedPerformance | null, piece: Piece, now: number) => {
  const h = p ? lastHit(p.byPiece[piece], now) : null;
  if (!h) return { wob: 0, glow: 0 };
  const dt = now - h.t;
  const amp = (h.v / 127) * Math.exp(-dt / 0.55);
  return { wob: amp * 14 * Math.sin(dt * 2 * Math.PI * 3), glow: (h.v / 127) * Math.exp(-dt / 0.18) };
};

/* ---------------- drummer ---------------- */
const Head: React.FC<{ mood: Mood; bang: number; t: number; crash: number; scream: number }> = ({ mood, bang, t, crash, scream }) => {
  const eyes =
    mood === "beast" ? (
      <g>
        <path d="M-52 -6 L-22 4" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <path d="M52 -6 L22 4" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <ellipse cx={-36} cy={14} rx={8} ry={10} fill={INK} />
        <ellipse cx={36} cy={14} rx={8} ry={10} fill={INK} />
      </g>
    ) : mood === "focus" ? (
      <g>
        <path d="M-50 -4 L-24 0" stroke={INK} strokeWidth={7} strokeLinecap="round" />
        <path d="M50 -4 L24 0" stroke={INK} strokeWidth={7} strokeLinecap="round" />
        <ellipse cx={-36} cy={14} rx={8} ry={12} fill={INK} />
        <ellipse cx={36} cy={14} rx={8} ry={12} fill={INK} />
      </g>
    ) : mood === "chill" || mood === "victory" ? (
      <g>
        <path d="M-48 14 Q-36 2 -24 14" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
        <path d="M24 14 Q36 2 48 14" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      </g>
    ) : (
      <g>
        <ellipse cx={-36} cy={12} rx={8} ry={13} fill={INK} />
        <ellipse cx={36} cy={12} rx={8} ry={13} fill={INK} />
      </g>
    );
  const open = Math.max(scream, mood === "victory" ? 0.8 : 0);
  const mouth =
    open > 0.1 ? (
      <g>
        <path d={`M-26 46 Q0 ${46 + open * 50} 26 46 Z`} fill="#5b1a24" {...o} strokeWidth={6} />
        <path d="M-18 48 H18" stroke="white" strokeWidth={6} />
      </g>
    ) : mood === "beast" ? (
      <g>
        <rect x={-24} y={40} width={48} height={18} rx={6} fill="white" {...o} strokeWidth={5} />
        <line x1={-8} y1={40} x2={-8} y2={58} stroke={INK} strokeWidth={3} />
        <line x1={8} y1={40} x2={8} y2={58} stroke={INK} strokeWidth={3} />
      </g>
    ) : mood === "focus" ? (
      <path d="M-12 50 H12" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    ) : (
      <path d="M-18 44 Q0 60 18 44" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    );
  // hair flies up when banging hard
  const fly = bang * (mood === "beast" ? 26 : 10);
  const sweat =
    mood === "beast"
      ? [0, 1, 2].map((i) => {
          const p = (t * 1.4 + i * 0.33) % 1;
          return (
            <path
              key={i}
              d={`M${(i - 1) * 90 + (i === 1 ? 0 : (i - 1) * 20)} ${-60 + p * 90} q-9 14 0 20 q9 -6 0 -20z`}
              fill="#9fe3ff"
              stroke={INK}
              strokeWidth={3}
              opacity={1 - p}
            />
          );
        })
      : null;
  return (
    <g>
      {/* hair back */}
      <path d={`M-100 -10 Q-110 -110 0 -118 Q110 -110 100 -10 Q60 ${-60 - fly} 0 -60 Q-60 ${-60 - fly} -100 -10Z`} fill="#22202b" {...o} />
      <circle cx={0} cy={0} r={96} fill={SKIN} {...o} />
      <ellipse cx={-62} cy={34} rx={16} ry={9} fill="#f29a8f" opacity={0.55} />
      <ellipse cx={62} cy={34} rx={16} ry={9} fill="#f29a8f" opacity={0.55} />
      {eyes}
      {mouth}
      {/* spiky fringe */}
      <path
        d={`M-98 -18 L-80 ${-70 - fly} L-58 -40 L-36 ${-96 - fly} L-10 -46 L14 ${-100 - fly} L38 -46 L62 ${-88 - fly} L78 -40 L98 ${-62 - fly} L100 -16 Q60 -70 0 -62 Q-60 -70 -98 -18Z`}
        fill="#2b2836"
        {...o}
      />
      {/* headband */}
      <path d="M-96 -22 Q0 -70 96 -22" fill="none" stroke={INK} strokeWidth={22} />
      <path d="M-96 -22 Q0 -70 96 -22" fill="none" stroke="#e23b4e" strokeWidth={14} />
      {sweat}
      {crash > 0.4 && mood === "beast" ? (
        <g stroke={INK} strokeWidth={6} strokeLinecap="round">
          <line x1={-120} y1={-60} x2={-150} y2={-90} />
          <line x1={120} y1={-60} x2={150} y2={-90} />
          <line x1={0} y1={-130} x2={0} y2={-170} />
        </g>
      ) : null}
    </g>
  );
};

const Arm: React.FC<{ hand: "R" | "L"; tip: { x: number; y: number; lift: number }; front: boolean }> = ({ hand, tip }) => {
  const s = SHOULDER[hand];
  const h = hand2d(tip, hand);
  const e = elbow2d(s, h, 112, 104, hand === "R" ? -1 : 1);
  const stickEnd = { x: h.x + (h.x - tip.x) * 0.25, y: h.y + (h.y - tip.y) * 0.25 };
  return (
    <g>
      {/* stick */}
      <line x1={stickEnd.x} y1={stickEnd.y} x2={tip.x} y2={tip.y} stroke={INK} strokeWidth={15} strokeLinecap="round" />
      <line x1={stickEnd.x} y1={stickEnd.y} x2={tip.x} y2={tip.y} stroke="#e8c690" strokeWidth={8} strokeLinecap="round" />
      {/* arm */}
      <path d={`M${s.x} ${s.y} L${e.x} ${e.y} L${h.x} ${h.y}`} fill="none" stroke={INK} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${s.x} ${s.y} L${e.x} ${e.y} L${h.x} ${h.y}`} fill="none" stroke={SKIN} strokeWidth={27} strokeLinecap="round" strokeLinejoin="round" />
      {hand === "R" ? (
        <path d={`M${s.x + (e.x - s.x) * 0.3} ${s.y + (e.y - s.y) * 0.3} L${s.x + (e.x - s.x) * 0.7} ${s.y + (e.y - s.y) * 0.7}`} stroke="#2b5f8a" strokeWidth={14} strokeLinecap="round" opacity={0.85} />
      ) : null}
      {/* wristband */}
      <circle cx={e.x + (h.x - e.x) * 0.8} cy={e.y + (h.y - e.y) * 0.8} r={17} fill="#e23b4e" stroke={INK} strokeWidth={5} />
      <circle cx={h.x} cy={h.y} r={22} fill={SKIN} {...o} />
    </g>
  );
};

/* ---------------- crowd ---------------- */
const Crowd: React.FC<{ t: number; beat: number; hype: number; accent: string }> = ({ t, beat, hype, accent }) => (
  <g>
    {Array.from({ length: 16 }, (_, i) => {
      const x = -150 + i * 88 + (i % 2) * 20;
      const phase = (beat + (i % 3) * 0.12) % 1;
      const jump = hype * 18 * Math.pow(Math.cos(Math.PI * phase), 2);
      const y = 930 - jump + (i % 2) * 24;
      const horns = hype > 0.6 && i % 3 === 0;
      return (
        <g key={i} fill="#0b0912">
          <ellipse cx={x} cy={y + 90} rx={58} ry={80} />
          <circle cx={x} cy={y} r={40} />
          {horns ? (
            <g>
              <path d={`M${x + 30} ${y + 30} L${x + 60} ${y - 70 - jump}`} stroke="#0b0912" strokeWidth={22} strokeLinecap="round" />
              <path d={`M${x + 52} ${y - 66 - jump} l-8 -30 M${x + 66} ${y - 66 - jump} l8 -30`} stroke="#0b0912" strokeWidth={10} strokeLinecap="round" />
            </g>
          ) : null}
          {i % 5 === 2 && hype > 0.3 ? <rect x={x - 70} y={y - 40} width={22} height={36} rx={4} fill={accent} opacity={0.8 + Math.sin(t * 3 + i) * 0.2} /> : null}
        </g>
      );
    })}
  </g>
);

/* ---------------- hit sparks ---------------- */
const Spark: React.FC<{ x: number; y: number; amt: number; color: string; big?: boolean }> = ({ x, y, amt, color, big }) =>
  amt > 0.08 ? (
    <g transform={`translate(${x},${y})`} opacity={amt}>
      {Array.from({ length: big ? 10 : 6 }, (_, i) => {
        const a = (i / (big ? 10 : 6)) * Math.PI * 2 + 0.3;
        const r1 = (big ? 40 : 24) * (1.4 - amt);
        const r2 = r1 + (big ? 50 : 26) * amt;
        return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1 * 0.6} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2 * 0.6} stroke={color} strokeWidth={big ? 9 : 6} strokeLinecap="round" />;
      })}
    </g>
  ) : null;

/* ---------------- full scene ---------------- */
export const DrumScene2D: React.FC<Props> = ({ perf, now, t, accent, mood, crowdHype }) => {
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
  const beatPhase = perf ? ((((now - perf.countIn) / period) % 1) + 1) % 1 : (t * 0.6) % 1;
  const playing = !!perf && now >= perf.countIn && now < perf.duration - 1.5;
  const bangAmt = playing ? (mood === "beast" ? 1 : mood === "focus" ? 0.55 : 0.35) : 0.12;
  const bang = bangAmt * Math.pow(Math.cos(Math.PI * beatPhase), 2);
  const scream = mood === "beast" ? crashAmt : 0;

  const tipR = tip2d(perf, "R", now);
  const tipL = tip2d(perf, "L", now);
  const kickPress = 1 - beaterAngle(perf, "RF", now) / -0.75;

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

  return (
    <g>
      <Backdrop accent={accent} t={t} kick={kick} crash={crashAmt} mood={mood} />

      {/* cymbal stands behind */}
      <Cymbal2D x={STRIKE.china.x} y={STRIKE.china.y} rx={95} tilt={-14} wob={chinaS.wob} glow={chinaS.glow} standTo={780} china />
      <Cymbal2D x={STRIKE.crash2.x} y={STRIKE.crash2.y - 6} rx={110} tilt={-8} wob={crash2S.wob} glow={crash2S.glow} standTo={780} />

      {/* drummer body (behind the kit) */}
      <g transform={`translate(0, ${bang * 14})`}>
        <path d="M410 640 Q400 430 440 380 H560 Q600 430 590 640 Z" fill="#1d1b24" {...o} />
        <path d="M455 384 Q500 420 545 384" fill="none" stroke={SKIN} strokeWidth={18} />
        <text x={500} y={520} textAnchor="middle" fontSize={34} fontWeight={900} fill={accent} fontFamily="Arial Black, Arial">
          ★
        </text>
        <g transform={`translate(500, ${282 + bang * 26}) rotate(${Math.sin(t * 1.7) * 3 + bang * 4})`}>
          <Head mood={mood} bang={bang} t={t} crash={crashAmt} scream={scream} />
        </g>
      </g>

      {/* the kit */}
      <Cymbal2D x={STRIKE.ride.x} y={STRIKE.ride.y + 6} rx={128} tilt={10} wob={rideS.wob} glow={rideS.glow} standTo={780} />
      <Drum2D x={262} y={580} rx={98} ry={26} h={150} imp={drumImp("floor")} />
      <g transform={`translate(500, 700) scale(${1 + kick * 0.04})`}>
        <circle r={150} fill={SHELL} {...o} />
        <circle r={128} fill="#151219" {...o} strokeWidth={5} />
        <circle r={78} fill="none" stroke={accent} strokeWidth={10} opacity={0.6 + kick * 0.4} />
        <text y={14} textAnchor="middle" fontSize={40} fontWeight={900} fill={accent} fontFamily="Arial Black, Arial" opacity={0.7 + kick * 0.3}>
          BOOM
        </text>
      </g>
      {/* kick pedal beater peeking under the drum */}
      <rect x={480} y={840 - kickPress * 6} width={40} height={14} rx={5} fill={CHROME} {...o} strokeWidth={4} />
      <Drum2D x={428} y={492} rx={66} ry={19} h={64} imp={drumImp("tom2")} tilt={-6} />
      <Drum2D x={572} y={492} rx={62} ry={18} h={58} imp={drumImp("tom1")} tilt={6} />
      <Drum2D x={640} y={555} rx={84} ry={22} h={46} imp={drumImp("snare")} />
      {/* hi-hat */}
      <line x1={790} y1={460} x2={790} y2={780} stroke={INK} strokeWidth={11} />
      <line x1={790} y1={460} x2={790} y2={780} stroke={CHROME} strokeWidth={5} />
      <g transform={`translate(790, 470)`}>
        <ellipse cx={0} cy={0} rx={92} ry={14} fill={BRONZE} {...o} />
      </g>
      <g transform={`translate(790, ${458 - (perf && lastHit(perf.hhOpen, now)?.i === "hho" ? 14 : 2)}) rotate(${hh.wob * 0.5})`}>
        <ellipse cx={0} cy={0} rx={92} ry={14} fill={BRONZE} {...o} />
        <ellipse cx={0} cy={-3} rx={20} ry={6} fill={BRONZE_DARK} stroke={INK} strokeWidth={4} />
      </g>
      <Cymbal2D x={STRIKE.crash.x} y={STRIKE.crash.y} rx={118} tilt={9} wob={crashS.wob} glow={crashS.glow} standTo={780} />

      {/* arms + sticks in front */}
      <g transform={`translate(0, ${bang * 8})`}>
        <Arm hand="L" tip={tipL} front={false} />
        <Arm hand="R" tip={tipR} front />
      </g>

      {/* hit sparks */}
      {(["snare", "tom1", "tom2", "floor", "hihat", "ride"] as Piece[]).map((pc) => sparkFor(pc))}
      {(["crash", "crash2", "china"] as Piece[]).map((pc) => sparkFor(pc, true))}

      <Crowd t={t} beat={beatPhase} hype={crowdHype} accent={accent} />
    </g>
  );
};
