import { PIECE, upperBound, type Piece, type PreparedPerformance } from "./hits";
import { PIECE_COLOR } from "./kit";

const LANES: { label: string; pieces: Piece[]; color: string }[] = [
  { label: "CRASH", pieces: ["crash", "crash2", "china"], color: PIECE_COLOR.crash },
  { label: "RIDE", pieces: ["ride"], color: PIECE_COLOR.ride },
  { label: "HI-HAT", pieces: ["hihat"], color: PIECE_COLOR.hihat },
  { label: "TOM 1", pieces: ["tom1"], color: PIECE_COLOR.tom1 },
  { label: "TOM 2", pieces: ["tom2"], color: PIECE_COLOR.tom2 },
  { label: "FLOOR", pieces: ["floor"], color: PIECE_COLOR.floor },
  { label: "SNARE", pieces: ["snare"], color: PIECE_COLOR.snare },
  { label: "KICK", pieces: ["kick"], color: PIECE_COLOR.kick },
];
const laneOf = (p: Piece) => LANES.findIndex((l) => l.pieces.includes(p));

/** Scrolling note lane at the bottom of the screen. Hits travel right -> left into the hit line. */
export const Highway: React.FC<{ perf: PreparedPerformance | null; now: number; accent: string; ahead: number; W?: number; H0?: number; top?: number; laneH?: number }> = ({
  perf, now, accent, ahead, W = 1920, H0 = 1080, top = 838, laneH = 26,
}) => {
  const labelW = 150;
  const hitX = 250;
  const pps = (W - hitX - 40) / ahead;
  const H = LANES.length * laneH;

  const notes: React.ReactNode[] = [];
  const flashes: number[] = LANES.map(() => 0);
  if (perf) {
    const a = upperBound(perf.all.times, now - 0.25);
    const b = upperBound(perf.all.times, now + ahead);
    for (let k = a; k < b; k++) {
      const h = perf.all.hits[k];
      const lane = laneOf(PIECE[h.i]);
      const dt = h.t - now;
      if (dt <= 0) {
        flashes[lane] = Math.max(flashes[lane], (1 + dt / 0.25) * (h.v / 127));
        continue;
      }
      const x = hitX + dt * pps;
      const y = top + lane * laneH + laneH / 2;
      const ghost = h.v < 60;
      const isKick = h.i === "kick";
      notes.push(
        isKick ? (
          <rect key={k} x={x - 5} y={y - 9} width={10} height={18} rx={3} fill={LANES[lane].color} opacity={0.95} />
        ) : (
          <circle key={k} cx={x} cy={y} r={ghost ? 5 : h.v > 110 ? 10 : 8} fill={ghost ? "none" : LANES[lane].color} stroke={LANES[lane].color} strokeWidth={ghost ? 2.5 : 0} />
        ),
      );
    }
  }
  // beat lines
  const beatLines: React.ReactNode[] = [];
  if (perf) {
    const beat = 60 / perf.bpm;
    const first = Math.ceil(now / beat) * beat;
    for (let bt = first; bt < now + ahead; bt += beat) {
      const barLine = Math.abs(((bt / beat) % 4)) < 0.01;
      beatLines.push(<line key={bt} x1={hitX + (bt - now) * pps} x2={hitX + (bt - now) * pps} y1={top} y2={top + H} stroke="white" strokeOpacity={barLine ? 0.18 : 0.07} strokeWidth={barLine ? 2 : 1} />);
    }
  }

  return (
    <svg width={W} height={H0} viewBox={`0 0 ${W} ${H0}`} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="hw-bg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#07060c" stopOpacity="0.92" />
          <stop offset="0.85" stopColor="#07060c" stopOpacity="0.75" />
          <stop offset="1" stopColor="#07060c" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect x={0} y={top - 10} width={W} height={H + 20} fill="url(#hw-bg)" />
      {LANES.map((l, i) => (
        <g key={l.label}>
          <rect x={labelW} y={top + i * laneH + 1} width={W - labelW} height={laneH - 2} fill={l.color} opacity={0.04 + flashes[i] * 0.25} />
          <text x={20} y={top + i * laneH + 18} fontSize={15} fontWeight={800} fill={l.color} fontFamily="Inter, Helvetica, Arial" letterSpacing={1.5}>
            {l.label}
          </text>
        </g>
      ))}
      {beatLines}
      {notes}
      <rect x={hitX - 3} y={top - 6} width={6} height={H + 12} rx={3} fill={accent} />
      {LANES.map((l, i) =>
        flashes[i] > 0 ? (
          <circle key={i} cx={hitX} cy={top + i * laneH + laneH / 2} r={8 + flashes[i] * 10} fill={l.color} opacity={flashes[i]} />
        ) : null,
      )}
    </svg>
  );
};
