import { Face, type BrowState, type EyeState } from "./Face";
import { INK, SKIN, outline } from "./style";

/*
 * Original characters, drawn in a flat chibi style.
 * Each component is positioned with its FEET at (0, 0); draw it inside a
 * <g transform="translate(x,y)">.
 */

type FaceProps = { eyes?: EyeState; look?: number; brows?: BrowState; mouthOpen?: number };

/** Pip: kid with a blue beanie and red hoodie who remote-controls a robot buddy. */
export const Pip: React.FC<FaceProps & { tongue?: boolean; holdController?: boolean; jiggle?: number }> = ({
  eyes,
  look,
  brows,
  mouthOpen,
  tongue,
  holdController = true,
  jiggle = 0,
}) => (
  <g>
    {/* legs */}
    <rect x={-62} y={-130} width={50} height={128} rx={18} fill="#2b2d42" {...outline} />
    <rect x={12} y={-130} width={50} height={128} rx={18} fill="#2b2d42" {...outline} />
    <path d="M-72 -6 h64 v-8 q0 -18 -20 -18 h-26 q-20 0 -20 18z" fill="#f1f1f1" {...outline} />
    <path d="M8 -6 h64 v-8 q0 -18 -20 -18 h-26 q-20 0 -20 18z" fill="#f1f1f1" {...outline} />
    {/* hoodie */}
    <path d="M-100 -120 q-6 -150 40 -190 h120 q46 40 40 190 z" fill="#e2483d" {...outline} />
    <path d="M0 -300 v175" stroke="#f4f1e8" strokeWidth={10} />
    <path d="M-60 -170 h120 v40 h-120z" fill="#c63a31" {...outline} />
    {/* arms + controller */}
    {holdController ? (
      <g transform={`translate(${jiggle * 3}, ${Math.abs(jiggle) * 2})`}>
        <path d="M-92 -270 q-40 70 30 90" fill="none" stroke={INK} strokeWidth={50} strokeLinecap="round" />
        <path d="M-92 -270 q-40 70 30 90" fill="none" stroke="#e2483d" strokeWidth={36} strokeLinecap="round" />
        <path d="M92 -270 q40 70 -30 90" fill="none" stroke={INK} strokeWidth={50} strokeLinecap="round" />
        <path d="M92 -270 q40 70 -30 90" fill="none" stroke="#e2483d" strokeWidth={36} strokeLinecap="round" />
        <rect x={-70} y={-218} width={140} height={62} rx={26} fill="#3d3f52" {...outline} />
        <circle cx={-36} cy={-187} r={10} fill="#7ae7c7" />
        <circle cx={34} cy={-194} r={7} fill="#ffd166" />
        <circle cx={46} cy={-178} r={7} fill="#ef476f" />
        <path d="M44 -218 v-46" stroke={INK} strokeWidth={6} />
        <circle cx={44} cy={-268} r={8} fill="#ef476f" stroke={INK} strokeWidth={4} />
        <circle cx={-62} cy={-180} r={20} fill={SKIN} {...outline} />
        <circle cx={62} cy={-180} r={20} fill={SKIN} {...outline} />
      </g>
    ) : (
      <>
        <rect x={-130} y={-290} width={40} height={130} rx={20} fill="#e2483d" {...outline} />
        <rect x={90} y={-290} width={40} height={130} rx={20} fill="#e2483d" {...outline} />
      </>
    )}
    {/* head */}
    <g transform="translate(0,-440)">
      <ellipse cx={0} cy={0} rx={150} ry={138} fill={SKIN} {...outline} />
      <g transform="translate(0,20)">
        <Face eyes={eyes} look={look} brows={brows} mouthOpen={mouthOpen} tongue={tongue} blush />
      </g>
      {/* beanie */}
      <path d="M-150 -18 q-4 -140 150 -142 q154 2 150 142 z" fill="#3a6fd8" {...outline} />
      <rect x={-158} y={-42} width={316} height={46} rx={20} fill="#2d58b0" {...outline} />
      <circle cx={0} cy={-168} r={26} fill="#f4f1e8" {...outline} />
    </g>
  </g>
);

