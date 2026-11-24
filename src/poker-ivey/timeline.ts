import audio from "../reels/poker-ivey/audio.generated.json";

/*
 * "Would You Call vs Phil Ivey?" (Shark Cage hand, recreated).
 * Ranks/actions per the hand; suits are illustrative (chosen so no flush is possible).
 * POV = the button seat holding A♦ Q♦. Every action is synced to a word in the voice lines.
 */
export const FPS = 30;
type Caption = { text: string; startMs: number; endMs: number };
type LineInfo = { file: string; durationMs: number; captions: Caption[] };
export const LINES = audio.lines as Record<string, LineInfo>;
export const SFX = audio.sfx as Record<string, { file: string; durationMs: number }>;
export const MUSIC = (audio as unknown as { music: Record<string, { file: string; durationMs: number }> }).music;

export const HERO: [string, string] = ["Ad", "Qd"];
export const IVEY: [string, string] = ["Ah", "Ac"];
export const BOARD = ["8c", "8d", "As", "7h", "9c"];

export type Who = "hero" | "ivey";
type Act =
  | { a: "bet"; who: Who; to: number; label: string; big?: boolean }
  | { a: "check"; who: Who; label: string }
  | { a: "flip"; i: number }
  | { a: "pop"; text: string; color?: string }
  | { a: "hand"; text: string };

type Step =
  | { k: "title"; voice: string }
  | { k: "voice"; id: string; acts?: { word: string; do: Act }[]; focus?: Focus; pad?: number }
  | { k: "peek"; voice: string }
  | { k: "deal"; n: number }
  | { k: "slowmo"; voice: string; acts: { word: string; do: Act }[] }
  | { k: "decide" }
  | { k: "reveal"; voice: string }
  | { k: "win" }
  | { k: "lesson"; voice: string }
  | { k: "outro"; voice: string };
export type Focus = "table" | "board" | "ivey" | "cards" | "pot";

const SCRIPT: Step[] = [
  { k: "title", voice: "c_open" },
  { k: "voice", id: "m_breathe", focus: "ivey" },
  { k: "peek", voice: "m_peek" },
  { k: "voice", id: "c_raise", focus: "ivey", acts: [{ word: "Thirty-eight", do: { a: "bet", who: "ivey", to: 38000, label: "IVEY RAISES TO 38K" } }] },
  { k: "voice", id: "m_call", acts: [{ word: "Call", do: { a: "bet", who: "hero", to: 38000, label: "YOU CALL 38K" } }, { word: "Call", do: { a: "hand", text: "Ace-Queen suited" } }] },
  { k: "deal", n: 3 },
  {
    k: "voice",
    id: "c_flop",
    focus: "board",
    acts: [
      { word: "Eight", do: { a: "flip", i: 0 } },
      { word: "eight", do: { a: "flip", i: 1 } },
      { word: "ACE", do: { a: "flip", i: 2 } },
      { word: "ACE", do: { a: "hand", text: "Two pair: Aces & Eights" } },
    ],
  },
  { k: "voice", id: "m_flop", acts: [{ word: "Aces", do: { a: "pop", text: "ACES UP 😎", color: "#3ee07a" } }] },
  { k: "voice", id: "m_bet", acts: [{ word: "He", do: { a: "check", who: "ivey", label: "IVEY CHECKS" } }, { word: "fifty", do: { a: "bet", who: "hero", to: 50000, label: "YOU BET 50K" } }] },
  { k: "voice", id: "c_call", focus: "ivey", acts: [{ word: "calls", do: { a: "bet", who: "ivey", to: 50000, label: "IVEY CALLS" } }, { word: "breathing", do: { a: "pop", text: "🤖 ZERO EMOTION", color: "#9fc3ff" } }] },
  { k: "deal", n: 1 },
  { k: "voice", id: "c_turn", focus: "board", acts: [{ word: "seven", do: { a: "flip", i: 3 } }] },
  { k: "voice", id: "m_turn", acts: [{ word: "He", do: { a: "check", who: "ivey", label: "IVEY CHECKS" } }, { word: "too", do: { a: "check", who: "hero", label: "YOU CHECK" } }, { word: "Very", do: { a: "pop", text: "POT CONTROL 🧐", color: "#ffc94d" } }] },
  { k: "deal", n: 1 },
  { k: "voice", id: "c_river", focus: "board", acts: [{ word: "nine", do: { a: "flip", i: 4 } }, { word: "checks", do: { a: "check", who: "ivey", label: "IVEY CHECKS… AGAIN" } }] },
  { k: "voice", id: "m_river", acts: [{ word: "weak", do: { a: "pop", text: "HE'S WEAK 💪", color: "#3ee07a" } }, { word: "hundred", do: { a: "bet", who: "hero", to: 125000, label: "YOU BET 125K" } }] },
  { k: "slowmo", voice: "c_raise2", acts: [{ word: "FOUR", do: { a: "bet", who: "ivey", to: 450000, label: "IVEY CHECK-RAISES TO 450K", big: true } }] },
  { k: "voice", id: "m_panic", acts: [{ word: "Wait", do: { a: "pop", text: "PANIC 😰", color: "#ff4d5e" } }] },
  { k: "decide" },
  { k: "voice", id: "m_decide", acts: [{ word: "call", do: { a: "bet", who: "hero", to: 450000, label: "YOU CALL 450K", big: true } }] },
  { k: "reveal", voice: "c_reveal" },
  { k: "voice", id: "m_cool", focus: "cards", pad: 0.8 },
  { k: "win" },
  { k: "lesson", voice: "c_lesson" },
  { k: "outro", voice: "c_outro" },
];

