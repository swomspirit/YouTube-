import { Img, staticFile, spring } from "remotion";
import { RUNS, TL, W, beatAt, beatOf, vis, type Scene } from "./timeline";

/*
 * Generated artwork layer (fal.ai FLUX Pro, upscaled with Clarity): one background per scene,
 * plus an illustrated Albert Einstein who reacts to his own story.
 */
const BG: Record<Scene, { file: string; bright: number; blur?: number } | null> = {
  hook: { file: "hook", bright: 0.62 },
  title: { file: "hero", bright: 0.75 },
  y1905: { file: "y1905", bright: 0.7 },
  lab: { file: "lab", bright: 0.5, blur: 3 },
  window: { file: "window", bright: 0.8 },
  equation: { file: "equation", bright: 0.95 },
  millikan: { file: "millikan", bright: 0.42 },
  nobel: { file: "nobel", bright: 0.45 },
  fun: { file: "fun", bright: 0.5 },
  tech: { file: "tech", bright: 0.5 },
  outro: { file: "hero", bright: 0.6 },
};

export const Backdrops: React.FC<{ t: number }> = ({ t }) => (
  <>
    {RUNS.map((r, i) => {
      const b = BG[r.scene];
      if (!b) return null;
      const k = vis(r.scene, t, 0.6, 0.6);
      if (k <= 0.001 || t < r.start - 0.1 || t > r.end + 0.7) return null;
      const p = (t - r.start) / Math.max(1, r.end - r.start);
      const z = 1.04 + 0.06 * p;
      const dx = (i % 2 ? -1 : 1) * 18 * p;
      return (
        <Img
          key={i}
          src={staticFile(`einstein-art/${b.file}.jpg`)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: k, transform: `translateX(${dx}px) scale(${z})`, filter: `brightness(${b.bright})${b.blur ? ` blur(${b.blur}px)` : ""}` }}
        />
      );
    })}
  </>
);

/* ---------------- Einstein, the host ---------------- */
type Pose = "wave" | "point" | "shock" | "think" | "thumbs" | "present";
type Cue = { id: string; pose: Pose; word?: string; side?: "left" | "right" };
const CUES: Cue[] = [
  { id: "e01", pose: "think" },
  { id: "e01", pose: "shock", word: "either" },
  { id: "e02", pose: "present" },
  { id: "e03", pose: "point", word: "photoelectric", side: "left" },
  { id: "e04", pose: "think" },
  { id: "e04", pose: "point", word: "electrons" },
  { id: "e05", pose: "think" },
  { id: "e06", pose: "think" },
  { id: "e06", pose: "shock", word: "Not" },
  { id: "e07", pose: "shock", word: "Electrons" },
  { id: "e08", pose: "think" },
  { id: "e09", pose: "present", word: "packets" },
  { id: "e10", pose: "point" },
  { id: "e11", pose: "think", side: "left" },
  { id: "e11", pose: "shock", word: "shatters", side: "left" },
  { id: "e12", pose: "point" },
  { id: "e13", pose: "point" },
  { id: "e14", pose: "think", side: "left" },
  { id: "e14", pose: "thumbs", word: "matched", side: "left" },
  { id: "e15", pose: "wave" },
  { id: "e16", pose: "thumbs" },
  { id: "e16", pose: "shock", word: "lecture" },
  { id: "e17", pose: "present" },
  { id: "e18", pose: "point" },
  { id: "e19", pose: "present" },
  { id: "e20", pose: "wave" },
];
const TIMED = CUES.map((c) => ({ ...c, t: c.word ? W(c.id, c.word) - 0.15 : beatOf(c.id).start + 0.2 })).sort((a, b) => a.t - b.t);

export const Host: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const b = beatAt(t);
  if (!b.id || b.scene === "title") return null;
  const cue = [...TIMED].reverse().find((c) => c.t <= t && c.id === b.id);
  if (!cue) return null;
  const firstOfBeat = TIMED.find((c) => c.id === b.id)!;
  const enter = spring({ frame: Math.round((t - firstOfBeat.t) * fps), fps, config: { damping: 12 } });
  const swap = spring({ frame: Math.round((t - cue.t) * fps), fps, config: { damping: 9, stiffness: 180 } });
  const leave = Math.min(1, Math.max(0, (b.end - t) / 0.3));
  const bob = Math.sin(t * 3.2) * 6;
  const side = cue.side ?? "right";
  const sq = 1 + (1 - swap) * 0.12;
  const flip = side === "left" && cue.pose === "point" ? 1 : side === "right" ? 1 : 1;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 104 + bob,
        [side]: 40,
        height: 410,
        transform: `translateY(${(1 - enter) * 470 + (1 - leave) * 470}px) scaleX(${(side === "left" ? -1 : 1) * flip / sq}) scaleY(${sq})`,
        transformOrigin: "bottom center",
        filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.55))",
      }}
    >
      <Img src={staticFile(`einstein-art/host/${cue.pose}.png`)} style={{ height: 410 }} />
    </div>
  );
};
void TL;
