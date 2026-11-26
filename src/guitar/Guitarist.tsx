import React from "react";

/**
 * "Riff": an original chibi guitarist, front view, in a 1080x860 scene.
 * The guitar is drawn in its own local frame (bridge at 0,0, neck along +x)
 * and the arms use 2-bone IK so the fretting hand sits on the exact fret/string.
 */
const INK = "#1b1a22";
const SKIN = "#f3c7a0";
const SKIN_SH = "#e0a983";

export type Face = "confused" | "focus" | "happy" | "rock" | "proud" | "wince";
export type Outfit = "hoodie" | "rocker";

// guitar placement
export const GX = 452;
export const GY = 596;
export const GANG = -26; // degrees
const NUT = 520;
const SCALE = 520;
export const fretX = (n: number) => NUT - SCALE * (1 - Math.pow(2, -n / 12));
/** where a finger presses for fret f (just behind the fret wire) */
export const fingerX = (f: number) => (f <= 0 ? NUT + 6 : fretX(f) + (fretX(f - 1) - fretX(f)) * 0.38);
export const stringY = (s: number, x: number) => {
  const k = 6.8 - (Math.min(x, NUT) / NUT) * 2.2; // strings converge toward the nut
  return (3.5 - s) * k; // low E (6) on top, high e (1) at the bottom, as seen from the front
};

const rad = (GANG * Math.PI) / 180;
export const toWorld = (x: number, y: number) => ({
  x: GX + x * Math.cos(rad) - y * Math.sin(rad),
  y: GY + x * Math.sin(rad) + y * Math.cos(rad),
});

const ik = (S: { x: number; y: number }, H: { x: number; y: number }, l1: number, l2: number, pick: "down" | "out") => {
  const dx = H.x - S.x;
  const dy = H.y - S.y;
  const d = Math.min(l1 + l2 - 0.5, Math.max(Math.abs(l1 - l2) + 1, Math.hypot(dx, dy)));
  const a = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const phi = Math.atan2(dy, dx);
  const e1 = { x: S.x + l1 * Math.cos(phi + a), y: S.y + l1 * Math.sin(phi + a) };
  const e2 = { x: S.x + l1 * Math.cos(phi - a), y: S.y + l1 * Math.sin(phi - a) };
  if (pick === "down") return e1.y > e2.y ? e1 : e2;
  return e1.x < e2.x ? e1 : e2;
};

const Arm: React.FC<{ S: { x: number; y: number }; E: { x: number; y: number }; H: { x: number; y: number }; sleeve: string; cuff?: string }> = ({ S, E, H, sleeve, cuff }) => {
  const d = `M${S.x} ${S.y} L${E.x} ${E.y} L${H.x} ${H.y}`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={sleeve} strokeWidth={38} strokeLinecap="round" strokeLinejoin="round" />
      {cuff ? <circle cx={E.x + (H.x - E.x) * 0.82} cy={E.y + (H.y - E.y) * 0.82} r={17} fill={cuff} stroke={INK} strokeWidth={5} /> : null}
    </g>
  );
};

const GuitarBody: React.FC<{ color: string; color2: string; flames: boolean }> = ({ color, color2, flames }) => (
  <g>
    <defs>
      <radialGradient id="gbody" cx="0.35" cy="0.4" r="0.8">
        <stop offset="0" stopColor={color2} />
        <stop offset="1" stopColor={color} />
      </radialGradient>
    </defs>
    <path
      d="M182 -26 C205 -78 150 -114 104 -98 C70 -86 48 -118 -4 -120 C-76 -122 -130 -84 -132 -8 C-134 64 -96 122 -8 124 C52 126 82 104 112 110 C154 120 208 96 186 46 C176 24 168 10 182 -26 Z"
      fill="url(#gbody)"
      stroke={INK}
      strokeWidth={7}
      strokeLinejoin="round"
    />
    {flames ? (
      <g opacity={0.85}>
        {[-90, -40, 10, 60].map((x, i) => (
          <path key={i} d={`M${x} 120 q-18 -50 6 -80 q2 30 18 34 q-6 -40 16 -64 q4 50 22 70 q8 -18 4 -36 q24 30 6 76 z`} fill="#ffb703" stroke={INK} strokeWidth={3} />
        ))}
      </g>
    ) : null}
    {/* pickguard */}
    <path d="M150 -40 C120 -70 70 -60 52 -46 L-30 -30 C-60 10 -40 70 20 80 L120 60 C150 40 160 0 150 -40 Z" fill="#f4f1e8" stroke={INK} strokeWidth={4} opacity={flames ? 0 : 0.95} />
    {/* pickups */}
    {[42, 112].map((x) => (
      <rect key={x} x={x - 9} y={-30} width={18} height={60} rx={6} fill="#22202a" stroke={INK} strokeWidth={3} />
    ))}
    {/* bridge */}
    <rect x={-16} y={-32} width={22} height={64} rx={5} fill="#c9ccd6" stroke={INK} strokeWidth={3} />
    {/* knobs */}
    {[
      [-62, 66],
      [-28, 86],
      [10, 98],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={10} fill="#e9e2c9" stroke={INK} strokeWidth={3} />
    ))}
    {/* whammy bar */}
    <path d="M-6 30 L-14 44 L-64 78" fill="none" stroke="#c9ccd6" strokeWidth={6} strokeLinecap="round" />
  </g>
);

