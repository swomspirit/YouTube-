import { INK } from "./style";

/** Flat "bomb site B" courtyard, 1080x1920. Floor line at y = 1350. */
export const SiteB: React.FC = () => (
  <g>
    <defs>
      <filter id="bg-soft">
        <feGaussianBlur stdDeviation={2.2} />
      </filter>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9fc9d9" />
        <stop offset="1" stopColor="#d9ecef" />
      </linearGradient>
    </defs>
    <g filter="url(#bg-soft)">
      <rect x={0} y={0} width={1080} height={1920} fill="url(#sky)" />
      {/* far buildings */}
      <rect x={-20} y={330} width={420} height={500} fill="#c7b59a" />
      <rect x={640} y={260} width={460} height={560} fill="#bba88b" />
      <rect x={720} y={330} width={70} height={110} fill="#8d7c64" />
      <rect x={860} y={330} width={70} height={110} fill="#8d7c64" />
      {/* main wall */}
      <rect x={-20} y={560} width={1120} height={800} fill="#e0c294" stroke={INK} strokeWidth={6} />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={-20} x2={1100} y1={760 + i * 150} y2={760 + i * 150} stroke="#c9a877" strokeWidth={5} />
      ))}
      {[180, 520, 860].map((x) => (
        <line key={x} x1={x} x2={x} y1={560} y2={1350} stroke="#c9a877" strokeWidth={5} />
      ))}
      {/* doorway */}
      <path d="M640 1350 v-420 q130 -140 260 0 v420z" fill="#4a3b31" stroke={INK} strokeWidth={6} />
      {/* big painted site letter */}
      <rect x={120} y={640} width={260} height={260} rx={24} fill="#f2e3c5" stroke={INK} strokeWidth={6} />
      <text x={250} y={850} textAnchor="middle" fontSize={230} fontWeight={900} fontFamily="Arial Black, Arial, sans-serif" fill="#e2483d">
        B
      </text>
      {/* pipes */}
      <rect x={430} y={560} width={34} height={790} fill="#8a9ba3" stroke={INK} strokeWidth={5} />
      <rect x={500} y={560} width={22} height={790} fill="#a4b4ba" stroke={INK} strokeWidth={5} />
      {/* crates */}
      <rect x={-10} y={1110} width={250} height={240} fill="#b07a4f" stroke={INK} strokeWidth={6} />
      <path d="M-10 1110 l250 240 M240 1110 l-250 240" stroke="#8a5b38" strokeWidth={8} />
      <rect x={40} y={930} width={180} height={180} fill="#c08a5c" stroke={INK} strokeWidth={6} />
      <path d="M40 930 l180 180 M220 930 l-180 180" stroke="#8a5b38" strokeWidth={8} />
      <rect x={900} y={1170} width={200} height={180} fill="#6f8a5c" stroke={INK} strokeWidth={6} />
      <rect x={920} y={1200} width={160} height={24} fill="#58704a" />
    </g>
    {/* floor (kept sharp so characters feel grounded) */}
    <rect x={0} y={1350} width={1080} height={570} fill="#bf9a6a" />
    <line x1={0} x2={1080} y1={1350} y2={1350} stroke={INK} strokeWidth={6} />
    {[0, 1, 2, 3].map((i) => (
      <line key={i} x1={0} x2={1080} y1={1440 + i * 120} y2={1440 + i * 120} stroke="#ad8858" strokeWidth={4} />
    ))}
    {[-200, 100, 400, 700, 1000, 1300].map((x) => (
      <line key={x} x1={x + 270} x2={x - 120} y1={1350} y2={1920} stroke="#ad8858" strokeWidth={4} />
    ))}
  </g>
);
