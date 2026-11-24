import { PIECE, upperBound, type PreparedPerformance } from "../drums/hits";
import { REST, SHOULDER, STRIKE, type P2 } from "./layout";

const strikeFor = (inst: string): P2 => (inst === "bell" ? STRIKE.bell : STRIKE[PIECE[inst as keyof typeof PIECE]]);

/** Stick tip in 2D: travels between strike points and lifts up between hits. */
export const tip2d = (p: PreparedPerformance | null, hand: "R" | "L", now: number): P2 & { lift: number } => {
  const rest = { x: REST[hand].x, y: REST[hand].y - 40 + Math.sin(now * 2 + (hand === "R" ? 0 : 1.4)) * 4 };
  if (!p) return { ...rest, lift: 40 };
  const tr = p.byLimb[hand];
  const j = upperBound(tr.times, now);
  const prev = j > 0 ? tr.hits[j - 1] : null;
  const next = j < tr.hits.length ? tr.hits[j] : null;
  const from = prev ? strikeFor(prev.i) : rest;
  const to = next ? strikeFor(next.i) : rest;
  const t0 = prev ? prev.t : next ? next.t - 0.6 : now - 1;
  const t1 = next ? next.t : prev ? prev.t + 0.6 : now + 1;
  const gap = Math.max(0.03, t1 - t0);
  // long gaps: hover at rest
  if (gap > 1.2) {
    if (now - t0 > 0.4 && t1 - now > 0.4) return { ...rest, lift: 40 };
    if (t1 - now <= 0.4) {
      const s = (t1 - now) / 0.4;
      return { x: to.x + (rest.x - to.x) * s, y: to.y + (rest.y - to.y) * s - Math.sin(s * Math.PI * 0.5) * 30, lift: 40 * s };
    }
  }
  const u = Math.min(1, Math.max(0, (now - t0) / gap));
  const tr2 = Math.min(1, Math.max(0, (u - 0.12) / 0.76));
  const e = tr2 * tr2 * (3 - 2 * tr2);
  const lift = Math.min(95, Math.max(12, gap * 220)) * Math.pow(Math.sin(Math.PI * u), 0.75);
  return { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e - lift, lift };
};

const STICK_GRIP = 112;
/** Hand position: back along the stick from the tip, toward the shoulder. */
export const hand2d = (tip: P2 & { lift: number }, hand: "R" | "L"): P2 => {
  const s = SHOULDER[hand];
  const ax = s.x + (hand === "R" ? 10 : -10) - tip.x;
  const ay = s.y + 70 - tip.lift * 0.6 - tip.y;
  const len = Math.hypot(ax, ay) || 1;
  return { x: tip.x + (ax / len) * STICK_GRIP, y: tip.y + (ay / len) * STICK_GRIP };
};

/** 2-bone IK in 2D; elbow bends outward/down. */
export const elbow2d = (shoulder: P2, hand: P2, l1: number, l2: number, side: -1 | 1): P2 => {
  const dx = hand.x - shoulder.x;
  const dy = hand.y - shoulder.y;
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.5);
  const base = Math.atan2(dy, dx);
  const a = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d || 1))));
  const e1 = { x: shoulder.x + Math.cos(base + a) * l1, y: shoulder.y + Math.sin(base + a) * l1 };
  const e2 = { x: shoulder.x + Math.cos(base - a) * l1, y: shoulder.y + Math.sin(base - a) * l1 };
  const score = (e: P2) => (e.x - shoulder.x) * side + (e.y - shoulder.y) * 0.4;
  return score(e1) > score(e2) ? e1 : e2;
};
