import audio from "../reels/ivey-short/audio.generated.json";
import type { Expr } from "../demo-twist/chars";

/*
 * "He Checked Three Times" — vertical Short of the Ivey vs Shahade Shark Cage hand.
 * Ranks, bets and story per public write-ups; suits are illustrative.
 * Hook = flash-forward to the river, then "Let's rewind" and replay from preflop.
 */
export const FPS = 30;
type Caption = { text: string; startMs: number; endMs: number };
type LineInfo = { file: string; durationMs: number; captions: Caption[] };
export const LINES = audio.lines as Record<string, LineInfo>;
export const SFX = audio.sfx as Record<string, { file: string; durationMs: number }>;
export const MUSIC = (audio as unknown as { music: Record<string, { file: string; durationMs: number }> }).music;

export const HERO_CARDS = ["Ad", "Qd"];
export const IVEY_CARDS = ["Ah", "Ac"];
export const BOARD = ["8c", "8d", "As", "7h", "9c"];

export type Shot = "wide" | "iveyClose" | "heroClose" | "heroCards" | "board" | "chipsIvey" | "iveyCards" | "crowd" | "pullback";
type Act =
  | { a: "bet"; who: "hero" | "ivey"; to: number; big?: boolean }
  | { a: "check"; who: "hero" | "ivey" }
  | { a: "deal"; n: number }
  | { a: "flip"; i: number }
  | { a: "reveal" }
  | { a: "shot"; shot: Shot }
  | { a: "heroExpr"; e: Expr }
  | { a: "iveyExpr"; e: Expr }
  | { a: "crowdExpr"; e: Expr }
  | { a: "overlay"; o: Overlay }
  | { a: "peek" };
export type Overlay = "rewind" | "timebank" | "odds" | "lesson" | "cta" | null;

type Seg = { id: string; shot: Shot; hook?: boolean; pad?: number; acts?: { word?: string; at?: number; same?: boolean; do: Act }[] };

