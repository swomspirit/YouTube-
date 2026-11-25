/*
 * Original chibi cast for the "Squad" skits. Drawn in SVG, origin at the feet (0,0), head up (-y).
 *   Volt   – broke, hyper duelist: spiky white-blond hair with cyan tips, goggles, red hoodie.
 *   Mender – calm, rich healer: lilac bob with a leaf clip, round glasses, mint medic coat.
 */
export const INK = "#2b1b22";
const O = { stroke: INK, strokeWidth: 10, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export type Who = "volt" | "mender";
export type Face = "normal" | "happy" | "angry" | "deadpan" | "sparkle" | "dead" | "smug" | "shock" | "plead";
export type Pose = "idle" | "wave" | "plead" | "angry" | "pointSelf" | "cash" | "sniper" | "thumbsUp" | "shrug";

const LOOK = {
  volt: { skin: "#f1c09a", skinSh: "#dc9f7a", hair: "#f6efd4", hairSh: "#d9cfa8", tip: "#3fd6ff", top: "#e2433b", topSh: "#b8312b", pants: "#2b3550", shoe: "#f4f4f4", glove: "#262626" },
  mender: { skin: "#f6cfae", skinSh: "#e0ae8b", hair: "#b99be8", hairSh: "#9277cc", tip: "#b99be8", top: "#9fe3c4", topSh: "#74c7a5", pants: "#3a3346", shoe: "#6b4a3a", glove: "#f6cfae" },
};

/* ---------------- props ---------------- */
export const CashFan: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g transform={`translate(${x} ${y}) rotate(${-20 + Math.sin(t * 5) * 4})`}>
    {[-40, -20, 0, 20, 40].map((a, i) => (
      <g key={i} transform={`rotate(${a})`}>
        <rect x={-26} y={-150} width={52} height={130} rx={6} fill={i % 2 ? "#7fd36a" : "#9be37f"} {...O} strokeWidth={6} />
        <rect x={-14} y={-130} width={28} height={30} rx={4} fill="none" stroke="#3f8f3a" strokeWidth={4} />
        <text x={0} y={-60} textAnchor="middle" fontSize={30} fontWeight={900} fill="#3f8f3a" fontFamily="Arial Black, Arial">◈</text>
      </g>
    ))}
  </g>
);

/** "Longshot" sniper rifle (original design), drawn pointing right, centred on the grip. */
export const Longshot: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-170 -10 L-110 -26 L60 -26 L60 6 L-60 6 L-80 40 L-120 40 L-110 6 L-170 14 Z" fill="#3a4150" {...O} strokeWidth={7} />
    <rect x={60} y={-20} width={190} height={16} rx={6} fill="#2a3040" {...O} strokeWidth={6} />
    <rect x={240} y={-24} width={22} height={24} rx={4} fill="#2fb59a" {...O} strokeWidth={6} />
    <rect x={-40} y={-62} width={120} height={30} rx={14} fill="#2fb59a" {...O} strokeWidth={6} />
    <circle cx={86} cy={-47} r={13} fill="#bff6ff" {...O} strokeWidth={5} />
    <path d="M-10 6 L5 34 L25 34 L18 6 Z" fill="#2a3040" {...O} strokeWidth={6} />
  </g>
);

