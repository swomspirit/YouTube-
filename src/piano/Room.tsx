const INK = "#1d1b26";

/** Cozy evening room + side view of a grand piano. Top area is 1920 x 600. */
export const Room: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a2546" />
        <stop offset="1" stopColor="#3b3160" />
      </linearGradient>
      <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffd98a" stopOpacity="0.45" />
        <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={600} fill="url(#wall)" />
    {/* window with moon */}
    <rect x={120} y={80} width={260} height={300} rx={10} fill="#16203f" stroke={INK} strokeWidth={8} />
    <circle cx={300} cy={160} r={38} fill="#f4f0d8" />
    <circle cx={316} cy={150} r={34} fill="#16203f" />
    {[...Array(8)].map((_, i) => (
      <circle key={i} cx={150 + ((i * 53) % 210)} cy={110 + ((i * 89) % 240)} r={2.5} fill="white" opacity={0.5 + 0.5 * Math.sin(t * 2 + i)} />
    ))}
    <line x1={250} x2={250} y1={80} y2={380} stroke={INK} strokeWidth={8} />
    <line x1={120} x2={380} y1={230} y2={230} stroke={INK} strokeWidth={8} />
    {/* lamp glow */}
    <ellipse cx={1120} cy={200} rx={420} ry={260} fill="url(#lamp)" />
    {/* floor */}
    <rect x={0} y={560} width={1920} height={40} fill="#5a3d2e" />
    <line x1={0} x2={1920} y1={560} y2={560} stroke={INK} strokeWidth={5} />

    {/* grand piano (side view, keyboard end on the left at x~735) */}
    <g>
      {/* lid, propped open */}
      <path d="M780 405 L1180 405 L1090 235 Z" fill="#17161d" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <line x1={1000} y1={405} x2={1060} y2={290} stroke="#8a8a8a" strokeWidth={6} />
      {/* music stand + sheet */}
      <path d="M760 405 L800 330 L812 334 L776 405 Z" fill="#17161d" stroke={INK} strokeWidth={4} />
      <rect x={770} y={318} width={46} height={64} fill="#f4f1e6" stroke={INK} strokeWidth={3} transform="rotate(26 793 350)" />
      {/* case */}
      <path d="M720 405 H1180 q40 0 40 30 v20 q0 26 -40 26 H720 z" fill="#1f1d26" stroke={INK} strokeWidth={5} />
      <path d="M730 418 H1170" stroke="#3a3747" strokeWidth={4} />
      {/* key slip + keys */}
      <rect x={700} y={418} width={60} height={22} rx={4} fill="#1f1d26" stroke={INK} strokeWidth={4} />
      <rect x={704} y={412} width={58} height={10} rx={2} fill="#f4f1e6" stroke={INK} strokeWidth={3} />
      {/* legs + pedals */}
      <rect x={748} y={481} width={26} height={80} fill="#1f1d26" stroke={INK} strokeWidth={4} />
      <rect x={1130} y={481} width={26} height={80} fill="#1f1d26" stroke={INK} strokeWidth={4} />
      <path d="M800 481 v60 h24 v-60" fill="none" stroke="#1f1d26" strokeWidth={8} />
      <rect x={790} y={540} width={44} height={10} fill="#c9a24a" stroke={INK} strokeWidth={3} />
    </g>
  </g>
);
