import { AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import audio from "./audio.generated.json";
import { Bolt, Pip, Shade } from "../../cartoon/characters";
import { SiteB } from "../../cartoon/Backgrounds";
import { DialogueCaption } from "../../cartoon/DialogueCaption";
import { MemeText } from "../../cartoon/MemeText";
import { KillFeed } from "../../cartoon/KillFeed";
import { mouthFor, msToFrames, type Line } from "../../cartoon/dialogue";
import { INK } from "../../cartoon/style";

/*
 * REEL: "Teleporting next to the guy using his ult"
 * Pip sends his robot buddy off and stands frozen while controlling it.
 * Shade teleports in right next to his defenceless body.
 */

export const FPS = 30;
const lines = audio.lines as Record<string, Line>;
const sfx = audio.sfx as Record<string, { file: string; durationMs: number }>;
const len = (id: string) => msToFrames(lines[id].durationMs, FPS);

const PIP_COLOR = "#ff7a45";
const SHADE_COLOR = "#ff5bd8";

/** All beat timings (in frames), derived from the real audio lengths. */
const buildTimeline = () => {
  let t = 8;
  const T = {} as Record<string, number>;
  const mark = (name: string, advance: number) => {
    T[name] = t;
    t += advance;
  };
  mark("pip1", len("pip1") + 2);
  mark("zoom", 18); // buddy flies off
  mark("frozen", 48); // "Meanwhile, his body:" + crickets
  mark("teleport", 32); // shadow puddle + rise
  mark("lookPip", 12);
  mark("shade1", len("shade1") + 4);
  mark("pip2", len("pip2") + 6);
  mark("lookCam", 18);
  mark("shade2", len("shade2"));
  mark("bonk", 30);
  mark("boltBack", 26);
  mark("boltDies", 54);
  mark("end", 0);
  return T;
};
export const T = buildTimeline();
export const TELEPORT_ULT_DURATION = T.end;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const TeleportUlt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---------- Pip ----------
  const pipFrozen = frame >= T.zoom + 6;
  const pipDead = frame >= T.bonk;
  const fall = spring({ frame: frame - T.bonk, fps, config: { damping: 9, stiffness: 160 } });
  const pipRot = pipDead ? -88 * fall : 0;
  const pipTalking1 = mouthFor(lines.pip1, T.pip1, frame, fps);
  const pipTalking2 = mouthFor(lines.pip2, T.pip2, frame, fps);
  const pipEyes = pipDead ? "x" : pipFrozen ? "focus" : "open";
  const pipBrows = frame >= T.pip2 && !pipDead ? "angry" : "none";
  const jiggle = pipFrozen && !pipDead ? Math.sin(frame * 2.3) : 0;

  // ---------- Bolt ----------
  const hover = Math.sin(frame / 6) * 10;
  const boltOut = interpolate(frame, [T.zoom, T.zoom + 14], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const boltBack = interpolate(frame, [T.boltBack, T.boltBack + 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const boltDrop = interpolate(frame, [T.boltDies + 12, T.boltDies + 26], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  let boltX = 860 + boltOut * 700;
  let boltY = 1060 + hover;
  let boltTilt = boltOut * 25;
  let boltMood: "happy" | "sad" | "off" = "happy";
  if (frame >= T.boltBack) {
    boltX = 1300 - boltBack * 420;
    boltY = 1150 + hover * (1 - boltDrop) + boltDrop * 120;
    boltTilt = -10 + boltDrop * 40;
    boltMood = frame >= T.boltDies + 12 ? "off" : "sad";
  }

  // ---------- Shade ----------
  const puddle = interpolate(frame, [T.teleport, T.teleport + 10, T.teleport + 30, T.teleport + 44], [0, 1, 1, 0], clamp);
  const rise = interpolate(frame, [T.teleport + 8, T.teleport + 26], [1, 0], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const shadeVisible = frame >= T.teleport + 8;
  const shadeLook = frame >= T.lookCam ? 0 : frame >= T.lookPip ? 1 : 0;
  const shadeEyes = frame >= T.lookCam && frame < T.bonk ? "narrow" : "normal";
  const shadeTalk = Math.max(mouthFor(lines.shade1, T.shade1, frame, fps), mouthFor(lines.shade2, T.shade2, frame, fps));
  const armSwing = interpolate(frame, [T.bonk - 4, T.bonk, T.bonk + 14], [0, 1, 0.2], clamp);

  // ---------- Camera ----------
  const zoomIn = interpolate(frame, [T.shade1 - 4, T.shade1 + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const zoomCam = interpolate(frame, [T.lookCam, T.lookCam + 4], [0, 1], clamp);
  const zoomOut = interpolate(frame, [T.bonk, T.bonk + 8], [0, 1], clamp);
  const camScale = 1 + zoomIn * 0.2 * (1 - zoomOut) + zoomCam * 0.25 * (1 - zoomOut);
  const camFocusX = 500 + zoomCam * -100 * (1 - zoomOut);
  const camFocusY = 1050;
  const shakeAmt = interpolate(frame, [T.bonk, T.bonk + 14], [26, 0], clamp);
  const shakeX = Math.sin(frame * 9.1) * shakeAmt;
  const shakeY = Math.cos(frame * 7.3) * shakeAmt;
  const flash = frame < T.bonk ? 0 : interpolate(frame, [T.bonk, T.bonk + 6], [0.85, 0], clamp);

  const camera = `translate(${540 + shakeX}, ${camFocusY + shakeY}) scale(${camScale}) translate(${-camFocusX}, ${-camFocusY})`;

  // stars circling Pip's head after the bonk
  const stars = pipDead
    ? [0, 1, 2].map((i) => {
        const a = frame / 5 + (i * Math.PI * 2) / 3;
        return { x: Math.cos(a) * 110, y: Math.sin(a) * 30 };
      })
    : [];

  return (
    <AbsoluteFill style={{ backgroundColor: "#9fc9d9" }}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <g transform={camera}>
          <SiteB />

          {/* shadow puddle */}
          {puddle > 0 ? (
            <g transform="translate(360,1480)">
              <ellipse cx={0} cy={0} rx={190 * puddle} ry={46 * puddle} fill="#2a1840" stroke="#ff5bd8" strokeWidth={6} opacity={0.95} />
              {[0, 1, 2, 3, 4].map((i) => (
                <circle
                  key={i}
                  cx={Math.cos(i * 1.3 + frame / 4) * 140 * puddle}
                  cy={-((frame - T.teleport) * (6 + i * 2)) % 300}
                  r={14 + i * 3}
                  fill="#4b2a6e"
                  opacity={0.7 * puddle}
                />
              ))}
            </g>
          ) : null}

          {/* Shade (clipped at the floor so he rises out of the puddle) */}
          <defs>
            <clipPath id="above-floor">
              <rect x={-400} y={-1200} width={800} height={1204} />
            </clipPath>
          </defs>
          {shadeVisible ? (
            <g transform="translate(360,1480)" clipPath="url(#above-floor)">
              <g transform={`translate(0, ${rise * 640})`}>
                <Shade look={shadeLook} eyes={shadeEyes} talking={shadeTalk} armSwing={armSwing} />
              </g>
            </g>
          ) : null}

          {/* Pip */}
          <g transform={`translate(690,1480) rotate(${pipRot}, 120, 0)`}>
            <Pip
              eyes={pipEyes}
              brows={pipBrows}
              mouthOpen={pipDead ? 0.25 : Math.max(pipTalking1, pipTalking2)}
              tongue={pipFrozen && !pipDead && frame < T.pip2}
              jiggle={jiggle}
            />
          </g>
          {/* concentration lines */}
          {pipFrozen && !pipDead ? (
            <g stroke={INK} strokeWidth={6} strokeLinecap="round" opacity={0.8}>
              <line x1={520} y1={980} x2={490} y2={950} />
              <line x1={860} y1={980} x2={890} y2={950} />
              <line x1={690} y1={790} x2={690} y2={750} />
            </g>
          ) : null}
          {stars.map((s, i) => (
            <text key={i} x={350 + s.x} y={1480 + s.y} fontSize={60} fill="#ffd166" stroke={INK} strokeWidth={3}>
              ★
            </text>
          ))}

          {/* Bolt */}
          <g transform={`translate(${boltX},${boltY}) rotate(${boltTilt}) scale(0.75)`}>
            <Bolt mood={boltMood} flame={boltMood === "off" ? 0 : 1} />
          </g>
          {/* speed lines as Bolt leaves */}
          {boltOut > 0 && boltOut < 1 ? (
            <g stroke="white" strokeWidth={10} strokeLinecap="round" opacity={1 - boltOut}>
              <line x1={boltX - 260} y1={1020} x2={boltX - 120} y2={1020} />
              <line x1={boltX - 300} y1={1070} x2={boltX - 140} y2={1070} />
              <line x1={boltX - 240} y1={1120} x2={boltX - 120} y2={1120} />
            </g>
          ) : null}

          {/* BONK! */}
          {frame >= T.bonk && frame < T.bonk + 22 ? (
            <g transform={`translate(640,930) scale(${spring({ frame: frame - T.bonk, fps, config: { damping: 8 } })}) rotate(-8)`}>
              <path
                d="M0 -120 L40 -50 L120 -70 L70 0 L130 60 L40 50 L10 130 L-30 55 L-120 80 L-70 5 L-130 -60 L-40 -45z"
                fill="#ffd166"
                stroke={INK}
                strokeWidth={7}
              />
              <text x={0} y={22} textAnchor="middle" fontSize={64} fontWeight={900} fontFamily="Arial Black, Arial" fill="#e2483d" stroke={INK} strokeWidth={3}>
                BONK
              </text>
            </g>
          ) : null}
        </g>
      </svg>

      {/* white impact flash */}
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />

      {/* ---------- Overlays ---------- */}
      <Sequence from={T.frozen} durationInFrames={T.teleport + 10 - T.frozen} layout="none">
        <MemeText text="Meanwhile, his body:" />
      </Sequence>
      <Sequence from={T.boltBack + 10} layout="none">
        <MemeText text="His little buddy:" />
      </Sequence>
      <Sequence from={T.bonk + 4} layout="none">
        <KillFeed killer="SHADE" victim="PIP" killerColor={SHADE_COLOR} victimColor="#7ae7c7" />
      </Sequence>

      {(["pip1", "shade1", "pip2", "shade2"] as const).map((id) => (
        <Sequence key={id} from={T[id]} durationInFrames={len(id) + 4} layout="none">
          <DialogueCaption captions={lines[id].captions} color={lines[id].speaker === "pip" ? PIP_COLOR : SHADE_COLOR} top={1580} />
        </Sequence>
      ))}

      {/* ---------- Audio ---------- */}
      {(["pip1", "shade1", "pip2", "shade2"] as const).map((id) => (
        <Sequence key={id} from={T[id]} layout="none">
          <Audio src={staticFile(lines[id].file)} />
        </Sequence>
      ))}
      <Sequence from={T.zoom} layout="none">
        <Audio src={staticFile(sfx.zoom.file)} volume={0.8} />
      </Sequence>
      <Sequence from={T.frozen} durationInFrames={T.teleport - T.frozen + 4} layout="none">
        <Audio src={staticFile(sfx.crickets.file)} volume={0.7} />
      </Sequence>
      <Sequence from={T.teleport} layout="none">
        <Audio src={staticFile(sfx.teleport.file)} volume={0.9} />
      </Sequence>
      <Sequence from={T.bonk - 1} layout="none">
        <Audio src={staticFile(sfx.bonk.file)} />
      </Sequence>
      <Sequence from={T.boltDies} layout="none">
        <Audio src={staticFile(sfx.sadbeep.file)} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};
