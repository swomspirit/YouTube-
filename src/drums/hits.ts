export type Inst =
  | "kick" | "snare" | "side" | "hhc" | "hhp" | "hho"
  | "tom1" | "tom2" | "floor" | "crash" | "crash2" | "ride" | "bell" | "china";
export type Limb = "R" | "L" | "RF" | "LF";
export type Hit = { t: number; i: Inst; v: number; limb: Limb };
export type Performance = { duration: number; bpm: number; hits: Hit[] };

/** Which physical piece of the kit an instrument sound belongs to. */
export type Piece = "kick" | "snare" | "hihat" | "tom1" | "tom2" | "floor" | "crash" | "crash2" | "ride" | "china";
export const PIECE: Record<Inst, Piece> = {
  kick: "kick", snare: "snare", side: "snare", hhc: "hihat", hhp: "hihat", hho: "hihat",
  tom1: "tom1", tom2: "tom2", floor: "floor", crash: "crash", crash2: "crash2", ride: "ride", bell: "ride", china: "china",
};

export const upperBound = (arr: number[], x: number) => {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

type Track = { times: number[]; hits: Hit[] };
const track = (hits: Hit[]): Track => ({ times: hits.map((h) => h.t), hits });

export const preparePerformance = (p: Performance) => {
  const hits = [...p.hits].sort((a, b) => a.t - b.t);
  const byPiece = {} as Record<Piece, Track>;
  for (const piece of ["kick", "snare", "hihat", "tom1", "tom2", "floor", "crash", "crash2", "ride", "china"] as Piece[]) {
    byPiece[piece] = track(hits.filter((h) => PIECE[h.i] === piece));
  }
  const byLimb = {} as Record<Limb, Track>;
  for (const limb of ["R", "L", "RF", "LF"] as Limb[]) byLimb[limb] = track(hits.filter((h) => h.limb === limb));
  const hhOpen = track(hits.filter((h) => h.i === "hhc" || h.i === "hho" || h.i === "hhp"));
  return { ...p, hits, all: track(hits), byPiece, byLimb, hhOpen, barLen: (4 * 60) / p.bpm, countIn: (4 * 60) / p.bpm };
};
export type PreparedPerformance = ReturnType<typeof preparePerformance>;

/** Last hit at or before `now` on a track. */
export const lastHit = (tr: Track, now: number) => {
  const i = upperBound(tr.times, now) - 1;
  return i >= 0 ? tr.hits[i] : null;
};

/** Decaying impulse (0..~1) from the most recent hit. */
export const impulse = (tr: Track, now: number, tau: number) => {
  const h = lastHit(tr, now);
  if (!h) return 0;
  const dt = now - h.t;
  return (h.v / 127) * Math.exp(-dt / tau);
};

/** Hits per second over the last second (for the on-screen meter). */
export const hitsPerSecond = (p: PreparedPerformance, now: number) => {
  const a = upperBound(p.all.times, now - 1);
  const b = upperBound(p.all.times, now);
  return b - a;
};
