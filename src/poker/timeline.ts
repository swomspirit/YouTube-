import audio from "../reels/poker-jacks/audio.generated.json";
import equityJson from "./equity.generated.json";

/*
 * "You Look Down at Jacks" — script + timeline.
 * Every beat gets a start time from the real voice-line lengths; chip moves are synced
 * to the exact word in the narration (from ElevenLabs word timings).
 */
export const FPS = 30;
type Caption = { text: string; startMs: number; endMs: number };
type LineInfo = { file: string; durationMs: number; captions: Caption[] };
export const LINES = audio.lines as Record<string, LineInfo>;
export const SFX = audio.sfx as Record<string, { file: string; durationMs: number }>;
export const EQUITY = equityJson as Record<string, number>;

export type Who = "hero" | "villain";
export type Street = "flop" | "turn" | "river";
export type Focus = "table" | "board" | "villain" | "cards" | "pot";

export type Opponent = { n: 1 | 2 | 3; name: string; emoji: string; tag: string; loose: number; aggro: number; cards: [string, string]; board: string[]; color: string };
export const OPPONENTS: Opponent[] = [
  { n: 1, name: "THE ROCK", emoji: "🪨", tag: "Super tight. Only plays monsters.", loose: 0.1, aggro: 0.35, cards: ["Ad", "Ks"], board: ["Kc", "8d", "3s"], color: "#9aa5b1" },
  { n: 2, name: "THE MANIAC", emoji: "🔥", tag: "Raises everything. Bluffs constantly.", loose: 0.95, aggro: 0.97, cards: ["9s", "8s"], board: ["Qs", "7h", "2d", "4c", "Kd"], color: "#ff5a36" },
  { n: 3, name: "THE CALLING STATION", emoji: "🐟", tag: "Never folds. Ever.", loose: 0.85, aggro: 0.1, cards: ["9c", "8h"], board: ["8s", "6d", "3c", "2h", "Jd"], color: "#3ba3ff" },
];
export const HERO_CARDS: [string, string] = ["Js", "Jh"];

type Step =
  | { k: "title" }
  | { k: "voice"; id: string; pad?: number; actions?: { word: string; do: Action }[]; focus?: Focus }
  | { k: "scene"; n: 1 | 2 | 3 }
  | { k: "peek" }
  | { k: "deal"; street: Street }
  | { k: "decide"; options: string[]; correct: number; eq: string }
  | { k: "reveal"; eq: string }
  | { k: "win"; who: Who }
  | { k: "lesson"; n: number; text: string; voice: string }
  | { k: "outro" }
  | { k: "wait"; d: number };

export type Action = { a: "bet"; who: Who; to: number; label: string } | { a: "fold"; who: Who; label: string } | { a: "label"; label: string } | { a: "eq"; key: string };

