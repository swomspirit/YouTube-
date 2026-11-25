import audio from "../reels/astatine/audio.generated.json";

/*
 * "Astatine: the rarest element on Earth" — 16:9 explainer.
 * Every visual is keyed to a narration line (and words inside it) so it stays in sync
 * if a line is regenerated.
 */
export const FPS = 30;
type Caption = { text: string; startMs: number; endMs: number };
type LineInfo = { file: string; durationMs: number; captions: Caption[] };
export const LINES = audio.lines as Record<string, LineInfo>;
export const SFX = audio.sfx as Record<string, { file: string; durationMs: number }>;
export const MUSIC = (audio as unknown as { music: Record<string, { file: string; durationMs: number }> }).music;

export type Scene =
  | "cosmos"
  | "planets"
  | "finale"
  | "earth"
  | "tile"
  | "title"
  | "table"
  | "nucleus"
  | "halflife"
  | "chain"
  | "vapor"
  | "mystery"
  | "greek"
  | "history"
  | "cyclotron"
  | "cells"
  | "access"
  | "outro";

type Seg = { id: string | null; scene: Scene; len?: number; pre?: number; post?: number; sfx?: { file: keyof typeof audio.sfx; at?: number | string; vol?: number }[] };

const SEGS: Seg[] = [
  { id: "x01", scene: "cosmos", pre: 3.0, post: 1.2, sfx: [{ file: "merger", at: "colliding", vol: 0.8 }, { file: "shimmer", at: "scattered", vol: 0.5 }] },
  { id: "x02", scene: "planets", pre: 0.4, post: 1.4, sfx: [{ file: "flyby", at: "Saturn", vol: 0.7 }, { file: "flyby", at: "Jupiter", vol: 0.7 }, { file: "flyby", at: "Mars", vol: 0.6 }, { file: "whoosh", at: "small", vol: 0.5 }] },
  { id: "s01", scene: "earth", post: 0.4 },
  { id: "s02", scene: "earth", sfx: [{ file: "pop", at: "paperclip", vol: 0.6 }] },
  { id: "s03", scene: "tile", sfx: [{ file: "shimmer", at: 0.05, vol: 0.5 }] },
  { id: "tv1", scene: "title", pre: 1.4, post: 2.0, sfx: [{ file: "riser", at: -2.6, vol: 0.6 }, { file: "boom", at: 0, vol: 0.8 }, { file: "subdrop", at: 0, vol: 0.6 }] },
  { id: "s04", scene: "table", sfx: [{ file: "whoosh", at: 0, vol: 0.5 }] },
  { id: "s05", scene: "table" },
  { id: "s06", scene: "nucleus", sfx: [{ file: "energy", at: 0, vol: 0.45 }] },
  { id: "s07", scene: "nucleus", sfx: [{ file: "geiger", at: "radioactive", vol: 0.45 }, { file: "stamp", at: "stable", vol: 0.7 }] },
  { id: "s08", scene: "halflife" },
  { id: "s09", scene: "chain", sfx: [{ file: "shimmer", at: "cosmic", vol: 0.4 }] },
  { id: "s10", scene: "chain", sfx: [{ file: "ding", at: "astatine", vol: 0.5 }] },
  { id: "s11", scene: "earth" },
  { id: "s12", scene: "vapor", sfx: [{ file: "sizzle", at: "vaporize", vol: 0.7 }] },
  { id: "s13", scene: "mystery" },
  { id: "s14", scene: "greek", sfx: [{ file: "pop", at: "astatos", vol: 0.6 }] },
  { id: "s15", scene: "history" },
  { id: "s16", scene: "history", sfx: [{ file: "stamp", at: "made", vol: 0.6 }] },
  { id: "s17", scene: "cyclotron", pre: 0.4, sfx: [{ file: "hum", at: "cyclotron", vol: 0.5 }, { file: "crackle", at: "cyclotron", vol: 0.35 }] },
  { id: "s18", scene: "cyclotron", sfx: [{ file: "hum", at: 0, vol: 0.4 }, { file: "zap", at: "slam", vol: 0.8 }] },
  { id: "s19", scene: "cyclotron", sfx: [{ file: "ding", at: "Astatine", vol: 0.6 }] },
  { id: "s20", scene: "cyclotron", sfx: [{ file: "tick", at: "clock", vol: 0.6 }] },
  { id: "s21", scene: "cells", sfx: [{ file: "whoosh", at: 0, vol: 0.4 }] },
  { id: "s22", scene: "access", sfx: [{ file: "stamp", at: "buy", vol: 0.6 }] },
  { id: "s23", scene: "access" },
  { id: "s24", scene: "finale", pre: 0.8, post: 2.2, sfx: [{ file: "whoosh", at: 0, vol: 0.5 }, { file: "shimmer", at: "stars", vol: 0.5 }] },
  { id: "s25", scene: "outro", post: 2.4 },
];

