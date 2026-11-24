import { AbsoluteFill } from "remotion";
import { Pianist } from "./Pianist";
import { Room } from "./Room";
import { Keyboard } from "./Keyboard";

const FONT = "Inter, Helvetica, Arial, sans-serif";
const LEVELS = [
  { name: "EASY", color: "#4ade80", stars: 1, size: 70 },
  { name: "MEDIUM", color: "#fbbf24", stars: 2, size: 84 },
  { name: "HARD", color: "#f87171", stars: 3, size: 130 },
];

const Stars: React.FC<{ n: number; color: string; size: number }> = ({ n, color, size }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {[1, 2, 3].map((i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24">
        <path
          d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z"
          fill={i <= n ? color : "rgba(255,255,255,0.18)"}
          stroke="#0e0d16"
          strokeWidth={1.5}
        />
      </svg>
    ))}
  </div>
);

/** YouTube thumbnail, 1280x720. */
export const PianoThumbnail: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0e0d16" }}>
    {/* room + sweating pianist, zoomed in on the left */}
    <svg viewBox="330 150 900 506" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", left: -330, width: 1280 + 330 }}>
      <Room t={0.4} />
      <g transform="translate(40,0)">
        <Pianist mood="hard" pressL={0.6} pressR={1} t={0.35} />
      </g>
    </svg>
    {/* darken the right side so the text pops */}
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(14,13,22,0) 42%, rgba(14,13,22,0.85) 70%)" }} />

    <div style={{ position: "absolute", right: 50, top: 40, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, fontFamily: FONT }}>
      {LEVELS.map((l) => (
        <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Stars n={l.stars} color={l.color} size={l.size * 0.48} />
          <div
            style={{
              fontSize: l.size,
              fontWeight: 900,
              color: l.color,
              lineHeight: 1.02,
              letterSpacing: -2,
              WebkitTextStroke: "8px #0e0d16",
              paintOrder: "stroke",
              transform: l.name === "HARD" ? "rotate(-3deg)" : "none",
            }}
          >
            {l.name}
          </div>
        </div>
      ))}
    </div>

    {/* glowing keyboard strip */}
    <svg viewBox="0 0 1920 150" width={1280} height={100} style={{ position: "absolute", left: 0, bottom: 0 }}>
      <Keyboard
        y={8}
        width={1920}
        height={150}
        active={[48, 52, 55, 60, 64, 67, 72, 76, 79, 84].map((m, i) => ({ t: 0, d: 1, m, v: 80, h: i < 3 ? "L" : "R" }))}
      />
    </svg>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 100, height: 60, background: "linear-gradient(0deg, rgba(79,195,247,0.45), rgba(79,195,247,0))" }} />

    {/* big headline */}
    <div
      style={{
        position: "absolute",
        left: 40,
        bottom: 118,
        fontFamily: FONT,
        fontSize: 92,
        fontWeight: 900,
        color: "white",
        letterSpacing: -3,
        lineHeight: 1,
        WebkitTextStroke: "12px #0e0d16",
        paintOrder: "stroke",
      }}
    >
      3 LEVELS OF <span style={{ color: "#4fc3f7" }}>PIANO</span>
    </div>
  </AbsoluteFill>
);