export type Beat = { start: number; end: number; step: Step };
export type TimedAct = { t: number; act: Act };
export type Cue = { t: number; file: string; vol?: number };

const sec = (id: string) => LINES[id].durationMs / 1000;
const wordTime = (id: string, word: string, after: number) => {
  const w = word.toLowerCase();
  const c = LINES[id].captions.find((x) => x.startMs / 1000 >= after && x.text.trim().toLowerCase().replace(/[^a-z-]/g, "").startsWith(w));
  return c ? c.startMs / 1000 : after + 0.2;
};

const build = () => {
  const beats: Beat[] = [];
  const acts: TimedAct[] = [];
  const cues: Cue[] = [];
  let t = 0.2;
  const push = (step: Step, d: number) => {
    beats.push({ start: t, end: t + d, step });
    t += d;
  };
  const voiceActs = (id: string, at: number, list: { word: string; do: Act }[] = []) => {
    let after = 0;
    for (const a of list) {
      const rel = wordTime(id, a.word, after);
      if (a.do.a !== "hand") after = rel + 0.01;
      const tt = at + rel;
      acts.push({ t: tt, act: a.do });
      if (a.do.a === "bet") cues.push({ t: tt, file: a.do.big ? SFX.bigchips.file : SFX.chips.file, vol: 0.9 });
      if (a.do.a === "bet" && a.do.big && a.do.who === "ivey") cues.push({ t: tt, file: SFX.boom.file, vol: 0.9 });
      if (a.do.a === "check") cues.push({ t: tt, file: SFX.knock.file, vol: 0.8 });
      if (a.do.a === "flip") cues.push({ t: tt, file: SFX.flip.file, vol: 0.8 });
    }
  };
  for (const st of SCRIPT) {
    switch (st.k) {
      case "title":
        cues.push({ t, file: SFX.whoosh.file, vol: 0.7 }, { t: t + 0.6, file: LINES[st.voice].file });
        push(st, sec(st.voice) + 1.2);
        break;
      case "peek":
        cues.push({ t, file: SFX.flip.file, vol: 0.6 }, { t: t + 0.5, file: LINES[st.voice].file });
        push(st, sec(st.voice) + 1.0);
        break;
      case "voice":
        cues.push({ t, file: LINES[st.id].file });
        voiceActs(st.id, t, st.acts);
        push(st, sec(st.id) + (st.pad ?? 0.25));
        break;
      case "deal":
        for (let i = 0; i < st.n; i++) cues.push({ t: t + i * 0.16, file: SFX.deal.file, vol: 0.6 });
        push(st, 0.5 + st.n * 0.12);
        break;
      case "slowmo":
        cues.push({ t, file: SFX.slowmo.file, vol: 0.8 }, { t: t + 0.2, file: SFX.heartbeat.file, vol: 0.8 }, { t: t + 0.4, file: LINES[st.voice].file });
        voiceActs(st.voice, t + 0.4, st.acts);
        push(st, sec(st.voice) + 1.0);
        break;
      case "decide":
        cues.push({ t: t + 0.1, file: LINES.wyc.file });
        for (let i = 0; i < 3; i++) cues.push({ t: t + 1.4 + i, file: SFX.tick.file, vol: 0.9 });
        push(st, 4.5);
        break;
      case "reveal":
        cues.push({ t, file: SFX.slowmo.file, vol: 0.6 }, { t: t + 1.1, file: SFX.flip.file }, { t: t + 1.2, file: SFX.stamp.file, vol: 0.9 }, { t: t + 1.25, file: SFX.crowd.file, vol: 0.7 }, { t: t + 1.3, file: LINES[st.voice].file });
        push(st, sec(st.voice) + 1.6);
        break;
      case "win":
        cues.push({ t, file: SFX.bigchips.file, vol: 0.8 });
        push(st, 1.4);
        break;
      case "lesson":
        cues.push({ t: t + 0.3, file: LINES[st.voice].file });
        push(st, sec(st.voice) + 1.0);
        break;
      case "outro":
        cues.push({ t: t + 0.3, file: LINES[st.voice].file });
        push(st, sec(st.voice) + 2.5);
        break;
    }
  }
  // record scratch right before "cool cool cool"
  const cool = beats.find((b) => b.step.k === "voice" && b.step.id === "m_cool");
  if (cool) cues.push({ t: cool.start - 0.15, file: SFX.record.file, vol: 0.7 });
  return { beats, acts, cues, total: t };
};
export const TL = build();
export const IVEY_DURATION = Math.ceil(TL.total * FPS);
export const beatAt = (t: number) => TL.beats.find((b) => t >= b.start && t < b.end) ?? (t < TL.beats[0].start ? TL.beats[0] : TL.beats[TL.beats.length - 1]);
export const findBeat = (k: Step["k"], id?: string) => TL.beats.find((b) => b.step.k === k && (!id || (b.step as { id?: string }).id === id))!;