const SCRIPT: Step[] = [
  { k: "title" },
  // ---------------- 1: The Rock ----------------
  { k: "scene", n: 1 },
  { k: "peek" },
  { k: "voice", id: "s1_open", focus: "villain", actions: [{ word: "raise", do: { a: "bet", who: "hero", to: 6, label: "You raise to $6" } }, { word: "re-raises", do: { a: "bet", who: "villain", to: 20, label: "The Rock re-raises to $20" } }] },
  { k: "decide", options: ["FOLD", "CALL", "4-BET"], correct: 1, eq: "s1_pre" },
  { k: "voice", id: "s1_a1", actions: [{ word: "Call", do: { a: "bet", who: "hero", to: 20, label: "You call $20" } }] },
  { k: "deal", street: "flop" },
  { k: "voice", id: "s1_flop", focus: "villain", actions: [{ word: "bets", do: { a: "bet", who: "villain", to: 28, label: "The Rock bets $28" } }] },
  { k: "decide", options: ["FOLD", "CALL", "RAISE"], correct: 0, eq: "s1_flop" },
  { k: "voice", id: "s1_a2", actions: [{ word: "Fold", do: { a: "fold", who: "hero", label: "You fold" } }] },
  { k: "reveal", eq: "s1_actual" },
  { k: "voice", id: "s1_reveal", focus: "villain" },
  { k: "win", who: "villain" },
  { k: "lesson", n: 1, text: "Against a rock, respect the raise.", voice: "s1_lesson" },
  // ---------------- 2: The Maniac ----------------
  { k: "scene", n: 2 },
  { k: "peek" },
  { k: "voice", id: "s2_open", focus: "villain", actions: [{ word: "raises", do: { a: "bet", who: "villain", to: 8, label: "The Maniac raises to $8" } }] },
  { k: "decide", options: ["FOLD", "CALL", "3-BET"], correct: 2, eq: "s2_pre" },
  { k: "voice", id: "s2_a1", actions: [{ word: "twenty-six", do: { a: "bet", who: "hero", to: 26, label: "You 3-bet to $26" } }, { word: "calls", do: { a: "bet", who: "villain", to: 26, label: "The Maniac calls" } }] },
  { k: "deal", street: "flop" },
  { k: "voice", id: "s2_flop", focus: "villain", actions: [{ word: "bet", do: { a: "bet", who: "hero", to: 20, label: "You bet $20" } }, { word: "raises", do: { a: "bet", who: "villain", to: 65, label: "The Maniac raises to $65" } }] },
  { k: "decide", options: ["FOLD", "CALL", "RE-RAISE"], correct: 1, eq: "s2_flop" },
  { k: "voice", id: "s2_a2", actions: [{ word: "call", do: { a: "bet", who: "hero", to: 65, label: "You call $65" } }] },
  { k: "deal", street: "turn" },
  { k: "voice", id: "s2_turn", focus: "villain", actions: [{ word: "all", do: { a: "bet", who: "villain", to: 109, label: "The Maniac is ALL IN ($109)" } }] },
  { k: "decide", options: ["FOLD", "CALL"], correct: 1, eq: "s2_turn" },
  { k: "voice", id: "s2_a3", actions: [{ word: "call", do: { a: "bet", who: "hero", to: 109, label: "You call. ALL IN!" } }] },
  { k: "reveal", eq: "s2_actual" },
  { k: "deal", street: "river" },
  { k: "voice", id: "s2_reveal", focus: "board" },
  { k: "win", who: "hero" },
  { k: "lesson", n: 2, text: "Against a maniac, let him hang himself.", voice: "s2_lesson" },
  // ---------------- 3: The Calling Station ----------------
  { k: "scene", n: 3 },
  { k: "peek" },
  { k: "voice", id: "s3_open", actions: [{ word: "raise", do: { a: "bet", who: "hero", to: 6, label: "You raise to $6" } }, { word: "calls", do: { a: "bet", who: "villain", to: 6, label: "The Calling Station calls" } }] },
  { k: "deal", street: "flop" },
  { k: "voice", id: "s3_flop", focus: "villain", actions: [{ word: "checks", do: { a: "label", label: "The Calling Station checks" } }] },
  { k: "decide", options: ["CHECK", "BET"], correct: 1, eq: "s3_flop" },
  { k: "voice", id: "s3_a1", actions: [{ word: "ten", do: { a: "bet", who: "hero", to: 10, label: "You bet $10" } }, { word: "calls", do: { a: "bet", who: "villain", to: 10, label: "He calls" } }] },
  { k: "deal", street: "turn" },
  { k: "voice", id: "s3_turn", actions: [{ word: "checks", do: { a: "label", label: "He checks again" } }] },
  { k: "decide", options: ["CHECK", "BET SMALL", "BET BIG"], correct: 2, eq: "s3_turn" },
  { k: "voice", id: "s3_a2", actions: [{ word: "Twenty-four", do: { a: "bet", who: "hero", to: 24, label: "You bet $24" } }, { word: "Called", do: { a: "bet", who: "villain", to: 24, label: "He calls" } }] },
  { k: "deal", street: "river" },
  { k: "voice", id: "s3_river", focus: "cards" },
  { k: "decide", options: ["CHECK", "BET SMALL", "BET BIG"], correct: 2, eq: "s3_river" },
  { k: "voice", id: "s3_a3", actions: [{ word: "Sixty", do: { a: "bet", who: "hero", to: 60, label: "You bet $60" } }, { word: "calls", do: { a: "bet", who: "villain", to: 60, label: "He calls instantly" } }] },
  { k: "reveal", eq: "s3_actual" },
  { k: "voice", id: "s3_reveal", focus: "villain" },
  { k: "win", who: "hero" },
  { k: "lesson", n: 3, text: "Against a calling station, never bluff. Just bet.", voice: "s3_lesson" },
  { k: "outro" },
];