const Neck: React.FC<{ headColor: string }> = ({ headColor }) => {
  const inlays = [3, 5, 7, 9, 15, 17, 19, 21];
  return (
    <g>
      {/* headstock */}
      <path d={`M${NUT - 2} -15 L${NUT + 40} -20 C${NUT + 80} -30 ${NUT + 104} -22 ${NUT + 108} -6 L${NUT + 98} 18 C${NUT + 70} 14 ${NUT + 40} 20 ${NUT - 2} 15 Z`} fill={headColor} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx={NUT + 28 + i * 13} cy={-22 + (i % 2) * 2} r={5} fill="#d9dce3" stroke={INK} strokeWidth={2} />
      ))}
      {/* neck */}
      <path d={`M150 -18 L${NUT} -14 L${NUT} 14 L150 18 Z`} fill="#4a2c1d" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {Array.from({ length: 21 }, (_, i) => i + 1).map((n) => {
        const x = fretX(n);
        if (x < 150) return null;
        const h = 14 + ((NUT - x) / (NUT - 150)) * 4;
        return <line key={n} x1={x} y1={-h + 1} x2={x} y2={h - 1} stroke="#d9dce3" strokeWidth={2.2} />;
      })}
      {inlays.map((n) => {
        const x = (fretX(n) + fretX(n - 1)) / 2;
        return x > 150 ? <circle key={n} cx={x} cy={0} r={3.4} fill="#efe9da" /> : null;
      })}
      {[-6, 6].map((y) => (
        <circle key={y} cx={(fretX(12) + fretX(11)) / 2} cy={y} r={3.2} fill="#efe9da" />
      ))}
      <rect x={NUT - 3} y={-14} width={6} height={28} fill="#f4f1e8" stroke={INK} strokeWidth={1.5} />
    </g>
  );
};

export type GuitaristProps = {
  t: number;
  face: Face;
  outfit: Outfit;
  /** fretting hand: fret (can be fractional while moving) and string (1..6) */
  fret: number;
  string: number;
  /** strings currently ringing, with 0..1 intensity, for the vibrating lines */
  ringing: { s: number; f: number; amp: number }[];
  pick: number; // 0..1 pick pulse
  pickDir: number; // +1 / -1
  pickString: number;
  bob: number; // 0..1 beat bounce
  headbang: number; // 0..1 amount
  dive: number; // 0..1 whammy press
  guitar: { color: string; color2: string; head: string; flames: boolean };
  jump?: number; // px
};