export type State = {
  heroBet: number;
  iveyBet: number;
  pot: number;
  dealt: number[]; // dealt time for each board card
  flips: number[]; // flip time per board card (Infinity = not yet)
  label: string;
  labelAt: number;
  lastBet: { who: Who; t: number; big?: boolean } | null;
  pop: { text: string; color: string; t: number } | null;
  hand: string;
  revealAt: number | null;
  winAt: number | null;
};

export const stateAt = (t: number): State => {
  const s: State = {
    heroBet: 0, iveyBet: 0, pot: 24000, dealt: [], flips: [Infinity, Infinity, Infinity, Infinity, Infinity], label: "", labelAt: 0, lastBet: null, pop: null, hand: "", revealAt: null, winAt: null,
  };
  const ev: { t: number; f: () => void }[] = [];
  for (const b of TL.beats) {
    if (b.start > t) break;
    const st = b.step;
    if (st.k === "deal") {
      ev.push({
        t: b.start,
        f: () => {
          s.pot += s.heroBet + s.iveyBet;
          s.heroBet = 0;
          s.iveyBet = 0;
          for (let i = 0; i < st.n; i++) s.dealt.push(b.start + i * 0.12);
        },
      });
    } else if (st.k === "reveal") ev.push({ t: b.start, f: () => (s.revealAt = b.start + 0.9) });
    else if (st.k === "win")
      ev.push({
        t: b.start,
        f: () => {
          s.pot += s.heroBet + s.iveyBet;
          s.heroBet = 0;
          s.iveyBet = 0;
          s.winAt = b.start;
          s.label = `IVEY WINS ${Math.round(s.pot / 1000)}K`;
          s.labelAt = b.start;
        },
      });
  }
  for (const a of TL.acts) {
    if (a.t > t) continue;
    ev.push({
      t: a.t,
      f: () => {
        const x = a.act;
        if (x.a === "bet") {
          if (x.who === "hero") s.heroBet = x.to;
          else s.iveyBet = x.to;
          s.lastBet = { who: x.who, t: a.t, big: x.big };
          s.label = x.label;
          s.labelAt = a.t;
        } else if (x.a === "check") {
          s.label = x.label;
          s.labelAt = a.t;
        } else if (x.a === "flip") s.flips[x.i] = a.t;
        else if (x.a === "pop") s.pop = { text: x.text, color: x.color ?? "white", t: a.t };
        else if (x.a === "hand") s.hand = x.text;
      },
    });
  }
  ev.sort((a, b) => a.t - b.t).forEach((e) => e.f());
  return s;
};