const SEGS: Seg[] = [
  { id: "n1", shot: "iveyClose", hook: true, pad: 0.2, acts: [{ word: "three", do: { a: "check", who: "ivey" } }] },
  { id: "n2", shot: "heroClose", hook: true, acts: [{ at: 0, do: { a: "heroExpr", e: "smirk" } }, { word: "bet", do: { a: "bet", who: "hero", to: 125 } }] },
  {
    id: "n3",
    shot: "chipsIvey",
    hook: true,
    pad: 0.5,
    acts: [
      { word: "this", do: { a: "bet", who: "ivey", to: 450, big: true } },
      { word: "this", same: true, do: { a: "crowdExpr", e: "shock" } },
    ],
  },
  { id: "n4", shot: "wide", hook: true, pad: 0.4, acts: [{ at: 0, do: { a: "overlay", o: "rewind" } }] },
  {
    id: "n5",
    shot: "wide",
    acts: [
      { at: 0, do: { a: "overlay", o: null } },
      { word: "raises", do: { a: "bet", who: "ivey", to: 38 } },
      { word: "calls", do: { a: "bet", who: "hero", to: 38 } },
      { word: "button", do: { a: "shot", shot: "heroCards" } },
      { word: "button", same: true, do: { a: "peek" } },
    ],
  },
  {
    id: "n6",
    shot: "board",
    acts: [
      { at: 0, do: { a: "deal", n: 3 } },
      { word: "Eight", do: { a: "flip", i: 0 } },
      { word: "Eight", do: { a: "flip", i: 1 } },
      { word: "Ace", do: { a: "flip", i: 2 } },
      { word: "Two", do: { a: "shot", shot: "heroClose" } },
      { word: "Two", same: true, do: { a: "heroExpr", e: "smirk" } },
      { word: "bets", do: { a: "shot", shot: "wide" } },
      { word: "fifty", do: { a: "bet", who: "hero", to: 50 } },
      { word: "calls", do: { a: "bet", who: "ivey", to: 50 } },
    ],
  },
  {
    id: "n7",
    shot: "board",
    acts: [
      { at: 0, do: { a: "deal", n: 1 } },
      { word: "seven", do: { a: "flip", i: 3 } },
      { word: "Check", do: { a: "shot", shot: "iveyClose" } },
      { word: "Check", same: true, do: { a: "check", who: "ivey" } },
      { word: "Check", do: { a: "check", who: "hero" } },
    ],
  },
  {
    id: "n8",
    shot: "board",
    acts: [
      { at: 0, do: { a: "deal", n: 1 } },
      { word: "nine", do: { a: "flip", i: 4 } },
      { word: "Ivey", do: { a: "shot", shot: "iveyClose" } },
      { word: "checks", do: { a: "check", who: "ivey" } },
    ],
  },
  {
    id: "n9",
    shot: "heroClose",
    acts: [
      { at: 0, do: { a: "heroExpr", e: "smirk" } },
      { word: "bets", do: { a: "shot", shot: "wide" } },
      { word: "hundred", do: { a: "bet", who: "hero", to: 125 } },
    ],
  },
  {
    id: "n10",
    shot: "chipsIvey",
    pad: 0.6,
    acts: [
      { word: "four", do: { a: "bet", who: "ivey", to: 450, big: true } },
      { word: "four", same: true, do: { a: "crowdExpr", e: "shock" } },
      { word: "four", same: true, do: { a: "heroExpr", e: "shock" } },
      { word: "thousand", do: { a: "shot", shot: "crowd" } },
    ],
  },
  {
    id: "n11",
    shot: "heroClose",
    acts: [
      { at: 0, do: { a: "heroExpr", e: "worried" } },
      { at: 0, do: { a: "crowdExpr", e: "neutral" } },
      { word: "three", do: { a: "overlay", o: "timebank" } },
      { word: "twenty-nine", do: { a: "overlay", o: "odds" } },
    ],
  },
  { id: "n12", shot: "wide", pad: 0.5, acts: [{ at: 0, do: { a: "overlay", o: null } }, { word: "calls", do: { a: "bet", who: "hero", to: 450, big: true } }] },
  {
    id: "n13",
    shot: "iveyCards",
    pad: 0.4,
    acts: [
      { at: 0.1, do: { a: "reveal" } },
      { at: 0.3, do: { a: "crowdExpr", e: "shock" } },
      { word: "flopped", do: { a: "shot", shot: "iveyClose" } },
      { word: "flopped", same: true, do: { a: "iveyExpr", e: "smirk" } },
      { word: "checked", do: { a: "shot", shot: "heroClose" } },
      { word: "checked", same: true, do: { a: "heroExpr", e: "shock" } },
    ],
  },
  { id: "n14", shot: "pullback", acts: [{ at: 0, do: { a: "overlay", o: "lesson" } }, { at: 0, do: { a: "crowdExpr", e: "neutral" } }] },
  { id: "n15", shot: "heroClose", pad: 2.2, acts: [{ at: 0, do: { a: "overlay", o: "cta" } }, { at: 0, do: { a: "heroExpr", e: "worried" } }] },
];

const sec = (id: string) => LINES[id].durationMs / 1000;
const wordTime = (id: string, word: string, after: number) => {
  const w = word.toLowerCase();
  const c = LINES[id].captions.find((x) => x.startMs / 1000 >= after - 0.001 && x.text.trim().toLowerCase().replace(/[^a-z-]/g, "").startsWith(w));
  return c ? c.startMs / 1000 : after;
};

export type Seg2 = Seg & { start: number; end: number };
export type TimedAct = { t: number; seg: number; act: Act };
export type Cue = { t: number; file: string; vol?: number };

