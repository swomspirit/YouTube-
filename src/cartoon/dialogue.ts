import type { Caption } from "@remotion/captions";

export type Line = { speaker: string; file: string; durationMs: number; captions: Caption[] };

export const msToFrames = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

/**
 * Mouth openness (0..1) for simple lip flap: open/close while a word is
 * being spoken, closed between words.
 */
export const mouthFor = (line: Line, lineStart: number, frame: number, fps: number) => {
  const ms = ((frame - lineStart) / fps) * 1000;
  const speaking = line.captions.some((c) => c.startMs <= ms && c.endMs >= ms);
  if (!speaking) return 0;
  return 0.35 + 0.65 * Math.abs(Math.sin(frame * 1.1));
};

export const isSpeaking = (line: Line, lineStart: number, frame: number, fps: number) => {
  const ms = ((frame - lineStart) / fps) * 1000;
  return ms >= 0 && ms <= line.durationMs;
};
