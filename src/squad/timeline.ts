import audio from "../reels/squad-ep1/audio.generated.json";

/*
 * Squad, Episode 1: "Never Ask the Healer for a Buy" (vertical skit, original characters).
 * Every beat is either a voice line or a timed silent gag; visuals key off line words.
 */
export const FPS = 30;
type Caption = { text: string; startMs: number; endMs: number };
type LineInfo = { speaker: string; file: string; durationMs: number; captions: Caption[] };
export const LINES = audio.lines as Record<string, LineInfo>;
export const SFX = audio.sfx as Record<string, { file: string; durationMs: number }>;
export const MUSIC = (audio as unknown as { music: Record<string, { file: string; durationMs: number }> }).music;

export type Shot = "wide" | "volt" | "mender" | "floor";
export type Beat = { key: string; id: string | null; shot: Shot; start: number; end: number; voiceAt: number };
type Seg = { key: string; id?: string; shot: Shot; len?: number; pre?: number; post?: number; sfx?: { f: keyof typeof audio.sfx; at?: number | string; vol?: number }[] };

const SEGS: Seg[] = [
  { key: "open", id: "a1", shot: "wide", pre: 0.5, post: 0.3, sfx: [{ f: "whoosh", at: -0.4, vol: 0.5 }] },
  { key: "ask", id: "v1", shot: "volt", post: 0.25, sfx: [{ f: "pop", at: "Peashooter", vol: 0.6 }, { f: "pop", at: "four", vol: 0.6 }] },
  { key: "rich", id: "m1", shot: "mender", pre: 0.25, post: 0.3, sfx: [{ f: "cash", at: -0.2, vol: 0.7 }] },
  { key: "me", id: "v2", shot: "volt", post: 0.2 },
  { key: "anyone", id: "m2", shot: "mender", pre: 0.15, post: 1.7, sfx: [{ f: "crickets", at: 1.0, vol: 0.55 }] },
  { key: "here", id: "v3", shot: "wide", post: 0.3 },
  { key: "shiny", id: "m3", shot: "mender", pre: 0.6, post: 0.3, sfx: [{ f: "buy", at: -0.45, vol: 0.8 }, { f: "pop", at: -0.4, vol: 0.5 }] },
  { key: "start", id: "a2", shot: "wide", pre: 0.2, post: 0.9, sfx: [{ f: "beep", at: -0.2, vol: 0.5 }] },
  { key: "kill1", shot: "wide", len: 1.9, sfx: [{ f: "shot", at: 0.05, vol: 0.9 }, { f: "thud", at: 0.45, vol: 0.8 }] },
  { key: "thanks", id: "v4", shot: "volt", pre: 0.9, post: 0.35, sfx: [{ f: "pickup", at: -0.6, vol: 0.8 }] },
  { key: "kill2", shot: "wide", len: 1.5, sfx: [{ f: "shot", at: 0.05, vol: 0.9 }, { f: "thud", at: 0.4, vol: 0.8 }] },
  { key: "worth", id: "v5", shot: "floor", pre: 0.3, post: 0.6 },
  { key: "defeat", shot: "wide", len: 3.4, sfx: [{ f: "defeat", at: 0.05, vol: 0.8 }] },
];

const wordIn = (id: string, start: number, word: string) => {
  const w = word.toLowerCase();
  const c = LINES[id].captions.find((x) => x.text.trim().toLowerCase().replace(/[^a-z0-9']/g, "").startsWith(w));
  if (!c) throw new Error(`word "${word}" not in ${id}`);
  return start + c.startMs / 1000;
};

const build = () => {
  const beats: Beat[] = [];
  const cues: { t: number; file: string; vol?: number }[] = [];
  let t = 0;
  for (const s of SEGS) {
    const pre = s.pre ?? 0;
    const voiceAt = t + pre;
    const len = pre + (s.id ? LINES[s.id].durationMs / 1000 : s.len ?? 1) + (s.post ?? 0);
    if (s.id) cues.push({ t: voiceAt, file: LINES[s.id].file });
    for (const fx of s.sfx ?? []) cues.push({ t: typeof fx.at === "string" ? wordIn(s.id!, voiceAt, fx.at) : voiceAt + (fx.at ?? 0), file: SFX[fx.f].file, vol: fx.vol });
    beats.push({ key: s.key, id: s.id ?? null, shot: s.shot, start: t, end: t + len, voiceAt });
    t += len;
  }
  return { beats, cues, total: t };
};
export const TL = build();
export const DURATION = Math.ceil(TL.total * FPS);
export const beatAt = (t: number) => TL.beats.find((b) => t >= b.start && t < b.end) ?? TL.beats[TL.beats.length - 1];
export const B = (key: string) => TL.beats.find((b) => b.key === key)!;
export const W = (key: string, word: string) => wordIn(B(key).id!, B(key).voiceAt, word);
/** Which character is talking at t (for lip flap), if any. */
export const talker = (t: number) => {
  for (const b of TL.beats) {
    if (!b.id) continue;
    const l = LINES[b.id];
    if (t >= b.voiceAt && t < b.voiceAt + l.durationMs / 1000) return l.speaker;
  }
  return null;
};
