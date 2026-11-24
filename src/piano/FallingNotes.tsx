import { keyLayout } from "./Keyboard";
import { LH_COLOR, RH_COLOR, upperBound, type PreparedSong } from "./notes";

/** Synthesia-style falling notes that land on the keyboard at y = top + height. */
export const FallingNotes: React.FC<{
  song: PreparedSong | null;
  now: number;
  top: number;
  height: number;
  width: number;
  lookahead: number; // seconds visible above the keys
}> = ({ song, now, top, height, width, lookahead }) => {
  const { keys } = keyLayout(width);
  const pps = height / lookahead;
  const hitY = top + height;
  const lines = [];
  for (let m = 24; m <= 108; m += 12) {
    const k = keys.get(m)!;
    lines.push(<line key={m} x1={k.x} x2={k.x} y1={top} y2={hitY} stroke="rgba(255,255,255,0.06)" strokeWidth={2} />);
  }
  const bars: React.ReactNode[] = [];
  if (song) {
    const from = upperBound(song.starts, now - song.maxDur);
    const to = upperBound(song.starts, now + lookahead);
    for (let i = from; i < to; i++) {
      const n = song.notes[i];
      if (n.t + n.d < now) continue;
      const k = keys.get(n.m);
      if (!k) continue;
      const yBottom = hitY - (n.t - now) * pps;
      const yTop = yBottom - n.d * pps;
      const y1 = Math.max(top, yTop);
      const y2 = Math.min(hitY, yBottom);
      if (y2 <= y1) continue;
      const c = n.h === "L" ? LH_COLOR : RH_COLOR;
      const inset = k.black ? 0 : 3;
      bars.push(
        <rect
          key={i}
          x={k.x + inset}
          y={y1}
          width={k.w - inset * 2}
          height={y2 - y1}
          rx={6}
          fill={c}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth={2}
          opacity={k.black ? 0.95 : 0.88}
        />,
      );
    }
  }
  return (
    <g>
      <rect x={0} y={top} width={width} height={height} fill="#0e0d16" />
      {lines}
      {bars}
      <rect x={0} y={hitY - 3} width={width} height={3} fill="rgba(255,255,255,0.25)" />
    </g>
  );
};
