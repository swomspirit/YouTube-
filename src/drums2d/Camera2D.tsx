export type Shot2D = { cx: number; cy: number; z: number };
export const SHOTS2D: Record<string, Shot2D> = {
  wide: { cx: 500, cy: 500, z: 1.22 },
  mid: { cx: 500, cy: 440, z: 1.45 },
  face: { cx: 500, cy: 330, z: 2.3 },
  handsR: { cx: 690, cy: 500, z: 1.8 },
  handsL: { cx: 320, cy: 480, z: 1.8 },
  kick: { cx: 500, cy: 640, z: 1.7 },
  crowd: { cx: 500, cy: 640, z: 0.85 },
};
const PLANS: string[][] = [
  ["wide", "mid", "face", "handsR", "wide", "kick"],
  ["wide", "handsR", "mid", "handsL", "face", "kick", "wide", "mid"],
  ["face", "wide", "handsR", "mid", "kick", "handsL", "face", "crowd"],
];
export const shot2dForBar = (level: number, bar: number) => {
  const every = level === 3 ? 2 : 4;
  const plan = PLANS[Math.min(2, level - 1)];
  return SHOTS2D[plan[Math.floor(Math.max(0, bar) / every) % plan.length]];
};

/** SVG transform for a shot. drift = slow push-in over the shot, punch = crash zoom, shake in px. */
export const cameraTransform = (s: Shot2D, W: number, Y0: number, base: number, drift: number, punch: number, shakeX: number, shakeY: number) => {
  const z = base * s.z * (1 + drift * 0.04 + punch * 0.06);
  return `translate(${W / 2 + shakeX}, ${Y0 + shakeY}) scale(${z}) translate(${-s.cx}, ${-s.cy})`;
};