/** Shade: hooded teleporter with a face mask and glowing eyes. */
export const Shade: React.FC<{
  look?: number;
  eyes?: "normal" | "narrow" | "wide";
  talking?: number; // 0..1 glow pulse while speaking
  armSwing?: number; // 0 = hands down, 1 = fully swung forward
}> = ({ look = 0, eyes = "normal", talking = 0, armSwing = 0 }) => {
  const glow = 0.75 + talking * 0.25;
  const eh = eyes === "narrow" ? 8 : eyes === "wide" ? 26 : 16;
  const ex = look * 16;
  return (
    <g>
      <defs>
        <filter id="shade-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={6 + talking * 6} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* legs + boots */}
      <rect x={-60} y={-130} width={48} height={128} rx={16} fill="#2a2633" {...outline} />
      <rect x={12} y={-130} width={48} height={128} rx={16} fill="#2a2633" {...outline} />
      <path d="M-74 -4 h66 v-26 h-50 q-16 0 -16 16z" fill="#15131b" {...outline} />
      <path d="M8 -4 h66 v-26 h-50 q-16 0 -16 16z" fill="#15131b" {...outline} />
      {/* long tattered coat */}
      <path d="M-110 -90 q-10 -170 46 -220 h128 q56 50 46 220 l-30 -20 l-26 26 l-30 -22 l-26 26 l-30 -26 l-26 22z" fill="#4b3f6e" {...outline} />
      <path d="M-40 -300 l40 70 l40 -70" fill="none" stroke="#2f2747" strokeWidth={14} />
      <rect x={-104} y={-150} width={208} height={26} fill="#2f2747" {...outline} />
      <rect x={-20} y={-152} width={40} height={30} rx={6} fill="#b98cff" stroke={INK} strokeWidth={5} />
      {/* left arm (static) */}
      <rect x={-142} y={-290} width={42} height={140} rx={20} fill="#4b3f6e" {...outline} />
      <circle cx={-121} cy={-146} r={22} fill="#2a2633" {...outline} />
      {/* right arm swings forward (toward +x) */}
      <g transform={`translate(120,-282) rotate(${-armSwing * 110})`}>
        <rect x={-21} y={-8} width={42} height={140} rx={20} fill="#4b3f6e" {...outline} />
        <circle cx={0} cy={138} r={24} fill="#2a2633" {...outline} />
      </g>
      {/* head: hood + shadowed face + mask */}
      <g transform="translate(0,-440)">
        <path d="M-170 70 q-30 -230 170 -236 q200 6 170 236 q-20 30 -60 34 h-220 q-40 -4 -60 -34z" fill="#3a3157" {...outline} />
        <ellipse cx={0} cy={14} rx={118} ry={112} fill="#141220" stroke={INK} strokeWidth={5} />
        <path d="M-118 40 q118 40 236 0 v40 q-118 50 -236 0z" fill="#2a2440" stroke={INK} strokeWidth={5} />
        <path d="M-60 66 h120" stroke="#b98cff" strokeWidth={4} opacity={0.6} />
        <g filter="url(#shade-glow)" opacity={glow}>
          <rect x={-62 + ex} y={-4 - eh / 2} width={36} height={eh} rx={eh / 2} fill="#ff5bd8" />
          <rect x={26 + ex} y={-4 - eh / 2} width={36} height={eh} rx={eh / 2} fill="#ff5bd8" />
        </g>
        <path d="M-30 -166 q30 -26 60 0" fill="none" stroke="#2a2440" strokeWidth={6} />
      </g>
    </g>
  );
};

/** Bolt: Pip's small hovering robot buddy. Drawn centered at (0,0). */
export const Bolt: React.FC<{ mood?: "happy" | "sad" | "off"; flame?: number }> = ({ mood = "happy", flame = 1 }) => {
  const eyeColor = mood === "off" ? "#3b4a4f" : mood === "sad" ? "#58b9c9" : "#38e8ff";
  return (
    <g>
      {flame > 0 ? (
        <path d={`M-22 78 q22 ${40 + flame * 40} 44 0z`} fill="#ffb347" stroke={INK} strokeWidth={5} opacity={flame} />
      ) : null}
      <path d="M0 -84 v-34" stroke={INK} strokeWidth={6} />
      <circle cx={0} cy={-122} r={12} fill={mood === "off" ? "#6d6d6d" : "#ff4d6d"} stroke={INK} strokeWidth={5} />
      <ellipse cx={0} cy={0} rx={92} ry={86} fill="#e8f1ef" {...outline} />
      <path d="M-92 10 q92 30 184 0" fill="none" stroke="#b9cbc7" strokeWidth={8} />
      <rect x={-62} y={-44} width={124} height={68} rx={34} fill="#20333a" stroke={INK} strokeWidth={6} />
      {mood === "happy" ? (
        <path d="M-22 -2 q22 -30 44 0" stroke={eyeColor} strokeWidth={12} fill="none" strokeLinecap="round" />
      ) : mood === "sad" ? (
        <path d="M-22 -14 q22 26 44 0" stroke={eyeColor} strokeWidth={12} fill="none" strokeLinecap="round" />
      ) : (
        <path d="M-20 -10 h40" stroke={eyeColor} strokeWidth={10} strokeLinecap="round" />
      )}
      <ellipse cx={-98} cy={8} rx={14} ry={28} fill="#9fb3af" {...outline} />
      <ellipse cx={98} cy={8} rx={14} ry={28} fill="#9fb3af" {...outline} />
    </g>
  );
};
