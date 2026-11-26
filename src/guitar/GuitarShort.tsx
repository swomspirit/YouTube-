import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import narration from "../reels/guitar-100-days/audio.generated.json";
import d1 from "./day1.notes.json";
import d7 from "./day7.notes.json";
import d30 from "./day30.notes.json";
import d100 from "./day100.notes.json";
import { activeNotes, handPos, onsetIndex, prepare, pulse, type GSong, type Prepared } from "./notes";
import { Guitarist, type Face, type Outfit } from "./Guitarist";
import { Fretboard, NoteReadout, TabStrip } from "./Panels";
import { Bedroom, Crowd, Garage, Sparks, Stage } from "./Backgrounds";

/*
 * SHORT (9:16): "I learned guitar from ZERO" - Day 1 -> Day 100.
 * Song: In the Hall of the Mountain King (Grieg, 1875, public domain), our own
 * arrangement, synthesised from the same note data the animation uses.
 */
export const FPS = 30;
const FONT = "Inter, 'Helvetica Neue', Arial, sans-serif";
const lines = narration.lines as Record<string, { file: string; durationMs: number }>;
const sfx = narration.sfx as Record<string, { file: string; durationMs: number }>;
const f = (sec: number) => Math.round(sec * FPS);

type Bg = "evening" | "bedroom" | "garage" | "stage";
const DAYS: {
  day: number;
  file: string;
  song: Prepared;
  voice: string;
  bg: Bg;
  face: Face;
  outfit: Outfit;
  sub: string;
  color: string;
  px: number;
  guitar: { color: string; color2: string; head: string; flames: boolean };
}[] = [
  { day: 1, file: "guitar/day1.mp3", song: prepare(d1 as GSong), voice: "day1", bg: "evening", face: "confused", outfit: "hoodie", sub: "never touched a guitar", color: "#ff6b6b", px: 330, guitar: { color: "#c8553d", color2: "#f2a65a", head: "#4a2c1d", flames: false } },
  { day: 7, file: "guitar/day7.mp3", song: prepare(d7 as GSong), voice: "day7", bg: "bedroom", face: "focus", outfit: "hoodie", sub: "slow, with a metronome", color: "#ffd166", px: 380, guitar: { color: "#c8553d", color2: "#f2a65a", head: "#4a2c1d", flames: false } },
  { day: 30, file: "guitar/day30.mp3", song: prepare(d30 as GSong), voice: "day30", bg: "garage", face: "happy", outfit: "hoodie", sub: "faster, with a band", color: "#06d6a0", px: 540, guitar: { color: "#1d3557", color2: "#457b9d", head: "#1d3557", flames: false } },
  { day: 100, file: "guitar/day100.mp3", song: prepare(d100 as GSong), voice: "day100", bg: "stage", face: "rock", outfit: "rocker", sub: "FULL SPEED", color: "#ff006e", px: 880, guitar: { color: "#9d0208", color2: "#e85d04", head: "#111", flames: true } },
];

const buildTimeline = () => {
  let t = 0;
  const days = DAYS.map((d, i) => {
    const card = { start: t, end: t + f(lines[d.voice].durationMs / 1000) + (i === 0 ? 14 : 10) };
    t = card.end;
    const play = { start: t, end: t + f(d.song.duration) };
    t = play.end;
    return { ...d, card, play };
  });
  const outro = { start: t, end: t + f(lines.outro.durationMs / 1000) + 80 };
  return { days, outro, end: outro.end };
};
const TL = buildTimeline();
export const GUITAR_SHORT_DURATION = TL.end;

// layout (px)
const SCENE_TOP = 222;
const SCENE_H = 780;

const windowStartFor = (song: Prepared, now: number) => {
  let sum = 0;
  let n = 0;
  for (let k = 0; k <= 10; k++) {
    sum += handPos(song, now - 0.5 + k * 0.05).fret;
    n++;
  }
  return Math.max(0, Math.min(10, sum / n - 5.5));
};

