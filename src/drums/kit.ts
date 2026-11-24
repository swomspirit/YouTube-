import * as THREE from "three";
import type { Piece } from "./hits";

/*
 * Drum kit layout (metres). Camera looks from +z toward the drummer, who sits at z = -0.8.
 * +x is the audience's right = the drummer's left (hi-hat side).
 */
export type DrumDef = { kind: "drum"; pos: [number, number, number]; rot: [number, number, number]; r: number; h: number };
export type CymbalDef = { kind: "cymbal"; pos: [number, number, number]; rot: [number, number, number]; r: number; china?: boolean };
export type KitPiece = DrumDef | CymbalDef | { kind: "kick"; pos: [number, number, number]; r: number; depth: number } | { kind: "hihat"; pos: [number, number, number]; r: number };

export const KIT: Record<Piece, KitPiece> = {
  kick: { kind: "kick", pos: [0, 0.33, 0], r: 0.3, depth: 0.44 },
  snare: { kind: "drum", pos: [0.32, 0.68, -0.22], rot: [-0.12, 0, -0.06], r: 0.17, h: 0.14 },
  hihat: { kind: "hihat", pos: [0.7, 0.98, -0.26], r: 0.18 },
  tom1: { kind: "drum", pos: [0.19, 0.93, 0.02], rot: [-0.4, 0, -0.12], r: 0.13, h: 0.17 },
  tom2: { kind: "drum", pos: [-0.19, 0.95, 0.02], rot: [-0.4, 0, 0.12], r: 0.15, h: 0.19 },
  floor: { kind: "drum", pos: [-0.56, 0.52, -0.26], rot: [-0.05, 0, 0.04], r: 0.21, h: 0.34 },
  crash: { kind: "cymbal", pos: [0.62, 1.44, 0.02], rot: [-0.35, 0, -0.25], r: 0.26 },
  crash2: { kind: "cymbal", pos: [-0.38, 1.52, 0.08], rot: [-0.35, 0, 0.22], r: 0.24 },
  ride: { kind: "cymbal", pos: [-0.86, 1.12, -0.18], rot: [-0.22, 0, 0.28], r: 0.3 },
  china: { kind: "cymbal", pos: [-0.95, 1.48, 0.0], rot: [-0.3, 0, 0.35], r: 0.22, china: true },
};

export const DRUMMER = new THREE.Vector3(0, 1.05, -0.85);
export const HAND_BASE = { R: new THREE.Vector3(-0.2, 0.95, -0.62), L: new THREE.Vector3(0.22, 0.95, -0.62) };
export const STICK_REST = { R: new THREE.Vector3(0.1, 0.92, -0.32), L: new THREE.Vector3(0.36, 0.9, -0.36) };

const up = new THREE.Vector3(0, 1, 0);

/** Where a stick tip lands for each piece. */
export const strikePoint = (piece: Piece, inst?: string): THREE.Vector3 => {
  const k = KIT[piece];
  const pos = new THREE.Vector3(...k.pos);
  if (k.kind === "drum") {
    const n = up.clone().applyEuler(new THREE.Euler(...k.rot));
    const toward = DRUMMER.clone().sub(pos).setY(0).normalize().multiplyScalar(k.r * 0.25);
    return pos.add(n.multiplyScalar(k.h / 2 + 0.005)).add(toward);
  }
  if (k.kind === "hihat") {
    return pos.clone().add(new THREE.Vector3(-0.08, 0.035, -0.04));
  }
  if (k.kind === "cymbal") {
    if (inst === "bell") return pos.clone().add(new THREE.Vector3(0, 0.03, 0));
    const toward = DRUMMER.clone().sub(pos).setY(0).normalize().multiplyScalar(k.r * 0.7);
    return pos.clone().add(toward).add(new THREE.Vector3(0, 0.02 - k.r * 0.15, 0));
  }
  return pos;
};

export const PIECE_COLOR: Record<Piece, string> = {
  crash: "#ffd166", crash2: "#ffd166", china: "#ffd166", ride: "#ff9f43", hihat: "#2ec4b6",
  tom1: "#4cc9f0", tom2: "#4895ef", floor: "#7b6cf6", snare: "#f72585", kick: "#ff4d4d",
};
