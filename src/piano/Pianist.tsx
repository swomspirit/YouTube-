const INK = "#1d1b26";
const SKIN = "#e9b994";
const SWEATER = "#3f6fb5";
const SWEATER_DARK = "#2f568f";
const PANTS = "#2c2c38";
const HAIR = "#3b2a20";

export type Mood = "idle" | "easy" | "medium" | "hard" | "victory";

/**
 * Side view of a pianist sitting at a keyboard edge located at about (735, 430)
 * in local coordinates, facing right. pressL / pressR are 0..1 key-press pulses.
 */
export const Pianist: React.FC<{ mood: Mood; pressL: number; pressR: number; t: number }> = ({ mood, pressL, pressR, t }) => {
  const playing = mood === "easy" || mood === "medium" || mood === "hard";
  const sway = playing ? Math.sin(t * (mood === "hard" ? 3.2 : 1.6)) * (mood === "hard" ? 4 : 3) : Math.sin(t * 0.8) * 1.5;
  const lean = mood === "hard" ? 10 : mood === "medium" ? 5 : 0;
  const bob = (pressL + pressR) * (mood === "hard" ? 4 : 2.5);
  const victory = mood === "victory";

  // shoulder + head positions
  const sx = 618 + lean + sway;
  const sy = 345 + bob * 0.5;
  const hx = 640 + lean * 1.3 + sway * 1.2;
  const hy = 268 + bob;

  // hands on the keys (or raised in victory)
  const handR = victory ? { x: sx + 8, y: 150 + Math.sin(t * 6) * 8 } : { x: 748, y: 418 + pressR * 10 };
  const handL = victory ? { x: sx - 60, y: 160 + Math.cos(t * 6) * 8 } : { x: 726, y: 420 + pressL * 10 };
  const elbow = (h: { x: number; y: number }, dx: number) =>
    victory ? { x: h.x - 40 + dx, y: (sy + h.y) / 2 } : { x: sx + 30 + dx, y: 425 };

  const arm = (h: { x: number; y: number }, dx: number, color: string) => {
    const e = elbow(h, dx);
    return (
      <g>
        <path d={`M${sx} ${sy} L${e.x} ${e.y} L${h.x - 12} ${h.y}`} fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${sx} ${sy} L${e.x} ${e.y} L${h.x - 12} ${h.y}`} fill="none" stroke={color} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx={h.x} cy={h.y} rx={17} ry={12} fill={SKIN} stroke={INK} strokeWidth={4} />
      </g>
    );
  };

  // face
  const eyeOpen = mood === "hard" ? 9 : mood === "easy" ? 2.5 : mood === "victory" ? 2.5 : 6;
  const blink = Math.floor(t * 10) % 37 === 0;
  const brow =
    mood === "hard" ? `M${hx + 14} ${hy - 26} L${hx + 40} ${hy - 18}` : mood === "medium" ? `M${hx + 16} ${hy - 22} L${hx + 40} ${hy - 20}` : `M${hx + 16} ${hy - 24} Q${hx + 28} ${hy - 30} ${hx + 40} ${hy - 24}`;
  const mouth =
    mood === "victory"
      ? <path d={`M${hx + 20} ${hy + 22} Q${hx + 34} ${hy + 40} ${hx + 46} ${hy + 20} Z`} fill="#7a2b35" stroke={INK} strokeWidth={4} />
      : mood === "hard"
        ? <path d={`M${hx + 24} ${hy + 28} L${hx + 44} ${hy + 26}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        : mood === "medium"
          ? <path d={`M${hx + 26} ${hy + 27} L${hx + 42} ${hy + 27}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
          : <path d={`M${hx + 22} ${hy + 24} Q${hx + 33} ${hy + 33} ${hx + 44} ${hy + 23}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;

  // sweat drops on hard
  const sweat =
    mood === "hard"
      ? [0, 1].map((i) => {
          const p = (t * 0.9 + i * 0.5) % 1;
          return (
            <path
              key={i}
              d={`M${hx - 18 + i * 14} ${hy - 30 + p * 60} q-7 12 0 16 q7 -4 0 -16z`}
              fill="#9fdcff"
              stroke={INK}
              strokeWidth={2.5}
              opacity={1 - p}
            />
          );
        })
      : null;

  return (
    <g>
      {/* bench */}
      <rect x={480} y={468} width={190} height={22} rx={6} fill="#5b3a29" stroke={INK} strokeWidth={4} />
      <rect x={495} y={490} width={14} height={105} fill="#4a2f21" stroke={INK} strokeWidth={3} />
      <rect x={640} y={490} width={14} height={105} fill="#4a2f21" stroke={INK} strokeWidth={3} />

      {/* far arm (left hand) behind the body; in victory both arms go up behind the head */}
      {arm(handL, -8, SWEATER_DARK)}
      {victory ? arm(handR, 6, SWEATER) : null}

      {/* legs */}
      <path d="M560 470 L690 474 L700 588" fill="none" stroke={INK} strokeWidth={46} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M560 470 L690 474 L700 588" fill="none" stroke={PANTS} strokeWidth={38} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M684 580 h56 q10 0 10 12 v6 h-70z" fill="#141319" stroke={INK} strokeWidth={4} />

      {/* torso */}
      <path d={`M560 470 L${sx - 4} ${sy}`} stroke={INK} strokeWidth={90} strokeLinecap="round" />
      <path d={`M560 470 L${sx - 4} ${sy}`} stroke={SWEATER} strokeWidth={82} strokeLinecap="round" />

      {/* head */}
      <rect x={hx - 16} y={hy + 20} width={26} height={40} fill={SKIN} stroke={INK} strokeWidth={4} />
      <circle cx={hx} cy={hy} r={50} fill={SKIN} stroke={INK} strokeWidth={5} />
      <path d={`M${hx + 46} ${hy - 2} q16 8 2 20`} fill={SKIN} stroke={INK} strokeWidth={4} />
      <path d={`M${hx - 52} ${hy + 6} q-6 -66 50 -62 q44 0 50 30 q-36 -14 -62 4 q-6 22 -24 34 z`} fill={HAIR} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={hx - 18} cy={hy + 8} rx={10} ry={14} fill={SKIN} stroke={INK} strokeWidth={4} />
      <ellipse cx={hx + 28} cy={hy - 4} rx={5} ry={blink ? 1 : eyeOpen} fill={INK} />
      <path d={brow} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
      {mouth}
      {mood === "easy" || mood === "victory" ? <ellipse cx={hx + 20} cy={hy + 14} rx={9} ry={5} fill="#f08f8f" opacity={0.6} /> : null}
      {sweat}

      {/* near arm (right hand) in front */}
      {victory ? null : arm(handR, 6, SWEATER)}
    </g>
  );
};