const GAP = 0.45;
/** Start (absolute seconds) of a word inside a line; nth match. Infinity if not found. */
export const wordIn = (id: string, start: number, word: string, nth = 0) => {
  const w = word.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const hits = LINES[id].captions.filter((c) => c.text.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").startsWith(w));
  return hits[nth] ? start + hits[nth].startMs / 1000 : Infinity;
};

export type Beat = { id: string | null; scene: Scene; start: number; end: number; voiceAt: number };
export type Cue = { t: number; file: string; vol?: number };

const build = () => {
  const beats: Beat[] = [];
  const cues: Cue[] = [];
  let t = 0.3;
  for (const s of SEGS) {
    const pre = s.pre ?? 0;
    const len = pre + (s.id ? LINES[s.id].durationMs / 1000 : s.len ?? 2) + (s.post ?? 0);
    const voiceAt = t + pre;
    if (s.id) cues.push({ t: voiceAt, file: LINES[s.id].file });
    for (const fx of s.sfx ?? []) {
      const at = typeof fx.at === "string" ? wordIn(s.id!, voiceAt, fx.at) : voiceAt + (fx.at ?? 0);
      if (Number.isFinite(at)) cues.push({ t: at, file: SFX[fx.file].file, vol: fx.vol });
      else throw new Error(`word "${fx.at}" not found in ${s.id}`);
    }
    beats.push({ id: s.id, scene: s.scene, start: t, end: t + len + GAP, voiceAt });
    t += len + GAP;
  }
  return { beats, cues, total: t + 1.6 };
};

export const TL = build();
export const DURATION = Math.ceil(TL.total * FPS);
export const beatAt = (t: number) => TL.beats.find((b) => t >= b.start && t < b.end) ?? (t < TL.beats[0].start ? TL.beats[0] : TL.beats[TL.beats.length - 1]);
export const beatOf = (id: string) => TL.beats.find((b) => b.id === id)!;
/** Absolute time of a word in a line (by line id). */
export const W = (id: string, word: string, nth = 0) => wordIn(id, beatOf(id).voiceAt, word, nth);
/** First and last beat of a scene (scenes are contiguous). */
export const sceneSpan = (scene: Scene) => {
  const bs = TL.beats.filter((b) => b.scene === scene);
  return { start: bs[0].start, end: bs[bs.length - 1].end };
};

/** Contiguous runs of the same scene. */
export const RUNS = TL.beats.reduce<{ scene: Scene; start: number; end: number }[]>((acc, b) => {
  const last = acc[acc.length - 1];
  if (last && last.scene === b.scene) last.end = b.end;
  else acc.push({ scene: b.scene, start: b.start, end: b.end });
  return acc;
}, []);
const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};
/** 0..1 presence of a scene at time t (fades in/out at the edges of its runs). */
export const vis = (scene: Scene | Scene[], t: number, fadeIn = 0.6, fadeOut = 0.45) => {
  const list = Array.isArray(scene) ? scene : [scene];
  const r = RUNS.find((x) => list.includes(x.scene) && t >= x.start - 0.01 && t < x.end + fadeOut);
  if (!r) return 0;
  return smooth((t - r.start) / fadeIn) * (1 - smooth((t - r.end + fadeOut * 0.5) / fadeOut));
};
export const ease = smooth;
