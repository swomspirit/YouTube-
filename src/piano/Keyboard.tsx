import { LH_COLOR, RH_COLOR, type Note } from "./notes";

export const LOWEST = 21; // A0
export const HIGHEST = 108; // C8
const BLACK = new Set([1, 3, 6, 8, 10]);
export const isBlack = (m: number) => BLACK.has(m % 12);

/** Horizontal layout of all 88 keys for a given total width. */
export const keyLayout = (width: number) => {
  let whites = 0;
  for (let m = LOWEST; m <= HIGHEST; m++) if (!isBlack(m)) whites++;
  const W = width / whites;
  const BW = W * 0.6;
  const keys = new Map<number, { x: number; w: number; black: boolean }>();
  let wi = 0;
  for (let m = LOWEST; m <= HIGHEST; m++) {
    if (isBlack(m)) {
      keys.set(m, { x: wi * W - BW / 2, w: BW, black: true });
    } else {
      keys.set(m, { x: wi * W, w: W, black: false });
      wi++;
    }
  }
  return { keys, W, BW };
};

export const Keyboard: React.FC<{
  y: number;
  width: number;
  height: number;
  active: Note[];
}> = ({ y, width, height, active }) => {
  const { keys } = keyLayout(width);
  const pressed = new Map<number, "L" | "R">();
  for (const n of active) pressed.set(n.m, n.h);
  const color = (m: number) => (pressed.get(m) === "L" ? LH_COLOR : RH_COLOR);
  const whites = [...keys.entries()].filter(([, k]) => !k.black);
  const blacks = [...keys.entries()].filter(([, k]) => k.black);
  return (
    <g transform={`translate(0,${y})`}>
      <rect x={0} y={-8} width={width} height={10} fill="#7a1f2b" />
      {whites.map(([m, k]) => (
        <rect
          key={m}
          x={k.x + 0.5}
          y={0}
          width={k.w - 1}
          height={height}
          rx={4}
          fill={pressed.has(m) ? color(m) : "#f7f5f0"}
          stroke="#1c1b22"
          strokeWidth={1.5}
        />
      ))}
      {blacks.map(([m, k]) => (
        <rect
          key={m}
          x={k.x}
          y={0}
          width={k.w}
          height={height * 0.62}
          rx={3}
          fill={pressed.has(m) ? color(m) : "#1c1b22"}
          stroke="#0d0d12"
          strokeWidth={1.5}
        />
      ))}
    </g>
  );
};