const build = () => {
  const segs: Seg2[] = [];
  const acts: TimedAct[] = [];
  const cues: Cue[] = [];
  let t = 0.35;
  SEGS.forEach((sg, si) => {
    const start = t;
    cues.push({ t: start, file: LINES[sg.id].file });
    let after = -1;
    for (const a of sg.acts ?? []) {
      let rel: number;
      if (a.at !== undefined) rel = a.at;
      else if (a.same && after >= 0) rel = after; // happens together with the previous word-synced action
      else {
        rel = wordTime(sg.id, a.word!, after < 0 ? 0 : after + 0.01);
        after = rel;
      }
      const at = start + rel;
      acts.push({ t: at, seg: si, act: a.do });
      const d = a.do;
      if (d.a === "bet") cues.push({ t: at, file: d.big ? SFX.bigchips.file : SFX.chips.file, vol: 0.85 });
      if (d.a === "check") cues.push({ t: at, file: SFX.knock.file, vol: 0.8 });
      if (d.a === "flip") cues.push({ t: at, file: SFX.flip.file, vol: 0.8 });
      if (d.a === "deal") for (let i = 0; i < d.n; i++) cues.push({ t: at + i * 0.12, file: SFX.deal.file, vol: 0.6 });
      if (d.a === "reveal") cues.push({ t: at + 0.2, file: SFX.flip.file, vol: 0.9 });
      if (d.a === "crowdExpr" && d.e === "shock") cues.push({ t: at, file: SFX.gasp.file, vol: 0.55 });
      if (d.a === "overlay" && d.o === "rewind") cues.push({ t: at, file: SFX.rewind.file, vol: 0.8 });
    }
    t = start + sec(sg.id) + (sg.pad ?? 0.3);
    segs.push({ ...sg, start, end: t });
  });
  return { segs, acts, cues, total: t };
};
export const TL = build();
export const SHORT_DURATION = Math.ceil(TL.total * FPS);
export const segAt = (t: number) => TL.segs.find((s) => t >= s.start && t < s.end) ?? (t < TL.segs[0].start ? TL.segs[0] : TL.segs[TL.segs.length - 1]);

export type State = {
  shot: Shot;
  shotAt: number;
  board: { dealt: number; flip: number }[];
  heroBet: number;
  iveyBet: number;
  pot: number;
  lastBet: { who: "hero" | "ivey"; t: number; big?: boolean } | null;
  lastCheck: { who: "hero" | "ivey"; t: number } | null;
  heroExpr: Expr;
  iveyExpr: Expr;
  crowdExpr: Expr;
  overlay: Overlay;
  overlayAt: number;
  revealAt: number | null;
  peekAt: number | null;
};

const HOOK_BOARD = BOARD.map(() => ({ dealt: -10, flip: -10 }));

export const stateAt = (t: number): State => {
  const seg = segAt(t);
  const segIdx = TL.segs.indexOf(seg);
  const hookPhase = !!seg.hook;
  const s: State = {
    shot: seg.shot,
    shotAt: seg.start,
    board: hookPhase ? HOOK_BOARD.slice() : [],
    heroBet: 0,
    iveyBet: 0,
    pot: hookPhase ? 220 : 44,
    lastBet: null,
    lastCheck: null,
    heroExpr: "focus",
    iveyExpr: "neutral",
    crowdExpr: "neutral",
    overlay: null,
    overlayAt: 0,
    revealAt: null,
    peekAt: null,
  };
  for (const a of TL.acts) {
    if (a.t > t) break;
    const aSeg = TL.segs[a.seg];
    if (!!aSeg.hook !== hookPhase) {
      // overlays/expressions from the hook don't leak into the story (and vice versa)
      continue;
    }
    if (a.seg === segIdx || a.act.a !== "shot") {
      /* shot changes only matter inside their own segment */
    }
    const x = a.act;
    switch (x.a) {
      case "bet":
        if (x.who === "hero") s.heroBet = x.to;
        else s.iveyBet = x.to;
        s.lastBet = { who: x.who, t: a.t, big: x.big };
        break;
      case "check":
        s.lastCheck = { who: x.who, t: a.t };
        break;
      case "deal":
        s.pot += s.heroBet + s.iveyBet;
        s.heroBet = 0;
        s.iveyBet = 0;
        for (let i = 0; i < x.n; i++) s.board.push({ dealt: a.t + i * 0.12, flip: Infinity });
        break;
      case "flip":
        if (s.board[x.i]) s.board[x.i].flip = a.t;
        break;
      case "reveal":
        s.revealAt = a.t;
        break;
      case "peek":
        s.peekAt = a.t;
        break;
      case "shot":
        if (a.seg === segIdx) {
          s.shot = x.shot;
          s.shotAt = a.t;
        }
        break;
      case "heroExpr":
        s.heroExpr = x.e;
        break;
      case "iveyExpr":
        s.iveyExpr = x.e;
        break;
      case "crowdExpr":
        s.crowdExpr = x.e;
        break;
      case "overlay":
        s.overlay = x.o;
        s.overlayAt = a.t;
        break;
    }
  }
  return s;
};