/* ---------------- build beats with times ---------------- */
export type Beat = { start: number; end: number; step: Step; scene: number };
export type Timed = { t: number; scene: number; act: Action };
export type AudioCue = { t: number; file: string; vol?: number };

const sec = (id: string) => LINES[id].durationMs / 1000;
/** Time (s) of the first word starting with `word` at or after `afterS` in a voice line. */
const wordTime = (id: string, word: string, afterS = 0) => {
  const w = word.toLowerCase();
  const c = LINES[id].captions.find((x) => x.startMs / 1000 >= afterS && x.text.trim().toLowerCase().replace(/[^a-z-]/g, "").startsWith(w));
  return c ? c.startMs / 1000 : afterS + 0.2;
};

const build = () => {
  const beats: Beat[] = [];
  const acts: Timed[] = [];
  const cues: AudioCue[] = [];
  let t = 0.3;
  let scene = 0;
  const push = (step: Step, d: number) => {
    beats.push({ start: t, end: t + d, step, scene });
    t += d;
  };
  for (const st of SCRIPT) {
    switch (st.k) {
      case "title": {
        cues.push({ t, file: SFX.heartbeat.file, vol: 0.7 }, { t: t + 0.4, file: LINES.intro1.file });
        const a = sec("intro1") + 0.6;
        cues.push({ t: t + a, file: LINES.intro2.file }, { t: t + a + sec("intro2") + 0.4, file: LINES.intro3.file });
        push(st, a + sec("intro2") + 0.4 + sec("intro3") + 0.5);
        break;
      }
      case "scene":
        scene = st.n;
        cues.push({ t, file: SFX.whoosh.file, vol: 0.7 }, { t: t + 0.5, file: LINES[`s${st.n}_intro`].file });
        push(st, sec(`s${st.n}_intro`) + 1.0);
        break;
      case "peek":
        cues.push({ t, file: SFX.flip.file, vol: 0.6 });
        push(st, 1.6);
        break;
      case "voice":
        cues.push({ t, file: LINES[st.id].file });
        let after = 0;
        for (const a of st.actions ?? []) {
          const rel = wordTime(st.id, a.word, after);
          after = rel + 0.01;
          const at = t + rel;
          acts.push({ t: at, scene, act: a.do });
          if (a.do.a === "bet") cues.push({ t: at, file: SFX.chips.file, vol: 0.8 });
          if (a.do.a === "bet" && a.do.label.includes("ALL IN")) cues.push({ t: at, file: SFX.allin.file, vol: 0.8 });
        }
        push(st, sec(st.id) + (st.pad ?? 0.35));
        break;
      case "deal": {
        const dealer = st.street === "flop" ? "d_flop" : st.street === "turn" ? "d_turn" : "d_river";
        cues.push({ t, file: LINES[dealer].file });
        const n = st.street === "flop" ? 3 : 1;
        for (let i = 0; i < n; i++) cues.push({ t: t + 0.25 + i * 0.18, file: SFX.deal.file, vol: 0.6 }, { t: t + 0.9 + i * 0.18, file: SFX.flip.file, vol: 0.6 });
        push(st, 1.9);
        break;
      }
      case "decide":
        acts.push({ t, scene, act: { a: "eq", key: st.eq } });
        cues.push({ t: t + 0.1, file: LINES.wyd.file });
        for (let i = 0; i < 3; i++) cues.push({ t: t + 1.0 + i, file: SFX.tick.file, vol: 0.8 });
        cues.push({ t: t + 4.0, file: SFX.correct.file, vol: 0.55 });
        push(st, 4.1);
        break;
      case "reveal":
        acts.push({ t: t + 0.6, scene, act: { a: "eq", key: st.eq } });
        cues.push({ t, file: LINES.d_show.file }, { t: t + 0.5, file: SFX.flip.file }, { t: t + 0.7, file: SFX.ooh.file, vol: 0.5 });
        push(st, 1.6);
        break;
      case "win":
        cues.push({ t, file: SFX.collect.file, vol: 0.8 });
        push(st, 1.6);
        break;
      case "lesson":
        cues.push({ t: t + 0.3, file: LINES[st.voice].file });
        push(st, sec(st.voice) + 1.4);
        break;
      case "outro":
        cues.push({ t: t + 0.4, file: LINES.outro.file });
        push(st, sec("outro") + 3);
        break;
      case "wait":
        push(st, st.d);
        break;
    }
  }
  return { beats, acts, cues, total: t };
};
export const TL = build();
export const POKER_DURATION = Math.ceil(TL.total * FPS);

