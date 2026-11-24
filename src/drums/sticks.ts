import * as THREE from "three";
import { PIECE, upperBound, type Limb, type PreparedPerformance } from "./hits";
import { HAND_BASE, STICK_REST, strikePoint } from "./kit";

const STICK_LEN = 0.42;
const tmp = new THREE.Vector3();

/** Stick tip position + direction (tip -> butt) for a hand at time `now`. */
export const stickPose = (p: PreparedPerformance | null, hand: "R" | "L", now: number) => {
  const rest = STICK_REST[hand].clone().add(new THREE.Vector3(0, 0.14 + Math.sin(now * 2 + (hand === "R" ? 0 : 1.5)) * 0.015, 0));
  let tip = rest.clone();
  if (p) {
    const tr = p.byLimb[hand as Limb];
    const j = upperBound(tr.times, now);
    const i = j - 1;
    const prev = i >= 0 ? tr.hits[i] : null;
    const next = j < tr.hits.length ? tr.hits[j] : null;
    const prevPos = prev ? strikePoint(PIECE[prev.i], prev.i) : rest;
    const nextPos = next ? strikePoint(PIECE[next.i], next.i) : rest;
    const t0 = prev ? prev.t : (next ? next.t - 0.6 : now - 1);
    let t1 = next ? next.t : (prev ? prev.t + 0.6 : now + 1);
    // long gaps: rise to a hover, then come back down for the next hit
    if (t1 - t0 > 1.2) {
      if (now - t0 < 0.45) {
        t1 = t0 + 0.9;
      } else if (t1 - now < 0.45) {
        const s = (t1 - now) / 0.45;
        tip = nextPos.clone().lerp(rest, s).add(new THREE.Vector3(0, Math.sin(s * Math.PI * 0.5) * 0.18, 0));
        return withDir(tip, hand, 0.18 * s);
      } else {
        return withDir(rest, hand, 0.15);
      }
    }
    const gap = Math.max(0.03, t1 - t0);
    const u = Math.min(1, Math.max(0, (now - t0) / gap));
    const travel = Math.min(1, Math.max(0, (u - 0.12) / 0.76));
    const e = travel * travel * (3 - 2 * travel);
    const lift = Math.min(0.26, Math.max(0.025, gap * 0.55));
    const height = lift * Math.pow(Math.sin(Math.PI * u), 0.75);
    const target = next ? nextPos : rest;
    tip = (prev ? prevPos : rest).clone().lerp(target, e).add(new THREE.Vector3(0, height, 0));
    return withDir(tip, hand, height);
  }
  return withDir(tip, hand, 0.15);
};

const withDir = (tip: THREE.Vector3, hand: "R" | "L", height: number) => {
  // stick points back toward the hand; raised sticks tilt up more (wrist)
  const base = HAND_BASE[hand].clone().add(new THREE.Vector3(0, height * 1.6, 0));
  const dir = tmp.copy(base).sub(tip).normalize().clone();
  const butt = tip.clone().add(dir.clone().multiplyScalar(STICK_LEN));
  const mid = tip.clone().add(butt).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().negate());
  return { tip, mid, quat, len: STICK_LEN };
};

/** Kick beater angle (radians). 0 = touching the head, negative = pulled back. */
export const beaterAngle = (p: PreparedPerformance | null, foot: "RF" | "LF", now: number) => {
  const back = -0.75;
  if (!p) return back;
  const tr = p.byLimb[foot];
  const j = upperBound(tr.times, now);
  const prev = j > 0 ? tr.hits[j - 1] : null;
  const next = j < tr.hits.length ? tr.hits[j] : null;
  // swings back after each hit, then swings in to land exactly on the next one
  let a = back;
  if (prev) a = back * Math.min(1, 1 - Math.exp(-(now - prev.t) / 0.05));
  if (next) {
    const window = Math.max(0.03, Math.min(0.09, next.t - (prev ? prev.t : -1) - 0.02));
    const until = next.t - now;
    if (until < window) a = Math.max(a, back * (until / window));
  }
  return a;
};