/* ---------------- face ---------------- */
const Eyes: React.FC<{ face: Face; look: number; blink: boolean }> = ({ face, look, blink }) => {
  const lx = look * 10;
  const pair = (fn: (x: number) => React.ReactNode) => (
    <>
      {fn(-62)}
      {fn(62)}
    </>
  );
  if (face === "dead")
    return pair((x) => (
      <g key={x} stroke={INK} strokeWidth={10} strokeLinecap="round">
        <line x1={x - 18} y1={-18} x2={x + 18} y2={18} />
        <line x1={x + 18} y1={-18} x2={x - 18} y2={18} />
      </g>
    ));
  if (blink || face === "happy") return pair((x) => <path key={x} d={`M${x - 20} 6 Q${x} -16 ${x + 20} 6`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />);
  if (face === "deadpan" || face === "smug")
    return pair((x) => (
      <g key={x}>
        <line x1={x - 22} y1={-6} x2={x + 22} y2={-6} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <ellipse cx={x + lx} cy={6} rx={9} ry={9} fill={INK} />
      </g>
    ));
  if (face === "shock")
    return pair((x) => (
      <g key={x}>
        <circle cx={x} cy={0} r={26} fill="white" stroke={INK} strokeWidth={7} />
        <circle cx={x + lx} cy={0} r={6} fill={INK} />
      </g>
    ));
  if (face === "sparkle" || face === "plead")
    return pair((x) => (
      <g key={x}>
        <ellipse cx={x + lx} cy={0} rx={22} ry={27} fill={INK} />
        <circle cx={x + lx - 7} cy={-10} r={8} fill="white" />
        <circle cx={x + lx + 8} cy={8} r={4} fill="white" />
        {face === "sparkle" ? <path d={`M${x + lx + 6} -24 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z`} fill="#fff6a8" /> : null}
      </g>
    ));
  return pair((x) => (
    <g key={x}>
      <ellipse cx={x + lx} cy={0} rx={13} ry={22} fill={INK} />
      <circle cx={x + lx - 4} cy={-8} r={5} fill="white" />
    </g>
  ));
};

const Brows: React.FC<{ face: Face }> = ({ face }) => {
  const d: Partial<Record<Face, string>> = {
    angry: "M-88 -58 L-38 -40 M88 -58 L38 -40",
    plead: "M-88 -44 L-40 -58 M88 -44 L40 -58",
    deadpan: "M-86 -42 L-38 -42 M86 -42 L38 -42",
    smug: "M-86 -46 L-38 -44 M86 -56 L38 -46",
    shock: "M-88 -62 Q-62 -74 -36 -62 M88 -62 Q62 -74 36 -62",
    sparkle: "M-86 -56 Q-62 -66 -38 -56 M86 -56 Q62 -66 38 -56",
  };
  const p = d[face];
  return p ? <path d={p} stroke={INK} strokeWidth={9} strokeLinecap="round" fill="none" /> : null;
};

const Mouth: React.FC<{ face: Face; talk: number }> = ({ face, talk }) => {
  if (talk > 0.05)
    return (
      <g transform="translate(0 70)">
        <path d={`M-30 -6 Q0 ${-10 - talk * 4} 30 -6 Q24 ${18 + talk * 26} 0 ${22 + talk * 28} Q-24 ${18 + talk * 26} -30 -6Z`} fill="#8a2a3a" {...O} strokeWidth={7} />
        <ellipse cx={0} cy={12 + talk * 18} rx={14} ry={6 + talk * 4} fill="#f07a8a" />
      </g>
    );
  switch (face) {
    case "happy":
    case "sparkle":
      return <path d="M-34 62 Q0 102 34 62 Z" fill="#8a2a3a" {...O} strokeWidth={7} />;
    case "angry":
      return <path d="M-30 82 Q0 62 30 82" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />;
    case "deadpan":
      return <path d="M-22 74 H22" stroke={INK} strokeWidth={9} strokeLinecap="round" />;
    case "smug":
      return <path d="M-24 76 Q4 84 28 64" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />;
    case "dead":
      return <path d="M-26 76 q8 -10 16 0 q8 10 16 0 q8 -10 16 0" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />;
    case "shock":
      return <ellipse cx={0} cy={78} rx={16} ry={20} fill="#8a2a3a" {...O} strokeWidth={7} />;
    case "plead":
      return <path d="M-18 76 Q0 66 18 76" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />;
    default:
      return <path d="M-22 68 Q0 86 22 68" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />;
  }
};

/* ---------------- hair ---------------- */
const HairBack: React.FC<{ who: Who }> = ({ who }) => {
  const c = LOOK[who];
  if (who === "mender") return <path d="M-196 -10 Q-210 -190 0 -200 Q210 -190 196 -10 Q200 90 150 120 L-150 120 Q-200 90 -196 -10Z" fill={c.hair} {...O} />;
  return null;
};
const HairFront: React.FC<{ who: Who; t: number }> = ({ who, t }) => {
  const c = LOOK[who];
  if (who === "volt") {
    const wob = Math.sin(t * 6) * 3;
    const spikes = [
      [-170, -40, -205, -150],
      [-130, -110, -150, -235],
      [-60, -150, -40, -275],
      [20, -160, 70, -280],
      [90, -130, 175, -230],
      [150, -70, 225, -120],
    ];
    return (
      <g>
        <path d="M-182 -20 Q-190 -170 0 -182 Q190 -170 182 -20 Q150 -80 90 -70 Q40 -110 -10 -78 Q-70 -110 -120 -64 Q-160 -70 -182 -20Z" fill={c.hair} {...O} />
        {spikes.map(([bx, by, tx, ty], i) => (
          <g key={i}>
            <path d={`M${bx - 40} ${by + 20} L${tx + wob} ${ty} L${bx + 40} ${by + 10}Z`} fill={c.hair} {...O} />
            <path d={`M${(bx + tx) / 2 - 12} ${(by + ty) / 2} L${tx + wob} ${ty} L${(bx + tx) / 2 + 14} ${(by + ty) / 2 - 4}Z`} fill={c.tip} />
          </g>
        ))}
        {/* goggles strap + lenses */}
        <path d="M-182 -96 Q0 -140 182 -96" fill="none" stroke="#ff9a2e" strokeWidth={26} />
        <path d="M-182 -96 Q0 -140 182 -96" fill="none" stroke={INK} strokeWidth={6} strokeDasharray="0" opacity={0.25} />
        {[-62, 62].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={-120} rx={46} ry={34} fill="#6fe7ff" {...O} strokeWidth={9} />
            <ellipse cx={x - 14} cy={-130} rx={12} ry={8} fill="white" opacity={0.8} />
          </g>
        ))}
      </g>
    );
  }
  return (
    <g>
      <path d="M-186 -10 Q-196 -186 0 -190 Q196 -186 186 -10 Q160 -60 110 -84 Q60 -40 0 -96 Q-60 -40 -120 -84 Q-160 -60 -186 -10Z" fill={c.hair} {...O} />
      <path d="M-120 -140 Q-40 -176 60 -160" fill="none" stroke="#d9c6ff" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
      {/* leaf hair clip */}
      <g transform="translate(130 -120) rotate(30)">
        <path d="M0 0 Q30 -40 0 -80 Q-30 -40 0 0Z" fill="#59c26a" {...O} strokeWidth={7} />
        <path d="M0 -6 L0 -70" stroke="#2f7a3a" strokeWidth={5} />
      </g>
    </g>
  );
};

