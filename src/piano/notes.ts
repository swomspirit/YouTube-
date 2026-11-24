export type Note = { t: number; d: number; m: number; v: number; h: "L" | "R" };
export type Song = { duration: number; notes: Note[] };

export const RH_COLOR = "#4fc3f7";
export const LH_COLOR = "#ffb74d";

/** Index of the first item whose key is > x (array sorted by key). */
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

/** Pre-computed lookups for one song. */
export const prepareSong = (song: Song) => {
  const notes = [...song.notes].sort((a, b) => a.t - b.t);
  const starts = notes.map((n) => n.t);
  const onsets = (h: "L" | "R") => [...new Set(notes.filter((n) => n.h === h).map((n) => Math.round(n.t * 1000) / 1000))];
  const maxDur = Math.max(...notes.map((n) => n.d));
  return { ...song, notes, starts, onsetsL: onsets("L"), onsetsR: onsets("R"), maxDur };
};
export type PreparedSong = ReturnType<typeof prepareSong>;

/** 0..1 "key press" amount for a hand: spikes at each onset and decays. */
export const pressAmount = (onsets: number[], now: number) => {
  const i = upperBound(onsets, now) - 1;
  if (i < 0) return 0;
  const dt = now - onsets[i];
  return dt < 0.35 ? Math.exp(-dt / 0.09) : 0;
};
