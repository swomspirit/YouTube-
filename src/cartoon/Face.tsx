import { INK } from "./style";

export type EyeState = "open" | "closed" | "focus" | "x" | "wide" | "half";
export type BrowState = "none" | "angry" | "worried" | "raised";

/** Dot-eye cartoon face. Coordinates are relative to the face center. */
export const Face: React.FC<{
  eyes?: EyeState;
  look?: number; // -1..1 horizontal eye direction
  brows?: BrowState;
  mouthOpen?: number; // 0..1
  tongue?: boolean;
  blush?: boolean;
  spacing?: number;
}> = ({ eyes = "open", look = 0, brows = "none", mouthOpen = 0, tongue = false, blush = false, spacing = 52 }) => {
  const lx = look * 14;
  const eye = (cx: number) => {
    const x = cx + lx;
    switch (eyes) {
      case "open":
        return <ellipse cx={x} cy={0} rx={10} ry={17} fill={INK} />;
      case "wide":
        return (
          <g>
            <circle cx={x} cy={0} r={22} fill="white" stroke={INK} strokeWidth={5} />
            <circle cx={x} cy={0} r={8} fill={INK} />
          </g>
        );
      case "half":
        return <rect x={x - 13} y={-2} width={26} height={8} rx={4} fill={INK} />;
      case "closed":
        return <path d={`M${x - 16} 0 Q${x} 12 ${x + 16} 0`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      case "focus": {
        // squeezed "> <" eyes
        const dir = cx < 0 ? 1 : -1;
        return (
          <path
            d={`M${x - 14 * dir} -12 L${x + 10 * dir} 0 L${x - 14 * dir} 12`}
            fill="none"
            stroke={INK}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      }
      case "x":
        return (
          <g stroke={INK} strokeWidth={6} strokeLinecap="round">
            <line x1={x - 12} y1={-12} x2={x + 12} y2={12} />
            <line x1={x + 12} y1={-12} x2={x - 12} y2={12} />
          </g>
        );
    }
  };

  const brow = (cx: number) => {
    const s = cx < 0 ? 1 : -1; // inner side
    if (brows === "none") return null;
    const y = -34;
    const d =
      brows === "angry"
        ? `M${cx - 18 * s} ${y - 8} L${cx + 16 * s} ${y + 6}`
        : brows === "worried"
          ? `M${cx - 18 * s} ${y + 6} L${cx + 16 * s} ${y - 8}`
          : `M${cx - 16} ${y - 6} Q${cx} ${y - 14} ${cx + 16} ${y - 6}`;
    return <path d={d} stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />;
  };

  const mh = 4 + mouthOpen * 26;
  return (
    <g>
      {blush ? (
        <>
          <ellipse cx={-spacing - 18} cy={30} rx={18} ry={9} fill="#f29b9b" opacity={0.6} />
          <ellipse cx={spacing + 18} cy={30} rx={18} ry={9} fill="#f29b9b" opacity={0.6} />
        </>
      ) : null}
      {eye(-spacing)}
      {eye(spacing)}
      {brow(-spacing)}
      {brow(spacing)}
      <g transform={`translate(${lx * 0.5}, 52)`}>
        {mouthOpen > 0.05 ? (
          <ellipse cx={0} cy={0} rx={14 + mouthOpen * 6} ry={mh / 2} fill="#5a2230" stroke={INK} strokeWidth={5} />
        ) : (
          <path d="M-12 0 Q0 6 12 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        )}
        {tongue ? <path d="M4 2 q8 18 18 4" fill="#e8737f" stroke={INK} strokeWidth={4} /> : null}
      </g>
    </g>
  );
};
