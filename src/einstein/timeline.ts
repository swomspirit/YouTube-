import audio from "../reels/einstein/audio.generated.json";

/*
 * "Einstein's Nobel Prize, Visualized" (16:9). Every visual keys off narration lines/words.
 */
export const FPS = 30;
type Caption = { text: string; startMs: number; endMs: number };
type LineInfo = { file: string; durationMs: number; captions: Caption[] };
export const LINES = audio.lines as Record<string, LineInfo>;
export const SFX = audio.sfx as Record<string, { file: string; durationMs: number }>;
export const MUSIC = (audio as unknown as { music: Record<string, { file: string; durationMs: number }> }).music;

export type Scene =
  | "hook"
  | "title"
  | "y1905"
  | "lab"
  | "window"
  | "equation"
  | "millikan"
  | "nobel"
  | "fun"
  | "tech"
  | "outro";

type Seg = { id: string | null; scene: Scene; len?: number; pre?: number; post?: number; sfx?: { file: keyof typeof audio.sfx; at?: number | string; vol?: number }[] };

const SEGS: Seg[] = [
  { id: "e01", scene: "hook", pre: 0.3, sfx: [{ file: "stamp", at: "either", vol: 0.7 }] },
  { id: "e02", scene: "lab", sfx: [{ file: "hum", at: 0, vol: 0.4 }] },
  { id: null, scene: "title", len: 3.4, sfx: [{ file: "riser", at: -2.2, vol: 0.5 }, { file: "boom", at: 0.2, vol: 0.75 }] },
  { id: "e03", scene: "y1905", sfx: [{ file: "typewriter", at: "four", vol: 0.45 }, { file: "ding", at: "photoelectric", vol: 0.5 }] },
  { id: "e04", scene: "lab", sfx: [{ file: "hum", at: "Shine", vol: 0.4 }, { file: "zap", at: "electrons", vol: 0.5 }] },
  { id: "e05", scene: "lab" },
  { id: "e06", scene: "lab", sfx: [{ file: "hum", at: "Blast", vol: 0.45 }, { file: "buzzer", at: "Not", vol: 0.5 }] },
  { id: "e07", scene: "lab", sfx: [{ file: "zap", at: "Electrons", vol: 0.6 }] },
  { id: "e08", scene: "lab", sfx: [{ file: "buzzer", at: "Waves", vol: 0.4 }] },
  { id: "e09", scene: "lab", post: 0.3, sfx: [{ file: "shimmer", at: "packets", vol: 0.55 }] },
  { id: "e10", scene: "lab" },
  { id: "e11", scene: "window", sfx: [{ file: "pingpong", at: "million", vol: 0.6 }, { file: "shatter", at: "shatters", vol: 0.7 }] },
  { id: "e12", scene: "lab", sfx: [{ file: "zap", at: "escapes", vol: 0.6 }] },
  { id: "e13", scene: "equation", sfx: [{ file: "pop", at: "energy", vol: 0.5 }, { file: "pop", at: "minus", vol: 0.5 }] },
  { id: "e14", scene: "millikan", sfx: [{ file: "stamp", at: "matched", vol: 0.7 }] },
  { id: "e15", scene: "nobel", sfx: [{ file: "applause", at: "received", vol: 0.45 }, { file: "stamp", at: "controversial", vol: 0.5 }] },
  { id: "e16", scene: "fun", sfx: [{ file: "pop", at: "money", vol: 0.5 }, { file: "pop", at: "lecture", vol: 0.5 }] },
  { id: "e17", scene: "lab", sfx: [{ file: "shimmer", at: "quantum", vol: 0.5 }] },
  { id: "e18", scene: "tech", sfx: [{ file: "pop", at: "Camera", vol: 0.5 }, { file: "pop", at: "light", vol: 0.5 }, { file: "pop", at: "solar", vol: 0.5 }] },
  { id: "e19", scene: "lab", post: 1.0 },
  { id: "e20", scene: "outro", post: 2.2, sfx: [{ file: "whoosh", at: 0, vol: 0.4 }] },
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