/* ---------------- state at time t ---------------- */
export type TableState = {
  scene: number;
  heroBet: number;
  villBet: number;
  pot: number;
  heroStack: number;
  villStack: number;
  board: { card: string; dealtAt: number }[];
  heroFolded: number | null; // time
  revealedAt: number | null;
  winner: Who | null;
  winAt: number;
  label: string;
  labelAt: number;
  equity: number | null;
  equityKey: string | null;
  lastBet: { who: Who; t: number } | null;
};

export const stateAt = (t: number): TableState => {
  const beat = TL.beats.find((b) => t >= b.start && t < b.end) ?? TL.beats[TL.beats.length - 1];
  const scene = beat.scene;
  const s: TableState = {
    scene, heroBet: 0, villBet: 0, pot: 1, heroStack: 200, villStack: 200, board: [], heroFolded: null, revealedAt: null, winner: null, winAt: 0,
    label: "", labelAt: 0, equity: null, equityKey: null, lastBet: null,
  };
  if (!scene) return s;
  const opp = OPPONENTS[scene - 1];
  // merge actions + structural beats of this scene in time order
  const events: { t: number; f: () => void }[] = [];
  for (const a of TL.acts.filter((x) => x.scene === scene && x.t <= t)) {
    events.push({
      t: a.t,
      f: () => {
        const act = a.act;
        if (act.a === "bet") {
          if (act.who === "hero") {
            s.heroStack -= act.to - s.heroBet;
            s.heroBet = act.to;
          } else {
            s.villStack -= act.to - s.villBet;
            s.villBet = act.to;
          }
          s.label = act.label;
          s.labelAt = a.t;
          s.lastBet = { who: act.who, t: a.t };
        } else if (act.a === "fold") {
          s.heroFolded = a.t;
          s.label = act.label;
          s.labelAt = a.t;
        } else if (act.a === "label") {
          s.label = act.label;
          s.labelAt = a.t;
        } else if (act.a === "eq") {
          s.equity = EQUITY[act.key];
          s.equityKey = act.key;
        }
      },
    });
  }
  for (const b of TL.beats.filter((x) => x.scene === scene && x.start <= t)) {
    const st = b.step;
    if (st.k === "deal") {
      events.push({
        t: b.start,
        f: () => {
          s.pot += s.heroBet + s.villBet;
          s.heroBet = 0;
          s.villBet = 0;
          const n = st.street === "flop" ? 3 : 1;
          const from = s.board.length;
          for (let i = 0; i < n; i++) s.board.push({ card: opp.board[from + i], dealtAt: b.start + 0.25 + i * 0.18 });
          s.label = st.street.toUpperCase();
          s.labelAt = b.start;
        },
      });
    } else if (st.k === "reveal") {
      events.push({ t: b.start, f: () => (s.revealedAt = b.start + 0.4) });
    } else if (st.k === "win") {
      events.push({
        t: b.start,
        f: () => {
          s.pot += s.heroBet + s.villBet;
          s.heroBet = 0;
          s.villBet = 0;
          s.winner = st.who;
          s.winAt = b.start;
          s.label = st.who === "hero" ? `You win $${s.pot}` : `${opp.name} wins $${s.pot}`;
          s.labelAt = b.start;
        },
      });
    }
  }
  events.sort((a, b) => a.t - b.t).forEach((e) => e.f());
  return s;
};

export const beatAt = (t: number) => TL.beats.find((b) => t >= b.start && t < b.end) ?? null;
