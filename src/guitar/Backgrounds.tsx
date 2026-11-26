import React from "react";
import { random } from "remotion";

const INK = "#1b1a22";
const W = 1080;
const H = 860;

export const Bedroom: React.FC<{ t: number; evening: boolean }> = ({ t, evening }) => (
  <g>
    <rect width={W} height={H} fill={evening ? "#3d3b6e" : "#f2c48d"} />
    <rect y={640} width={W} height={220} fill={evening ? "#2a2850" : "#c98a55"} />
    <path d={`M0 640 H${W}`} stroke={INK} strokeWidth={6} />
    {/* window */}
    <rect x={720} y={90} width={270} height={240} rx={10} fill={evening ? "#1b2a5c" : "#9ad7ff"} stroke={INK} strokeWidth={8} />
    {evening ? (
      <g>
        <circle cx={920} cy={150} r={28} fill="#fff3b0" />
        <circle cx={908} cy={142} r={26} fill="#1b2a5c" />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={750 + random(`s${i}`) * 200} cy={110 + random(`sy${i}`) * 180} r={3} fill="white" opacity={0.5 + 0.5 * Math.sin(t * 3 + i)} />
        ))}
      </g>
    ) : (
      <g>
        <circle cx={930} cy={150} r={36} fill="#ffe066" />
        <ellipse cx={790 + ((t * 12) % 200)} cy={230} rx={50} ry={18} fill="white" opacity={0.9} />
      </g>
    )}
    <path d="M855 90 V330 M720 210 H990" stroke={INK} strokeWidth={6} />
    {/* poster */}
    <g transform="rotate(-4 170 210)">
      <rect x={70} y={110} width={200} height={260} fill="#ef476f" stroke={INK} strokeWidth={6} />
      <path d="M170 150 l40 80 h-28 l20 90 l-70 -110 h30 z" fill="#ffe066" stroke={INK} strokeWidth={4} />
      <text x={170} y={350} textAnchor="middle" fontFamily="Arial Black, Arial" fontWeight={900} fontSize={30} fill="white">
        ROCK
      </text>
    </g>
    {/* bed */}
    <rect x={-20} y={600} width={300} height={130} rx={18} fill={evening ? "#5c5aa3" : "#7ec4cf"} stroke={INK} strokeWidth={6} />
    <rect x={10} y={570} width={130} height={60} rx={22} fill="white" stroke={INK} strokeWidth={6} />
    {/* lamp + desk */}
    <rect x={820} y={560} width={240} height={30} fill="#8d5a3b" stroke={INK} strokeWidth={6} />
    <rect x={840} y={590} width={20} height={150} fill="#7a4b30" stroke={INK} strokeWidth={5} />
    <path d="M940 560 l10 -110 M915 450 h70 l-15 -50 h-40 z" fill="#ffd166" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    {evening ? <path d="M915 450 L860 560 H1040 L985 450 Z" fill="#ffe8a3" opacity={0.18} /> : null}
    {/* small practice amp */}
    <rect x={250} y={680} width={130} height={110} rx={10} fill="#2b2d42" stroke={INK} strokeWidth={6} />
    <rect x={265} y={700} width={100} height={70} rx={6} fill="#4a4e69" />
    <circle cx={315} cy={735} r={26} fill="#22223b" />
  </g>
);

export const Garage: React.FC<{ t: number; beat: number }> = ({ t, beat }) => (
  <g>
    <rect width={W} height={H} fill="#5b6475" />
    {/* garage door slats */}
    {Array.from({ length: 9 }, (_, i) => (
      <rect key={i} x={140} y={60 + i * 62} width={800} height={58} fill={i % 2 ? "#6b7486" : "#727c8f"} stroke="#3b4150" strokeWidth={3} />
    ))}
    <rect y={630} width={W} height={230} fill="#4a4f5c" />
    <path d={`M0 630 H${W}`} stroke={INK} strokeWidth={6} />
    {/* string lights */}
    <path d="M0 40 Q270 110 540 40 T1080 40" fill="none" stroke={INK} strokeWidth={3} />
    {Array.from({ length: 13 }, (_, i) => {
      const x = i * 90;
      const y = 40 + Math.sin((x / 1080) * Math.PI * 2) * -35 + 30;
      return <circle key={i} cx={x} cy={y} r={11} fill={["#ffd166", "#ef476f", "#06d6a0", "#118ab2"][i % 4]} opacity={0.7 + 0.3 * Math.sin(t * 4 + i)} />;
    })}
    {/* drummer silhouette (band!) */}
    <g transform={`translate(860 ${470 + beat * 6})`} opacity={0.9}>
      <circle cx={0} cy={0} r={48} fill="#2b2d42" />
      <rect x={-50} y={40} width={100} height={130} rx={30} fill="#2b2d42" />
      <path d={`M-40 80 L-100 ${50 - beat * 30} M40 80 L100 ${50 + beat * 20}`} stroke="#2b2d42" strokeWidth={22} strokeLinecap="round" />
    </g>
    <g>
      <ellipse cx={860} cy={640} rx={110} ry={30} fill="#d90429" stroke={INK} strokeWidth={5} />
      <rect x={750} y={600} width={220} height={60} fill="#d90429" stroke={INK} strokeWidth={5} />
      <circle cx={860} cy={640} r={60} fill="#edf2f4" stroke={INK} strokeWidth={5} />
      <ellipse cx={1010} cy={520 + beat * 8} rx={60} ry={10} fill="#ffd166" stroke={INK} strokeWidth={4} />
      <path d="M1010 530 V680" stroke={INK} strokeWidth={5} />
    </g>
    {/* amp stack */}
    <g>
      <rect x={60} y={430} width={210} height={150} rx={10} fill="#111" stroke={INK} strokeWidth={6} />
      <rect x={60} y={580} width={210} height={190} rx={10} fill="#111" stroke={INK} strokeWidth={6} />
      <rect x={76} y={446} width={178} height={34} rx={4} fill="#c9a227" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={96 + i * 34} cy={463} r={8} fill="#111" />
      ))}
      <rect x={78} y={600} width={174} height={150} rx={6} fill="#2a2a2a" />
      <circle cx={165} cy={675} r={58 + beat * 4} fill="#1a1a1a" stroke="#333" strokeWidth={4} />
    </g>
  </g>
);