/* ---------------- arm ---------------- */
const Arm: React.FC<{ sx: number; sy: number; hx: number; hy: number; side: 1 | -1; sleeve: string; hand: string; glove?: boolean }> = ({ sx, sy, hx, hy, side, sleeve, hand, glove }) => {
  const mx = (sx + hx) / 2 + side * 30;
  const my = (sy + hy) / 2 + 20;
  const p = `M${sx} ${sy} Q${mx} ${my} ${hx} ${hy}`;
  return (
    <g>
      <path d={p} fill="none" stroke={INK} strokeWidth={66} strokeLinecap="round" />
      <path d={p} fill="none" stroke={sleeve} strokeWidth={46} strokeLinecap="round" />
      <circle cx={hx} cy={hy} r={32} fill={glove ? "#262626" : hand} {...O} strokeWidth={8} />
    </g>
  );
};

/* ---------------- character ---------------- */
export type ChibiProps = { who: Who; t: number; face: Face; pose: Pose; talk: number; look?: number; hop?: number; holding?: "cash" | "rifle" | null };

export const Chibi: React.FC<ChibiProps> = ({ who, t, face, pose, talk, look = 0, hop = 0, holding = null }) => {
  const c = LOOK[who];
  const breathe = Math.sin(t * 3 + (who === "volt" ? 0 : 1.3));
  const sq = 1 + breathe * 0.012 + talk * 0.02;
  const blink = (t + (who === "volt" ? 0 : 1.7)) % 3.4 < 0.12 && face !== "dead";
  const wave = Math.sin(t * 12);
  const hands: Record<Pose, { L: [number, number]; R: [number, number] }> = {
    idle: { L: [-128, -150], R: [128, -150] },
    wave: { L: [-128, -150], R: [175 + wave * 20, -430 + Math.abs(wave) * 8] },
    plead: { L: [-34, -235], R: [34, -235] },
    angry: { L: [-185, -390 + Math.sin(t * 14) * 10], R: [185, -390 - Math.sin(t * 14) * 10] },
    pointSelf: { L: [-150, -170], R: [18, -225] },
    cash: { L: [-128, -150], R: [150, -255] },
    sniper: { L: [-40, -205], R: [110, -228] },
    thumbsUp: { L: [-128, -150], R: [150, -300] },
    shrug: { L: [-185, -270], R: [185, -270] },
  };
  const h = hands[pose];
  const sh = { L: [-92, -262] as const, R: [92, -262] as const };
  return (
    <g transform={`translate(0 ${-hop}) scale(${1 / sq}, ${sq})`}>
      {/* legs + shoes */}
      <rect x={-62} y={-120} width={52} height={112} rx={22} fill={c.pants} {...O} />
      <rect x={10} y={-120} width={52} height={112} rx={22} fill={c.pants} {...O} />
      <ellipse cx={-40} cy={-8} rx={46} ry={22} fill={c.shoe} {...O} />
      <ellipse cx={40} cy={-8} rx={46} ry={22} fill={c.shoe} {...O} />
      {/* torso */}
      <path d="M-112 -100 Q-122 -250 -70 -282 H70 Q122 -250 112 -100 Q0 -84 -112 -100Z" fill={c.top} {...O} />
      <path d="M60 -276 Q112 -246 104 -104 Q80 -98 64 -100 Q76 -200 40 -270Z" fill={c.topSh} opacity={0.8} />
      {who === "volt" ? (
        <>
          <path d="M-40 -278 Q0 -240 40 -278" fill="none" stroke={c.topSh} strokeWidth={12} />
          <path d="M-14 -230 L-34 -176 L-6 -176 L-22 -124 L26 -190 L0 -190 L16 -230Z" fill="#ffd23f" {...O} strokeWidth={6} />
        </>
      ) : (
        <>
          <path d="M-62 -282 L0 -214 L62 -282" fill="white" {...O} strokeWidth={8} />
          <circle cx={-50} cy={-170} r={26} fill="#3fa96a" {...O} strokeWidth={6} />
          <path d="M-50 -184 V-156 M-64 -170 H-36" stroke="white" strokeWidth={8} strokeLinecap="round" />
          <path d="M-112 -110 H112" stroke={c.topSh} strokeWidth={8} />
        </>
      )}
      {/* back arm-layer props */}
      {holding === "rifle" ? <Longshot x={20} y={-222} rot={-8} s={0.95} /> : null}
      <Arm sx={sh.L[0]} sy={sh.L[1]} hx={h.L[0]} hy={h.L[1]} side={-1} sleeve={c.top} hand={c.skin} glove={who === "volt"} />
      <Arm sx={sh.R[0]} sy={sh.R[1]} hx={h.R[0]} hy={h.R[1]} side={1} sleeve={c.top} hand={c.skin} glove={who === "volt"} />
      {holding === "cash" ? <CashFan x={h.R[0]} y={h.R[1] + 10} t={t} /> : null}
      {pose === "thumbsUp" ? <rect x={h.R[0] - 8} y={h.R[1] - 62} width={22} height={44} rx={11} fill={who === "volt" ? "#262626" : c.skin} {...O} strokeWidth={7} /> : null}
      {/* head */}
      <g transform={`translate(0 -440) rotate(${look * 5})`}>
        <HairBack who={who} />
        <ellipse cx={-176} cy={20} rx={26} ry={34} fill={c.skin} {...O} />
        <ellipse cx={176} cy={20} rx={26} ry={34} fill={c.skin} {...O} />
        <ellipse cx={0} cy={0} rx={180} ry={168} fill={c.skin} {...O} />
        <path d="M120 -110 A180 168 0 0 1 150 110 Q190 0 120 -110Z" fill={c.skinSh} opacity={0.5} />
        <g transform="translate(0 30)">
          <ellipse cx={-104} cy={44} rx={26} ry={14} fill="#f29a9a" opacity={0.55} />
          <ellipse cx={104} cy={44} rx={26} ry={14} fill="#f29a9a" opacity={0.55} />
          <Eyes face={face} look={look} blink={blink} />
          <Brows face={face} />
          <Mouth face={face} talk={talk} />
          {who === "mender" ? (
            <g fill="none" stroke="#4a3550" strokeWidth={7}>
              <circle cx={-62} cy={0} r={40} fill="rgba(255,255,255,0.18)" />
              <circle cx={62} cy={0} r={40} fill="rgba(255,255,255,0.18)" />
              <path d="M-22 -4 Q0 -16 22 -4" />
            </g>
          ) : null}
        </g>
        <HairFront who={who} t={t} />
      </g>
    </g>
  );
};