export const Guitarist: React.FC<GuitaristProps> = (p) => {
  const { t, face, outfit } = p;
  const lift = -(p.jump ?? 0);
  const bounce = p.bob * 10;
  const bang = p.headbang * 28;
  const hy = 238 + bounce + bang + lift;
  const hx = 540 + Math.sin(t * 1.3) * 4;
  const tilt = face === "confused" ? -8 : face === "focus" ? 10 : face === "rock" ? -6 + bang * 0.3 : Math.sin(t * 2) * 3;

  const rocker = outfit === "rocker";
  const top = rocker ? "#23212b" : "#2ec4b6";
  const topDark = rocker ? "#15141b" : "#22a094";
  const shirt = rocker ? "#e63946" : "#2ec4b6";

  // shoulders
  const SR = { x: 452, y: 412 + bounce * 0.6 + lift };
  const SL = { x: 628, y: 412 + bounce * 0.6 + lift };

  // fretting hand on the neck
  const fx = fingerX(Math.max(0, p.fret));
  const fy = stringY(p.string, fx);
  const fHand = toWorld(fx, fy + 4);
  const fLocal = { x: fx, y: fy };
  // picking hand (or whammy bar)
  const strum = p.pickDir * p.pick * 16;
  const pickLocal = p.dive > 0.02 ? { x: -64 + p.dive * 6, y: 78 + p.dive * 14 } : { x: 78, y: stringY(p.pickString, 78) + strum };
  const pHand = toWorld(pickLocal.x, pickLocal.y + 8);
  const eL = ik(SL, fHand, 150, 152, "down");
  const eR = ik(SR, pHand, 118, 118, "out");

  // eyes / face helpers
  const blink = Math.floor(t * 8) % 29 === 0;
  const look = face === "focus" ? { x: 10, y: 10 } : face === "confused" ? { x: 8, y: 12 } : { x: 0, y: 0 };
  const eye = (x: number) => {
    if (face === "proud" || blink) return <path key={x} d={`M${x - 15} ${-4} Q${x} ${-18} ${x + 15} ${-4}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
    if (face === "wince") return <path key={x} d={`M${x - 14} ${-14} L${x + 10} ${-4} L${x - 14} ${6}`} transform={x > 0 ? `scale(-1,1) translate(${-2 * x},0)` : undefined} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />;
    const r = face === "confused" ? 17 : 15;
    return (
      <g key={x}>
        <ellipse cx={x} cy={-6} rx={r} ry={r + 3} fill="white" stroke={INK} strokeWidth={5} />
        <circle cx={x + look.x * 0.6} cy={-4 + look.y * 0.5} r={8} fill={INK} />
        <circle cx={x + look.x * 0.6 + 3} cy={-8 + look.y * 0.5} r={2.6} fill="white" />
      </g>
    );
  };
  const mouth = (() => {
    switch (face) {
      case "confused":
        return <path d="M-22 48 q8 -8 16 0 q8 8 16 0 q8 -8 14 0" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
      case "focus":
        return (
          <g>
            <path d="M-16 46 L18 44" stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <path d="M8 45 q10 0 10 10 q-2 10 -12 6 q-6 -4 2 -16z" fill="#ff7b9c" stroke={INK} strokeWidth={4} />
          </g>
        );
      case "happy":
        return <path d="M-26 38 Q0 70 26 38 Z" fill="#7a2b35" stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
      case "rock":
        return (
          <g>
            <ellipse cx={0} cy={50} rx={22} ry={26 + Math.sin(t * 9) * 4} fill="#5a1a24" stroke={INK} strokeWidth={5} />
            <path d="M-14 36 h28" stroke="white" strokeWidth={6} strokeLinecap="round" />
          </g>
        );
      case "proud":
        return <path d="M-32 34 Q0 80 32 34 Z" fill="#7a2b35" stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
      case "wince":
        return <path d="M-24 46 L-12 40 L0 48 L12 40 L24 46" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />;
    }
  })();

  const ringLines = p.ringing.map((r, i) => {
    const x0 = r.f > 0 ? fingerX(r.f) : NUT;
    const pts: string[] = [];
    for (let k = 0; k <= 24; k++) {
      const x = 0 + (x0 * k) / 24;
      const y = stringY(r.s, x) + Math.sin((k / 24) * Math.PI) * Math.sin(t * 90 + i) * 3.2 * r.amp;
      pts.push(`${x.toFixed(1)},${y.toFixed(2)}`);
    }
    return <polyline key={i} points={pts.join(" ")} fill="none" stroke="#fff7c2" strokeWidth={2.2} opacity={0.5 + 0.5 * r.amp} />;
  });

  return (
    <g>
      {/* shadow */}
      <ellipse cx={540} cy={836} rx={190} ry={22} fill="rgba(0,0,0,0.35)" />

      {/* legs */}
      {[
        [508, 476],
        [574, 606],
      ].map(([hipX, footX], i) => {
        const d = `M${hipX} ${640 + bounce * 0.4 + lift} L${(hipX + footX) / 2} ${730 + lift * 0.5} L${footX} ${808}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={INK} strokeWidth={56} strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} fill="none" stroke={rocker ? "#2b2d42" : "#3d5a80"} strokeWidth={44} strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M${footX - 38} 812 q0 -30 34 -30 q40 0 44 30 z`} fill={rocker ? "#111" : "#f8f9fa"} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d={`M${footX - 40} 812 h82`} stroke={rocker ? "#555" : "#e63946"} strokeWidth={6} />
          </g>
        );
      })}

      {/* torso */}
      <path
        d={`M${SR.x - 18} ${SR.y + 10} Q${SR.x - 6} ${SR.y - 34} ${540} ${SR.y - 32} Q${SL.x + 6} ${SR.y - 34} ${SL.x + 18} ${SL.y + 10} L${SL.x + 6} ${664 + lift} L${SR.x - 6} ${664 + lift} Z`}
        fill={top}
        stroke={INK}
        strokeWidth={7}
        strokeLinejoin="round"
      />
      {rocker ? (
        <g>
          <path d={`M520 ${SR.y - 30} L540 ${560 + lift} L560 ${SR.y - 30} Z`} fill={shirt} stroke={INK} strokeWidth={5} />
          <path d={`M505 ${SR.y - 28} L536 ${470 + lift} M575 ${SR.y - 28} L544 ${470 + lift}`} stroke="#3a3845" strokeWidth={10} strokeLinecap="round" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={600} cy={470 + i * 40 + lift} r={5} fill="#c9ccd6" />
          ))}
        </g>
      ) : (
        <g>
          <path d={`M500 ${SR.y - 26} Q540 ${SR.y + 20} 580 ${SR.y - 26}`} fill={topDark} stroke={INK} strokeWidth={5} />
          <path d={`M528 ${SR.y - 4} l-4 54 M552 ${SR.y - 4} l4 54`} stroke="#f8f9fa" strokeWidth={5} strokeLinecap="round" />
          <path d={`M478 ${600 + lift} h124 l-8 48 h-108 z`} fill={topDark} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
      )}
      {/* strap */}
      <path d={`M${SR.x + 8} ${SR.y - 20} L${toWorld(150, -70).x} ${toWorld(150, -70).y}`} stroke="#5b3a29" strokeWidth={16} strokeLinecap="round" />

      {/* fretting arm (behind the guitar neck, the hand wraps it) */}
      <Arm S={SL} E={eL} H={fHand} sleeve={top} />

      {/* the guitar */}
      <g transform={`translate(${GX} ${GY}) rotate(${GANG})`}>
        <GuitarBody color={p.guitar.color} color2={p.guitar.color2} flames={p.guitar.flames} />
        <Neck headColor={p.guitar.head} />
        {/* strings */}
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <line key={s} x1={-10} y1={stringY(s, -10)} x2={NUT + 40} y2={stringY(s, NUT + 40) * 0.8} stroke="#e8e8ee" strokeWidth={0.8 + s * 0.28} opacity={0.9} />
        ))}
        {ringLines}
        {/* fretting fingers: palm under the neck, fingertip on the string */}
        <ellipse cx={fLocal.x + 4} cy={22} rx={20} ry={14} fill={SKIN} stroke={INK} strokeWidth={4} />
        <path d={`M${fLocal.x + 16} 18 Q${fLocal.x + 20} ${fLocal.y - 8} ${fLocal.x} ${fLocal.y - 4}`} fill="none" stroke={INK} strokeWidth={15} strokeLinecap="round" />
        <path d={`M${fLocal.x + 16} 18 Q${fLocal.x + 20} ${fLocal.y - 8} ${fLocal.x} ${fLocal.y - 4}`} fill="none" stroke={SKIN} strokeWidth={9} strokeLinecap="round" />
        <circle cx={fLocal.x} cy={fLocal.y} r={6.5} fill={SKIN_SH} stroke={INK} strokeWidth={2.5} />
        <path d={`M${fLocal.x - 16} 20 Q${fLocal.x - 30} ${fLocal.y - 2} ${fLocal.x - 18} ${fLocal.y - 14}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" opacity={0.95} />
        <path d={`M${fLocal.x - 16} 20 Q${fLocal.x - 30} ${fLocal.y - 2} ${fLocal.x - 18} ${fLocal.y - 14}`} fill="none" stroke={SKIN} strokeWidth={8} strokeLinecap="round" />
      </g>

      {/* picking arm in front */}
      <Arm S={SR} E={eR} H={pHand} sleeve={top} />
      <g transform={`translate(${pHand.x} ${pHand.y}) rotate(${GANG + p.pickDir * p.pick * 12})`}>
        <ellipse cx={0} cy={0} rx={24} ry={19} fill={SKIN} stroke={INK} strokeWidth={5} />
        <path d="M-6 -16 l10 -14 l10 14 z" fill="#ffd166" stroke={INK} strokeWidth={3} transform="rotate(-30)" />
        <path d="M-14 -6 q10 6 22 0" fill="none" stroke={INK} strokeWidth={3} />
      </g>

      {/* head */}
      <g transform={`translate(${hx} ${hy}) rotate(${tilt})`}>
        {/* spiky hair back */}
        <path
          d="M-112 10 L-128 -40 L-96 -52 L-112 -104 L-64 -96 L-60 -150 L-18 -116 L6 -164 L30 -116 L74 -146 L72 -96 L120 -102 L100 -54 L132 -36 L110 8 Z"
          fill={rocker ? "#d62828" : "#f77f00"}
          stroke={INK}
          strokeWidth={7}
          strokeLinejoin="round"
        />
        <ellipse cx={-102} cy={16} rx={18} ry={24} fill={SKIN} stroke={INK} strokeWidth={5} />
        <ellipse cx={102} cy={16} rx={18} ry={24} fill={SKIN} stroke={INK} strokeWidth={5} />
        <ellipse cx={0} cy={6} rx={100} ry={96} fill={SKIN} stroke={INK} strokeWidth={7} />
        {/* fringe */}
        <path d="M-96 -24 Q-80 -84 0 -88 Q80 -84 96 -24 L70 -44 L56 -12 L30 -50 L6 -18 L-20 -54 L-40 -16 L-60 -50 Z" fill={rocker ? "#d62828" : "#f77f00"} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {rocker ? <path d="M-98 -30 Q0 -58 98 -30 L96 -12 Q0 -40 -96 -12 Z" fill="#111" stroke={INK} strokeWidth={4} /> : null}
        <g transform="translate(0 16)">
          {face === "rock" ? (
            <g>
              <path d="M-70 -24 H70 L62 6 Q36 16 10 4 L0 -6 L-10 4 Q-36 16 -62 6 Z" fill="#111" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
              <path d="M-54 -16 l16 0 M24 -16 l16 0" stroke="#8ecae6" strokeWidth={5} strokeLinecap="round" />
            </g>
          ) : (
            [-36, 36].map(eye)
          )}
          {/* brows */}
          {face === "confused" ? (
            <g>
              <path d="M-54 -38 L-20 -30" stroke={INK} strokeWidth={6} strokeLinecap="round" />
              <path d="M20 -44 Q36 -56 54 -46" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
            </g>
          ) : face === "focus" || face === "wince" ? (
            <path d="M-52 -34 L-20 -28 M20 -28 L52 -34" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          ) : face !== "rock" ? (
            <path d="M-52 -38 Q-36 -48 -20 -38 M20 -38 Q36 -48 52 -38" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          ) : null}
          {mouth}
          {face === "happy" || face === "proud" ? (
            <g opacity={0.55}>
              <ellipse cx={-62} cy={24} rx={14} ry={8} fill="#ff8fa3" />
              <ellipse cx={62} cy={24} rx={14} ry={8} fill="#ff8fa3" />
            </g>
          ) : null}
          {face === "confused" || face === "wince" ? (
            <path d={`M78 ${-40 + ((t * 40) % 30)} q-10 16 0 22 q10 -6 0 -22z`} fill="#9fdcff" stroke={INK} strokeWidth={3} />
          ) : null}
        </g>
      </g>
    </g>
  );
};