export const Stage: React.FC<{ t: number; beat: number; energy: number }> = ({ t, beat, energy }) => {
  const beams = [0, 1, 2, 3, 4];
  return (
    <g>
      <defs>
        <radialGradient id="stageglow" cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#5a189a" />
          <stop offset="1" stopColor="#10002b" />
        </radialGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity={0.55} />
          <stop offset="1" stopColor="white" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#stageglow)" />
      {/* LED wall */}
      {Array.from({ length: 12 }, (_, i) =>
        Array.from({ length: 6 }, (_, j) => {
          const v = 0.5 + 0.5 * Math.sin(t * 3 + i * 0.6 + j * 0.9 + beat * 2);
          return <rect key={`${i}-${j}`} x={i * 90 + 6} y={j * 70 + 20} width={78} height={58} rx={6} fill={j % 2 ? "#ff006e" : "#3a86ff"} opacity={0.08 + v * 0.22 * (0.5 + energy)} />;
        }),
      )}
      {/* light beams */}
      {beams.map((i) => {
        const ang = Math.sin(t * (0.9 + i * 0.2) + i) * 22;
        const color = ["#ff006e", "#ffbe0b", "#3a86ff", "#8338ec", "#fb5607"][i];
        return (
          <g key={i} transform={`translate(${120 + i * 210} -10) rotate(${ang})`} style={{ mixBlendMode: "screen" }}>
            <path d="M-12 0 L12 0 L150 900 L-150 900 Z" fill={color} opacity={0.18 + energy * 0.2} />
          </g>
        );
      })}
      {/* stage floor */}
      <rect y={680} width={W} height={180} fill="#14111c" />
      <path d={`M0 680 H${W}`} stroke="#ff006e" strokeWidth={6} opacity={0.8} />
      {/* wedges / monitors */}
      <path d="M60 700 h160 l-20 60 h-120 z M860 700 h160 l-20 60 h-120 z" fill="#222" stroke={INK} strokeWidth={5} />
    </g>
  );
};

/** Crowd silhouettes in the foreground, jumping to the beat. */
export const Crowd: React.FC<{ t: number; beat: number; energy: number }> = ({ t, beat, energy }) => (
  <g>
    {Array.from({ length: 16 }, (_, i) => {
      const x = i * 72 + 10 + random(`cx${i}`) * 20;
      const j = (random(`cj${i}`) > 0.5 ? beat : Math.max(0, Math.sin(t * 6 + i))) * 18 * energy;
      const y = 820 - j - random(`cy${i}`) * 30;
      const hands = random(`ch${i}`) > 0.4;
      return (
        <g key={i} fill="#0a0612">
          <circle cx={x} cy={y} r={34} />
          <rect x={x - 46} y={y + 24} width={92} height={120} rx={36} />
          {hands ? (
            <g>
              <path d={`M${x - 30} ${y + 30} L${x - 54} ${y - 60 - j}`} stroke="#0a0612" strokeWidth={18} strokeLinecap="round" />
              {/* horns hand */}
              <path d={`M${x - 64} ${y - 64 - j} l-4 -26 M${x - 46} ${y - 66 - j} l4 -26`} stroke="#0a0612" strokeWidth={8} strokeLinecap="round" />
            </g>
          ) : null}
        </g>
      );
    })}
  </g>
);

/** Pyro sparks for the finale. */
export const Sparks: React.FC<{ t: number; amount: number }> = ({ t, amount }) => {
  if (amount <= 0) return null;
  return (
    <g>
      {Array.from({ length: 60 }, (_, i) => {
        const side = i % 2 ? 90 : 990;
        const life = (t * 1.3 + random(`sp${i}`)) % 1;
        const vx = (random(`vx${i}`) - 0.5) * 300;
        const vy = 500 + random(`vy${i}`) * 400;
        const x = side + vx * life;
        const y = 700 - vy * life + 600 * life * life;
        return <circle key={i} cx={x} cy={y} r={4 + random(`r${i}`) * 4} fill={i % 3 ? "#ffbe0b" : "#fb5607"} opacity={amount * (1 - life)} />;
      })}
    </g>
  );
};
