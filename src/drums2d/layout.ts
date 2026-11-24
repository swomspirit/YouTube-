import type { Piece } from "../drums/hits";

/*
 * Front-view 2D layout (local units, stage is ~1000 x 900). The drummer sits behind the kit.
 * Audience right (+x) = drummer's left = hi-hat side.
 */
export const CENTER_X = 500;

export type P2 = { x: number; y: number };

/** Where the stick tip lands for each piece. */
export const STRIKE: Record<Piece | "bell", P2> = {
  kick: { x: 500, y: 700 },
  snare: { x: 640, y: 548 },
  hihat: { x: 790, y: 458 },
  tom1: { x: 572, y: 486 },
  tom2: { x: 428, y: 486 },
  floor: { x: 262, y: 572 },
  crash: { x: 740, y: 330 },
  crash2: { x: 330, y: 300 },
  ride: { x: 205, y: 415 },
  bell: { x: 175, y: 408 },
  china: { x: 125, y: 300 },
};

export const SHOULDER = { R: { x: 438, y: 388 }, L: { x: 562, y: 388 } }; // drummer's R is audience left
export const REST = { R: { x: 520, y: 520 }, L: { x: 620, y: 528 } };
