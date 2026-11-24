import { useThree } from "@react-three/fiber";
import * as THREE from "three";

type Shot = (u: number) => { pos: [number, number, number]; target: [number, number, number]; fov: number };

/** Camera shots. u = seconds since the shot started (for slow drifts). */
const SHOTS: Record<string, Shot> = {
  wide: (u) => ({ pos: [Math.sin(u * 0.08) * 0.6, 1.75, 3.6 - u * 0.03], target: [0, 0.62, -0.1], fov: 44 }),
  hero: (u) => ({ pos: [1.25 - u * 0.04, 0.62, 2.4], target: [0, 0.78, -0.1], fov: 42 }),
  overhead: (u) => ({ pos: [Math.sin(u * 0.15) * 0.4, 3.1, 1.25], target: [0, 0.55, -0.35], fov: 45 }),
  hats: (u) => ({ pos: [1.55, 1.4 + u * 0.01, 1.0], target: [0.45, 0.78, -0.2], fov: 40 }),
  toms: (u) => ({ pos: [-0.25 + u * 0.03, 1.7, 1.35], target: [0, 0.72, -0.1], fov: 42 }),
  pov: (u) => ({ pos: [0.05, 1.65, -1.2], target: [0.05 + Math.sin(u * 0.3) * 0.1, 0.62, 0.4], fov: 58 }),
  kick: (u) => ({ pos: [0.45, 0.55, 1.4 - u * 0.02], target: [0, 0.3, 0], fov: 40 }),
  ride: (u) => ({ pos: [-1.7, 1.55, 1.0], target: [-0.5, 0.85, -0.15], fov: 42 }),
  orbit: (u) => {
    const a = u * 0.22;
    return { pos: [Math.sin(a) * 3.2, 1.6, Math.cos(a) * 3.2], target: [0, 0.65, -0.1], fov: 44 };
  },
};
export type ShotName = keyof typeof SHOTS;

const v1 = new THREE.Vector3();

export const CameraDirector: React.FC<{ shot: ShotName; u: number; shake: number; seed: number }> = ({ shot, u, shake, seed }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const s = SHOTS[shot](u);
  const sx = Math.sin(seed * 12.9898 + u * 61) * shake;
  const sy = Math.cos(seed * 78.233 + u * 47) * shake;
  camera.position.set(s.pos[0] + sx, s.pos[1] + sy, s.pos[2]);
  camera.lookAt(v1.set(...s.target));
  if (camera.fov !== s.fov) {
    camera.fov = s.fov;
    camera.updateProjectionMatrix();
  }
  return null;
};

/** Shot plan per level: which shot to use for bar n. */
export const shotForBar = (level: number, barIndex: number): ShotName => {
  const plans: ShotName[][] = [
    ["wide", "hats", "hero", "kick", "overhead", "toms"],
    ["wide", "hats", "pov", "ride", "hero", "toms", "overhead", "kick"],
    ["hero", "pov", "overhead", "toms", "kick", "hats", "ride", "wide"],
  ];
  const every = level === 3 ? 2 : 4;
  const plan = plans[level - 1];
  return plan[Math.floor(Math.max(0, barIndex) / every) % plan.length];
};
