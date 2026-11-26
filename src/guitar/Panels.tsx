import React from "react";
import { STRING_COLORS, STRING_NAMES, noteName, upperBound, type GNote, type Prepared } from "./notes";

const FONT = "Inter, 'Helvetica Neue', Arial, sans-serif";
const WOOD = "#3b2417";

/**
 * Close-up fretboard (high e on top, like tab). Shows a 12-fret window that
 * follows the hand, the notes sounding now (filled, with fret number) and the
 * next note (dashed ring) so viewers can play along.
 */
export const Fretboard: React.FC<{
  width: number;
  height: number;
  song: Prepared | null;
  now: number;
  windowStart: number;
  t: number;
}> = ({ width, height, song, now, windowStart, t }) => {
  const N = 12;
  const left = 96;
  const right = width - 28;
  const fw = (right - left) / N;
  const top = 34;
  const bottom = height - 58;
  const sy = (s: number) => top + ((s - 1) / 5) * (bottom - top);
  const w0 = windowStart;
  // x of fret wire n
  const wx = (n: number) => left + (n - w0) * fw;
  // x where a note on fret f is shown
  const nx = (f: number) => (f === 0 ? Math.max(left - 44, wx(0) - 44) : wx(f - 0.5));

  const active: GNote[] = [];
  let next: GNote[] = [];
  if (song) {
    const to = upperBound(song.starts, now);
    for (let i = Math.max(0, to - 12); i < to; i++) {
      const n = song.notes[i];
      if (now < n.t + Math.max(n.d, 0.14)) active.push(n);
    }
    if (to < song.notes.length) {
      const t0 = song.notes[to].t;
      next = song.notes.slice(to, to + 8).filter((n) => n.t - t0 < 0.05);
    }
  }

  const frets = [];
  for (let n = Math.floor(w0); n <= Math.ceil(w0 + N); n++) {
    if (n < 0 || n > 22) continue;
    const x = wx(n);
    if (x < left - 2 || x > right + 2) continue;
    frets.push(
      <g key={n}>
        <rect x={x - (n === 0 ? 7 : 3)} y={top - 14} width={n === 0 ? 14 : 6} height={bottom - top + 28} rx={2} fill={n === 0 ? "#f4f1e8" : "#c9ccd6"} />
        {n > 0 ? (
          <text x={wx(n - 0.5)} y={height - 16} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={26} fill={[3, 5, 7, 9, 12, 15, 17, 19, 21].includes(n) ? "#ffe066" : "rgba(255,255,255,0.45)"}>
            {n}
          </text>
        ) : null}
      </g>,
    );
  }
  const inlays = [3, 5, 7, 9, 15, 17, 19, 21]
    .map((n) => ({ n, x: wx(n - 0.5) }))
    .filter((o) => o.x > left && o.x < right);
  const doubleX = wx(11.5);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <clipPath id="fbclip">
          <rect x={left - 60} y={0} width={right - left + 60} height={height} />
        </clipPath>
        <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4e301f" />
          <stop offset="0.5" stopColor={WOOD} />
          <stop offset="1" stopColor="#2a190f" />
        </linearGradient>
      </defs>
      {/* string labels */}
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <text key={s} x={22} y={sy(s) + 9} fontFamily={FONT} fontWeight={900} fontSize={26} fill={STRING_COLORS[s]}>
          {STRING_NAMES[s]}
        </text>
      ))}
      <g clipPath="url(#fbclip)">
        <rect x={left - 60} y={top - 14} width={right - left + 60} height={bottom - top + 28} rx={10} fill="url(#wood)" stroke="#0d0b10" strokeWidth={3} />
        {inlays.map((o) => (
          <circle key={o.n} cx={o.x} cy={(top + bottom) / 2} r={10} fill="#efe9da" opacity={0.8} />
        ))}
        {doubleX > left && doubleX < right ? (
          <g>
            <circle cx={doubleX} cy={sy(2) + (sy(3) - sy(2)) / 2} r={10} fill="#efe9da" opacity={0.8} />
            <circle cx={doubleX} cy={sy(4) + (sy(5) - sy(4)) / 2} r={10} fill="#efe9da" opacity={0.8} />
          </g>
        ) : null}
        {frets}
        {/* strings */}
        {[1, 2, 3, 4, 5, 6].map((s) => {
          const ring = active.find((n) => n.s === s);
          const amp = ring ? Math.max(0, 1 - (now - ring.t) / Math.max(0.25, ring.d + 0.1)) : 0;
          const x0 = ring ? (ring.f > 0 ? wx(ring.f - 0.25) : wx(0)) : 0;
          const pts: string[] = [];
          if (ring) {
            for (let k = 0; k <= 30; k++) {
              const x = x0 + ((right + 40 - x0) * k) / 30;
              pts.push(`${x.toFixed(1)},${(sy(s) + Math.sin((k / 30) * Math.PI) * Math.sin(t * 80 + s) * 5 * amp).toFixed(2)}`);
            }
          }
          return (
            <g key={s}>
              <line x1={left - 60} y1={sy(s)} x2={right} y2={sy(s)} stroke="#e7e3da" strokeWidth={1.4 + s * 0.75} opacity={ring ? 0.25 : 0.9} />
              {ring ? (
                <g>
                  <line x1={left - 60} y1={sy(s)} x2={x0} y2={sy(s)} stroke="#e7e3da" strokeWidth={1.4 + s * 0.75} />
                  <polyline points={pts.join(" ")} fill="none" stroke={ring.miss ? "#ff4d4d" : STRING_COLORS[s]} strokeWidth={2 + s * 0.8} />
                </g>
              ) : null}
            </g>
          );
        })}
        {/* next note ghost */}
        {next.map((n, i) => (
          <circle key={`n${i}`} cx={nx(n.f)} cy={sy(n.s)} r={26} fill="none" stroke="white" strokeWidth={4} strokeDasharray="7 6" opacity={0.7} />
        ))}
        {/* sounding notes */}
        {active.map((n, i) => {
          const age = now - n.t;
          const pop = 1 + 0.35 * Math.exp(-age / 0.06);
          const color = n.miss ? "#ff3b3b" : STRING_COLORS[n.s];
          return (
            <g key={`a${i}`} transform={`translate(${nx(n.f)} ${sy(n.s)}) scale(${pop})`}>
              <circle r={40} fill={color} opacity={0.25} />
              <circle r={29} fill={color} stroke="#14121a" strokeWidth={4} />
              <text y={11} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill="#14121a">
                {n.miss && n.tech === "buzz" ? "✕" : n.f}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/** Scrolling guitar tab: notes travel right-to-left into the playhead. */
export const TabStrip: React.FC<{ width: number; height: number; song: Prepared | null; now: number; pxPerSec: number }> = ({ width, height, song, now, pxPerSec }) => {
  const playX = 150;
  const top = 26;
  const bottom = height - 26;
  const sy = (s: number) => top + ((s - 1) / 5) * (bottom - top);
  const items = [];
  if (song) {
    const lo = upperBound(song.starts, now - playX / pxPerSec - 0.2);
    const hi = upperBound(song.starts, now + (width - playX) / pxPerSec + 0.2);
    for (let i = lo; i < hi; i++) {
      const n = song.notes[i];
      const x = playX + (n.t - now) * pxPerSec;
      const passed = n.t <= now;
      const hit = passed && now - n.t < Math.max(0.12, n.d);
      const color = n.miss ? "#ff3b3b" : STRING_COLORS[n.s];
      const label = n.miss && n.tech === "buzz" ? "x" : String(n.f) + (n.tech === "dive" ? "↘" : n.tech === "vib" ? "~" : "");
      const w = 16 + label.length * 17;
      items.push(
        <g key={i} transform={`translate(${x} ${sy(n.s)}) scale(${hit ? 1.25 : 1})`} opacity={passed && !hit ? 0.35 : 1}>
          <rect x={-w / 2} y={-19} width={w} height={38} rx={10} fill={hit ? color : "#16141d"} stroke={color} strokeWidth={3} />
          <text y={10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={28} fill={hit ? "#14121a" : "white"}>
            {label}
          </text>
        </g>,
      );
    }
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <text x={18} y={height / 2 - 10} fontFamily={FONT} fontWeight={900} fontSize={22} fill="rgba(255,255,255,0.55)" transform={`rotate(-90 ${30} ${height / 2})`} textAnchor="middle">
        TAB
      </text>
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <line key={s} x1={60} y1={sy(s)} x2={width - 10} y2={sy(s)} stroke="rgba(255,255,255,0.28)" strokeWidth={2} />
      ))}
      <rect x={playX - 3} y={top - 18} width={6} height={bottom - top + 36} rx={3} fill="#ffe066" />
      {items}
    </svg>
  );
};

/** "String 3 · Fret 9 · B3" readout for the note being played. */
export const NoteReadout: React.FC<{ song: Prepared | null; now: number }> = ({ song, now }) => {
  if (!song) return null;
  const i = upperBound(song.starts, now) - 1;
  if (i < 0) return <div style={{ height: 52 }} />;
  const n = song.notes[i];
  const color = n.miss ? "#ff3b3b" : STRING_COLORS[n.s];
  const label = n.miss ? (n.tech === "buzz" ? "BUZZ!" : "WRONG NOTE") : noteName(n.m);
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", fontFamily: FONT, fontWeight: 900, fontSize: 34, color: "white", height: 52 }}>
      <span style={{ background: color, color: "#14121a", borderRadius: 12, padding: "2px 16px" }}>STRING {n.s} ({STRING_NAMES[n.s]})</span>
      <span style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "2px 16px" }}>{n.f === 0 ? "OPEN" : `FRET ${n.f}`}</span>
      <span style={{ color, minWidth: 120 }}>{label}</span>
    </div>
  );
};
