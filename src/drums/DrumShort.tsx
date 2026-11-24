import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import narration from "../reels/drum-levels/audio.generated.json";
import perfJson from "./short-groove-metal.hits.json";
import { hitsPerSecond, impulse, preparePerformance, type Performance } from "./hits";
import { DrumStage } from "./Stage3D";
import { CameraDirector, type ShotName } from "./CameraDirector";
import { Highway } from "./Highway";
import { usePreloadDrummer } from "./Drummer";
import { DrumScene2D } from "../drums2d/Scene2D";
import { SHOTS2D, cameraTransform, shot2dForBar } from "../drums2d/Camera2D";

/*
 * SHORT (9:16): robot drummer plays an original groove-metal intro
 * (tom-driven, syncopated, double kick). Not a transcription of any song.
 */
export const FPS = 30;
const perf = preparePerformance(perfJson as Performance);
const sfx = narration.sfx as Record<string, { file: string; durationMs: number }>;
const LEAD = 20; // frames before the count-in
const OUTRO = 75;
export const DRUM_SHORT_DURATION = LEAD + Math.round(perf.duration * FPS) + OUTRO;
const ACCENT = "#ff3b5c";
const PLAN: ShotName[] = ["wide", "face", "hero", "toms", "kick", "side", "overhead", "face", "hats", "wide"];
const FONT = "Inter, Helvetica, Arial, sans-serif";

export const DrumShort: React.FC<{ look?: "3d" | "2d" }> = ({ look = "3d" }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const drummerReady = usePreloadDrummer(look === "3d");
  const now = (frame - LEAD) / fps;
  const t = frame / fps;
  const active = now >= 0 && now < perf.duration ? perf : null;

  const bar = Math.floor((now - perf.countIn) / perf.barLen);
  let shot: ShotName = "face";
  let shotStart = 0;
  if (now < perf.countIn) {
    shot = "face";
    shotStart = -LEAD / fps;
  } else if (now < perf.duration) {
    shot = PLAN[Math.floor(bar / 2) % PLAN.length];
    shotStart = perf.countIn + Math.floor(bar / 2) * 2 * perf.barLen;
  } else {
    shot = "wide";
    shotStart = perf.duration;
  }
  const crash = active ? Math.max(impulse(perf.byPiece.crash, now, 0.18), impulse(perf.byPiece.china, now, 0.18)) : 0;
  const shake = active ? crash * 0.03 + impulse(perf.byPiece.kick, now, 0.05) * 0.004 : 0;
  const hps = active ? hitsPerSecond(perf, now) : 0;
  const hookIn = spring({ frame, fps, config: { damping: 12 } });
  const hookOut = interpolate(frame, [LEAD + 60, LEAD + 75], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const endIn = spring({ frame: frame - (DRUM_SHORT_DURATION - OUTRO), fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#05040a" }}>
      {look === "2d" ? (
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <g
            transform={cameraTransform(
              now < perf.countIn ? SHOTS2D.mid : now >= perf.duration ? SHOTS2D.crowd : shot2dForBar(3, bar),
              width,
              780,
              1.0,
              active && now > perf.countIn ? (((now - perf.countIn) / (perf.barLen * 2)) % 1) : 0,
              crash,
              Math.sin(frame * 7.1) * shake * 900,
              Math.cos(frame * 5.3) * shake * 900,
            )}
          >
            <DrumScene2D
              perf={active ? perf : null}
              now={now}
              t={t}
              accent={ACCENT}
              mood={now >= perf.duration - 1.5 ? "victory" : active && now > perf.countIn ? "beast" : "focus"}
              crowdHype={active && now > perf.countIn ? 1 : 0.4}
            />
          </g>
        </svg>
      ) : drummerReady ? (
        <ThreeCanvas width={width} height={height} camera={{ fov: 42, position: [0, 1.5, 3.7], near: 0.05, far: 60 }}>
          <CameraDirector shot={shot} u={now - shotStart} shake={shake} seed={frame} portrait />
          <DrumStage perf={active ? perf : null} now={now} accent={ACCENT} energy={active && now > perf.countIn ? 1 : 0.2} t={t} drummer pyro />
        </ThreeCanvas>
      ) : null}
      <AbsoluteFill style={{ backgroundColor: "white", opacity: crash * 0.1, mixBlendMode: "overlay" }} />

      {/* hook */}
      <AbsoluteFill style={{ alignItems: "center", fontFamily: FONT, opacity: hookOut }}>
        <div
          style={{
            marginTop: 230,
            transform: `scale(${hookIn})`,
            textAlign: "center",
            fontSize: 92,
            fontWeight: 900,
            lineHeight: 1.05,
            color: "white",
            WebkitTextStroke: "12px #05040a",
            paintOrder: "stroke",
            padding: "0 40px",
          }}
        >
          {look === "2d" ? (
            <>
              When the drummer goes <span style={{ color: ACCENT }}>BEAST MODE</span> 🤘
            </>
          ) : (
            <>
              Robot drummer vs <span style={{ color: ACCENT }}>GROOVE METAL</span> 🤘
            </>
          )}
        </div>
      </AbsoluteFill>

      {/* meter */}
      {active && now > perf.countIn ? (
        <div style={{ position: "absolute", top: 180, right: 50, textAlign: "right", fontFamily: FONT, color: "white" }}>
          <div style={{ fontSize: 26, letterSpacing: 4, opacity: 0.7 }}>HITS / SEC</div>
          <div style={{ fontSize: 110, fontWeight: 900, lineHeight: 1, color: hps >= 18 ? ACCENT : "white", textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>{hps}</div>
          <div style={{ fontSize: 30, fontWeight: 800, opacity: 0.85 }}>{perf.bpm} BPM</div>
        </div>
      ) : null}

      <Highway perf={active ? perf : null} now={now} accent={ACCENT} ahead={1.2} W={1080} H0={1920} top={1470} laneH={30} />

      {/* end card */}
      {frame >= DRUM_SHORT_DURATION - OUTRO ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
          <div
            style={{
              transform: `scale(${endIn})`,
              textAlign: "center",
              padding: "34px 50px",
              borderRadius: 30,
              background: "rgba(8,7,14,0.65)",
              backdropFilter: "blur(12px)",
              border: `4px solid ${ACCENT}`,
              color: "white",
              marginTop: -300,
            }}
          >
            <div style={{ fontSize: 76, fontWeight: 900 }}>Could you keep up? 🥁</div>
            <div style={{ fontSize: 40, opacity: 0.8, marginTop: 10 }}>Full "3 Levels of Drums" on my channel</div>
          </div>
        </AbsoluteFill>
      ) : null}

      <Sequence from={LEAD} layout="none">
        <Audio src={staticFile("drums/short-groove-metal.mp3")} />
      </Sequence>
      <Sequence from={0} layout="none">
        <Audio src={staticFile(sfx.whoosh.file)} volume={0.6} />
      </Sequence>
      <Sequence from={DRUM_SHORT_DURATION - OUTRO - 30} layout="none">
        <Audio src={staticFile(sfx.crowd.file)} volume={0.6} />
      </Sequence>
    </AbsoluteFill>
  );
};