export const GuitarShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const idx = TL.days.findIndex((d) => frame >= d.card.start && frame < d.play.end);
  const inOutro = frame >= TL.outro.start;
  const cur = idx >= 0 ? TL.days[idx] : TL.days[TL.days.length - 1];
  const inCard = idx >= 0 && frame < cur.card.end;
  const playing = idx >= 0 && !inCard;
  const now = playing ? (frame - cur.play.start) / fps : inOutro ? (frame - cur.play.start) / fps : -1;
  const song = cur.song;
  const live = playing || inOutro;

  // --- performance state ---
  const hp = now >= 0 ? handPos(song, now) : { fret: song.onsets[0]?.fret ?? 3, s: song.onsets[0]?.s ?? 4 };
  const act = now >= 0 ? activeNotes(song, now) : [];
  const recentMiss = now >= 0 && song.notes.some((n) => n.miss && now >= n.t && now - n.t < 0.45);
  const kIdx = now >= 0 ? onsetIndex(song.onsetTimes, now) : -1;
  const pk = now >= 0 ? pulse(song.onsetTimes, now, 0.07) : 0;
  const pickString = kIdx >= 0 ? song.onsets[kIdx].s : 3.5;
  const beatPulse = live && song.beats.length ? pulse(song.beats, now, 0.12) : 0;
  const dive =
    cur.day === 100 && song.diveStart && now > song.diveStart - 0.25 ? Math.min(1, (now - (song.diveStart - 0.25)) / 0.3) * (now < (song.diveEnd ?? 0) + 0.6 ? 1 : Math.max(0, 1 - (now - (song.diveEnd ?? 0) - 0.6) * 3)) : 0;
  const finale = cur.day === 100 && song.diveStart ? interpolate(now, [song.diveStart - 2.2, song.diveStart - 1.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

  let face: Face = cur.face;
  if (recentMiss) face = "wince";
  if (inOutro) face = "proud";
  if (inCard && cur.day === 1) face = "confused";

  const ringing = act.map((n) => ({ s: n.s, f: n.f, amp: Math.max(0, 1 - (now - n.t) / Math.max(0.3, n.d + 0.1)) }));

  // --- cards ---
  const cardIn = inCard ? spring({ frame: frame - cur.card.start, fps, config: { damping: 11, mass: 0.7 } }) : 0;
  const cardOut = inCard ? interpolate(frame, [cur.card.end - 8, cur.card.end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const prevDay = idx > 0 ? TL.days[idx - 1].day : 0;
  const shownDay = inCard
    ? Math.round(interpolate(frame - cur.card.start, [0, 16], [prevDay, cur.day], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }))
    : cur.day;
  const headerPop = inCard ? spring({ frame: frame - cur.card.start - 14, fps, config: { damping: 8 } }) : 1;

  // --- camera ---
  const kick = cur.day === 100 && playing ? beatPulse : 0;
  const shakeX = kick * (random(`sx${frame}`) - 0.5) * 10 + (dive > 0 ? (random(`dx${frame}`) - 0.5) * 14 * dive : 0);
  const shakeY = kick * (random(`sy${frame}`) - 0.5) * 8;
  const zoom = 1 + (cur.day === 100 ? 0.03 * beatPulse + 0.05 * finale : cur.day === 30 ? 0.015 * beatPulse : 0);

  const outroIn = inOutro ? spring({ frame: frame - TL.outro.start, fps, config: { damping: 10 } }) : 0;
  const jump = inOutro ? Math.abs(Math.sin((frame - TL.outro.start) / 7)) * 40 : 0;
  const progress = interpolate(frame, [0, TL.days[3].play.end], [0, 1], { extrapolateRight: "clamp" });
  const songProgress = playing ? Math.min(1, now / song.duration) : 0;

  const bg = cur.bg;
  const stageEnergy = cur.day === 100 ? 0.6 + 0.4 * beatPulse + finale * 0.5 : 0;

  return (
    <AbsoluteFill style={{ background: "#0d0b14", fontFamily: FONT }}>
      {/* ---------- header ---------- */}
      <div style={{ position: "absolute", top: 46, left: 0, width: 1080, textAlign: "center", color: "white" }}>
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 4, opacity: 0.9 }}>
          LEARNING GUITAR FROM <span style={{ color: "#ffd166" }}>ZERO</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 22, marginTop: 2 }}>
          <div style={{ fontSize: 112, fontWeight: 900, lineHeight: 1, color: cur.color, transform: `scale(${0.85 + 0.15 * headerPop})`, textShadow: "0 6px 0 rgba(0,0,0,0.5)" }}>
            DAY {shownDay}
          </div>
        </div>
        {/* milestone track */}
        <div style={{ position: "relative", margin: "12px auto 0", width: 760, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.14)" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: 14, borderRadius: 7, width: `${progress * 100}%`, background: "linear-gradient(90deg,#ff6b6b,#ffd166,#06d6a0,#ff006e)" }} />
        </div>
      </div>

      {/* ---------- scene ---------- */}
      <div style={{ position: "absolute", top: SCENE_TOP, left: 0, width: 1080, height: SCENE_H, overflow: "hidden" }}>
        <svg width={1080} height={SCENE_H} viewBox={`0 70 1080 ${SCENE_H}`}>
          <g transform={`translate(${540 + shakeX} ${460 + shakeY}) scale(${zoom}) translate(-540 -460)`}>
            {bg === "evening" || bg === "bedroom" ? <Bedroom t={t} evening={bg === "evening"} /> : bg === "garage" ? <Garage t={t} beat={beatPulse} /> : <Stage t={t} beat={beatPulse} energy={stageEnergy} />}
            {bg === "stage" ? <Sparks t={t} amount={finale} /> : null}
            <Guitarist
              t={t}
              face={face}
              outfit={cur.outfit}
              fret={hp.fret}
              string={hp.s}
              ringing={ringing}
              pick={pk}
              pickDir={kIdx % 2 === 0 ? 1 : -1}
              pickString={pickString}
              bob={cur.day >= 30 ? beatPulse : cur.day === 7 ? beatPulse * 0.4 : 0}
              headbang={cur.day === 100 && playing ? beatPulse * (dive > 0 ? 0 : 1) : 0}
              dive={dive}
              guitar={cur.guitar}
              jump={jump}
            />
            {bg === "stage" ? <Crowd t={t} beat={beatPulse} energy={0.6 + finale} /> : null}
            {/* Day 1 gags */}
            {cur.day === 1 && live
              ? [0, 1, 2].map((i) => {
                  const p = (t * 0.6 + i / 3) % 1;
                  return (
                    <text key={i} x={300 + i * 230} y={330 - p * 160} fontSize={90} fontWeight={900} fill="#ffd166" stroke="#1b1a22" strokeWidth={5} opacity={Math.sin(p * Math.PI)} fontFamily={FONT}>
                      ?
                    </text>
                  );
                })
              : null}
            {/* Day 7 metronome */}
            {cur.day === 7 ? (
              <g transform="translate(150 560)">
                <path d="M-50 120 L-25 -40 H25 L50 120 Z" fill="#8d5a3b" stroke="#1b1a22" strokeWidth={6} strokeLinejoin="round" />
                <line x1={0} y1={100} x2={Math.sin((playing ? now : 0) * Math.PI * 1.6) * 40} y2={-30} stroke="#1b1a22" strokeWidth={7} strokeLinecap="round" />
                <circle cx={0} cy={100} r={8} fill="#1b1a22" />
                <text x={0} y={150} textAnchor="middle" fontSize={30} fontWeight={900} fill="white" stroke="#1b1a22" strokeWidth={4} paintOrder="stroke" fontFamily={FONT}>
                  96 BPM
                </text>
              </g>
            ) : null}
          </g>
        </svg>

        {/* miss stamp */}
        {recentMiss && playing ? (
          <div style={{ position: "absolute", right: 70, top: 120, fontSize: 64, fontWeight: 900, color: "#ff3b3b", transform: "rotate(10deg)", textShadow: "0 4px 0 #000", WebkitTextStroke: "3px #1b1a22" }}>
            {song.notes.find((n) => n.miss && now >= n.t && now - n.t < 0.45)?.tech === "buzz" ? "BZZZT!" : "OOPS!"}
          </div>
        ) : null}

        {/* tempo badge */}
        {playing && cur.day >= 30 ? (
          <div style={{ position: "absolute", left: 30, top: 24, padding: "6px 18px", borderRadius: 14, background: "rgba(0,0,0,0.55)", color: "white", fontSize: 32, fontWeight: 900 }}>
            {cur.day === 30 ? "150 BPM" : `${Math.round(176 + (252 - 176) * Math.min(1, songProgress / 0.78))} BPM`}
          </div>
        ) : null}

        {/* day card */}
        {inCard ? (
          <AbsoluteFill style={{ background: `rgba(10,8,16,${0.55 * cardIn * cardOut})`, alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", transform: `scale(${0.4 + 0.6 * cardIn}) rotate(${(1 - cardIn) * -8}deg)`, opacity: cardOut }}>
              <div style={{ fontSize: 210, fontWeight: 900, color: cur.color, lineHeight: 0.95, WebkitTextStroke: "6px #1b1a22", textShadow: "0 12px 0 rgba(0,0,0,0.5)" }}>DAY {cur.day}</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: "white", marginTop: 10, textShadow: "0 4px 0 #000" }}>{cur.sub}</div>
            </div>
          </AbsoluteFill>
        ) : null}

        {/* outro */}
        {inOutro ? (
          <div style={{ position: "absolute", top: 560, left: 0, width: 1080, textAlign: "center", transform: `scale(${outroIn})` }}>
            <div style={{ fontSize: 80, fontWeight: 900, color: "#ffd166", WebkitTextStroke: "4px #1b1a22", textShadow: "0 8px 0 rgba(0,0,0,0.5)" }}>WHICH DAY ARE YOU ON?</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 14 }}>
              {TL.days.map((d) => (
                <div key={d.day} style={{ padding: "8px 22px", borderRadius: 16, background: d.color, color: "#14121a", fontSize: 40, fontWeight: 900, border: "4px solid #1b1a22" }}>
                  {d.day}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* ---------- play-along panels ---------- */}
      <div style={{ position: "absolute", top: SCENE_TOP + SCENE_H, left: 0, width: 1080, height: 1920 - SCENE_TOP - SCENE_H, background: "linear-gradient(#17141f,#0d0b14)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, height: 6, width: `${songProgress * 100}%`, background: cur.color }} />
        <div style={{ position: "absolute", top: 18, left: 28 }}>
          {playing ? <NoteReadout song={song} now={now} /> : <div style={{ height: 52, color: "rgba(255,255,255,0.6)", fontSize: 32, fontWeight: 800, lineHeight: "52px" }}>watch the fingers ↓</div>}
        </div>
        <div style={{ position: "absolute", top: 80, left: 0 }}>
          <Fretboard width={1080} height={300} song={live ? song : null} now={now} windowStart={now >= 0 ? windowStartFor(song, now) : 0} t={t} />
        </div>
        <div style={{ position: "absolute", top: 392, left: 0 }}>
          <TabStrip width={1080} height={196} song={live ? song : null} now={now} pxPerSec={cur.px} />
        </div>
        <div style={{ position: "absolute", top: 600, width: 1080, textAlign: "center", color: "rgba(255,255,255,0.55)", fontSize: 26, fontWeight: 700 }}>
          ♪ In the Hall of the Mountain King · Edvard Grieg (public domain)
        </div>
      </div>

      {/* ---------- audio ---------- */}
      {TL.days.map((d) => (
        <React.Fragment key={d.day}>
          <Sequence from={d.card.start + 3} durationInFrames={f(lines[d.voice].durationMs / 1000) + 10}>
            <Audio src={staticFile(lines[d.voice].file)} volume={1} />
          </Sequence>
          {d.day !== 1 ? (
            <Sequence from={d.card.start} durationInFrames={20}>
              <Audio src={staticFile(sfx.whoosh.file)} volume={0.5} />
            </Sequence>
          ) : null}
          <Sequence from={d.play.start} durationInFrames={d.play.end - d.play.start + (d.day === 100 ? TL.outro.end - TL.outro.start : 0)}>
            <Audio src={staticFile(d.file)} volume={0.9} />
          </Sequence>
        </React.Fragment>
      ))}
      <Sequence from={TL.days[0].play.start + f(4.75)} durationInFrames={f(1.5)}>
        <Audio src={staticFile(sfx.oops.file)} volume={0.55} />
      </Sequence>
      <Sequence from={TL.days[3].play.start + f((TL.days[3].song.diveEnd ?? 16) - 0.4)} durationInFrames={f(4)}>
        <Audio src={staticFile(sfx.cheer.file)} volume={0.7} />
      </Sequence>
      <Sequence from={TL.outro.start + 6} durationInFrames={f(lines.outro.durationMs / 1000) + 10}>
        <Audio src={staticFile(lines.outro.file)} />
      </Sequence>
    </AbsoluteFill>
  );
};
