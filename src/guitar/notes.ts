export type GNote = {
  t: number; // start (s)
  d: number; // length (s)
  m: number; // midi pitch
  v: number;
  s: number; // string 1 (high e) .. 6 (low E)
  f: number; // fret (0 = open)
  miss?: boolean;
  tech?: "buzz" | "vib" | "dive";
};
export type GSong = { duration: number; notes: GNote[]; beats: number[]; diveStart?: number; diveEnd?: number };

export const STRING_NAMES = ["", "e", "B", "G", "D", "A", "E"];
export const STRING_COLORS = ["", "#ff5d8f", "#ffb347", "#ffe066", "#5ef38c", "#4cc9f0", "#b388ff"];
const PC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const noteName = (m: number) => `${PC[m % 12]}${Math.floor(m / 12) - 1}`;

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

export const prepare = (song: GSong) => {
  const notes = [...song.notes].sort((a, b) => a.t - b.t);
  const starts = notes.map((n) => n.t);
  // one "hand target" per onset (chords averaged); open strings keep the previous position
  const onsets: { t: number; fret: number; s: number }[] = [];
  let lastFret = 3;
  for (let i = 0; i < notes.length; ) {
    let j = i;
    const group: GNote[] = [];
    while (j < notes.length && notes[j].t - notes[i].t < 0.06) group.push(notes[j++]);
    const fretted = group.filter((n) => n.f > 0);
    const fret = fretted.length ? fretted.reduce((a, n) => a + n.f, 0) / fretted.length : lastFret;
    const s = (fretted.length ? fretted : group).reduce((a, n) => a + n.s, 0) / (fretted.length || group.length);
    onsets.push({ t: notes[i].t, fret, s });
    lastFret = fret;
    i = j;
  }
  const onsetTimes = onsets.map((o) => o.t);
  return { ...song, notes, starts, onsets, onsetTimes };
};
export type Prepared = ReturnType<typeof prepare>;

/** Notes sounding right now. */
export const activeNotes = (p: Prepared, now: number) => {
  const out: GNote[] = [];
  const to = upperBound(p.starts, now);
  for (let i = Math.max(0, to - 12); i < to; i++) {
    const n = p.notes[i];
    if (now < n.t + Math.max(n.d, 0.14)) out.push(n);
  }
  return out;
};

/** Fretting-hand position (fret units + string), moving just before each onset. */
export const handPos = (p: Prepared, now: number) => {
  const o = p.onsets;
  if (!o.length) return { fret: 3, s: 3.5 };
  const k = upperBound(p.onsetTimes, now) - 1;
  if (k < 0) return { fret: o[0].fret, s: o[0].s };
  const cur = o[k];
  const nxt = o[k + 1];
  if (!nxt) return { fret: cur.fret, s: cur.s };
  const moveT = Math.min(0.09, (nxt.t - cur.t) * 0.5);
  const a = (now - (nxt.t - moveT)) / moveT;
  if (a <= 0) return { fret: cur.fret, s: cur.s };
  const e = a * a * (3 - 2 * a);
  return { fret: cur.fret + (nxt.fret - cur.fret) * e, s: cur.s + (nxt.s - cur.s) * e };
};

/** 0..1 pulse after each onset (picking hand / bounce). */
export const pulse = (times: number[], now: number, decay = 0.08) => {
  const i = upperBound(times, now) - 1;
  if (i < 0) return 0;
  const dt = now - times[i];
  return dt < 0.4 ? Math.exp(-dt / decay) : 0;
};
/** Number of onsets so far (for alternate picking direction). */
export const onsetIndex = (times: number[], now: number) => upperBound(times, now) - 1;
