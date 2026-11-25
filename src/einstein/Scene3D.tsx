import { useMemo } from "react";
import { random } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Starfield } from "../components/Starfield";
import { glowTexture } from "../astatine/space";
import { TL, W, beatOf, vis } from "./timeline";

/*
 * The photoelectric "lab": a lamp, a beam (drawn as a wave or as photon packets), a metal plate,
 * and electrons that get knocked out. Everything is a pure function of time t.
 */
const LAMP = new THREE.Vector3(-4.2, 0.25, 0);
const PLATE_X = 1.7;
const PHOTON_SPEED = 6;
const TRAVEL = (PLATE_X - LAMP.x - 0.5) / PHOTON_SPEED;

export const COLORS = { white: "#fff1cf", red: "#ff3b3b", violet: "#b05cff", blue: "#6f7bff" } as const;
type Col = keyof typeof COLORS;
const LAMBDA: Record<Col, number> = { white: 0.8, red: 1.15, violet: 0.5, blue: 0.36 };
const ENERGETIC: Record<Col, boolean> = { white: true, red: false, violet: true, blue: true };

type Cfg = { mode: "off" | "wave" | "photon"; color: Col | "mixed"; I: number; eRate: number; eSpeed: number };
type SegCfg = { t0: number; t1: number; c: Cfg };

/** Beam settings over time, keyed to narration words. */
const buildSegs = (): SegCfg[] => {
  const out: SegCfg[] = [];
  const add = (t0: number, t1: number, c: Cfg) => out.push({ t0, t1, c });
  const b = (id: string) => beatOf(id);
  const off: Cfg = { mode: "off", color: "white", I: 0, eRate: 0, eSpeed: 0 };
  add(b("e02").start, b("e02").end, { mode: "wave", color: "white", I: 0.6, eRate: 0, eSpeed: 0 });
  add(b("e04").start, W("e04", "Shine"), off);
  add(W("e04", "Shine"), W("e04", "electrons"), { mode: "wave", color: "white", I: 0.7, eRate: 0, eSpeed: 0 });
  add(W("e04", "electrons"), b("e04").end, { mode: "wave", color: "white", I: 0.7, eRate: 3, eSpeed: 2 });
  add(b("e05").start, b("e05").end, { mode: "wave", color: "white", I: 0.5, eRate: 0, eSpeed: 0 });
  add(b("e06").start, W("e06", "Blast"), off);
  add(W("e06", "Blast"), b("e06").end, { mode: "wave", color: "red", I: 1, eRate: 0, eSpeed: 0 });
  add(b("e07").start, W("e07", "Electrons"), { mode: "wave", color: "violet", I: 0.3, eRate: 0, eSpeed: 0 });
  add(W("e07", "Electrons"), b("e07").end, { mode: "wave", color: "violet", I: 0.3, eRate: 3, eSpeed: 2.2 });
  add(b("e08").start, W("e08", "brighter"), { mode: "wave", color: "violet", I: 0.3, eRate: 3, eSpeed: 2.2 });
  add(W("e08", "brighter"), W("e08", "color"), { mode: "wave", color: "violet", I: 1, eRate: 10, eSpeed: 2.2 });
  add(W("e08", "color"), b("e08").end, { mode: "wave", color: "blue", I: 0.7, eRate: 6, eSpeed: 4 });
  add(b("e09").start, W("e09", "packets"), { mode: "wave", color: "violet", I: 0.6, eRate: 0, eSpeed: 0 });
  add(W("e09", "packets"), b("e09").end, { mode: "photon", color: "violet", I: 4, eRate: 0, eSpeed: 2.4 });
  add(b("e10").start, W("e10", "Violet"), { mode: "photon", color: "red", I: 4, eRate: 0, eSpeed: 2.4 });
  add(W("e10", "Violet"), b("e10").end, { mode: "photon", color: "violet", I: 4, eRate: 0, eSpeed: 2.4 });
  add(b("e12").start, b("e12").end, { mode: "photon", color: "mixed", I: 3, eRate: 0, eSpeed: 2.4 });
  add(b("e17").start, b("e17").end, { mode: "photon", color: "mixed", I: 9, eRate: 0, eSpeed: 2.8 });
  add(b("e19").start, b("e19").end, { mode: "photon", color: "violet", I: 5, eRate: 0, eSpeed: 2.4 });
  return out;
};
const SEGS = buildSegs();
export const cfgAt = (t: number) => SEGS.find((s) => t >= s.t0 && t < s.t1)?.c ?? null;

/* deterministic particle sources */
type Photon = { te: number; y: number; z: number; col: Col };
type Electron = { t0: number; o: THREE.Vector3; d: THREE.Vector3; v: number };
const photonsIn = (s: SegCfg): Photon[] => {
  if (s.c.mode !== "photon") return [];
  const n = Math.floor((s.t1 - s.t0) * s.c.I);
  return Array.from({ length: n }, (_, k) => {
    const key = `${s.t0.toFixed(2)}-${k}`;
    const col: Col = s.c.color === "mixed" ? (k % 2 ? "violet" : "red") : (s.c.color as Col);
    return { te: s.t0 + (k + 0.5 * random(`pt${key}`)) / s.c.I, y: (random(`py${key}`) - 0.5) * 1.6, z: (random(`pz${key}`) - 0.5) * 1.4, col };
  });
};
const dirFrom = (key: string) => new THREE.Vector3(-1, (random(`ey${key}`) - 0.25) * 1.4, (random(`ez${key}`) - 0.5) * 1.2).normalize();
const electronsIn = (s: SegCfg): Electron[] => {
  if (s.c.mode === "wave" && s.c.eRate > 0) {
    const n = Math.floor((s.t1 - s.t0) * s.c.eRate);
    return Array.from({ length: n }, (_, k) => {
      const key = `w${s.t0.toFixed(2)}-${k}`;
      return { t0: s.t0 + (k + random(`et${key}`)) / s.c.eRate, o: new THREE.Vector3(PLATE_X - 0.05, (random(`oy${key}`) - 0.5) * 2, (random(`oz${key}`) - 0.5) * 1.8), d: dirFrom(key), v: s.c.eSpeed };
    });
  }
  if (s.c.mode === "photon")
    return photonsIn(s)
      .filter((p) => ENERGETIC[p.col])
      .map((p, k) => ({ t0: p.te + TRAVEL, o: new THREE.Vector3(PLATE_X - 0.05, p.y, p.z), d: dirFrom(`p${s.t0.toFixed(2)}-${k}`), v: s.c.eSpeed }));
  return [];
};
const ALL_PHOTONS = SEGS.flatMap(photonsIn);
const ALL_ELECTRONS = SEGS.flatMap(electronsIn);

/* ---------------- components ---------------- */
const Glow: React.FC<{ tex: THREE.Texture; color: string; size: number; opacity: number; p: [number, number, number] }> = ({ tex, color, size, opacity, p }) =>
  opacity > 0.004 ? (
    <sprite position={p} scale={[size, size, 1]}>
      <spriteMaterial map={tex} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  ) : null;

const Lab: React.FC<{ t: number; k: number; tex: THREE.Texture }> = ({ t, k, tex }) => {
  const c = cfgAt(t);
  const beamCol = c && c.mode !== "off" ? (c.color === "mixed" ? "#d88cff" : COLORS[c.color]) : "#333";
  const on = c && c.mode !== "off" ? 1 : 0;
  // wave samples along the beam
  const wave =
    c && c.mode === "wave"
      ? Array.from({ length: 80 }, (_, i) => {
          const x = LAMP.x + 0.5 + (i / 79) * (PLATE_X - LAMP.x - 0.5);
          const lam = LAMBDA[c.color as Col];
          const A = 0.12 + 0.3 * c.I;
          return [x, LAMP.y * (1 - i / 79) + Math.sin(((x - t * 2.2) / lam) * Math.PI * 2) * A, 0] as [number, number, number];
        })
      : [];
  const live = ALL_PHOTONS.filter((p) => t >= p.te && t < p.te + TRAVEL + 0.9);
  const elec = ALL_ELECTRONS.filter((e) => t >= e.t0 && t < e.t0 + 1.8);
  const hitGlow = elec.some((e) => t - e.t0 < 0.15) ? 1 : 0;
  return (
    <group rotation={[0.12, 0.6, 0]} position={[0.3, -0.2, 0]} scale={0.85 + 0.15 * k}>
      {/* lamp */}
      <mesh position={LAMP} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.62, 1.0, 40]} />
        <meshStandardMaterial color="#3a3f4c" metalness={0.6} roughness={0.35} transparent opacity={k} />
      </mesh>
      <mesh position={[LAMP.x + 0.51, LAMP.y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.42, 40]} />
        <meshBasicMaterial color={on ? beamCol : "#222"} transparent opacity={k} />
      </mesh>
      <Glow tex={tex} color={beamCol} size={2.2} opacity={on * 0.7 * k} p={[LAMP.x + 0.6, LAMP.y, 0]} />
      {/* soft beam cone */}
      {on ? (
        <mesh position={[(LAMP.x + PLATE_X) / 2 + 0.25, LAMP.y / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.0, 0.36, PLATE_X - LAMP.x - 0.5, 32, 1, true]} />
          <meshBasicMaterial color={beamCol} transparent opacity={(0.05 + 0.08 * Math.min(1, c!.mode === "wave" ? c!.I : 0.6)) * k} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
      {wave.map((p, i) => (
        <Glow key={i} tex={tex} color={beamCol} size={0.16 + 0.14 * (c?.I ?? 0)} opacity={(0.55 + 0.45 * (c?.I ?? 0)) * k} p={p} />
      ))}
      {/* photons: glowing packets with a little wiggle */}
      {live.map((p, i) => {
        const dt = t - p.te;
        const col = COLORS[p.col];
        const big = ENERGETIC[p.col] ? 1 : 0.6;
        let x: number, y: number, z: number, o = 1;
        if (dt < TRAVEL) {
          x = LAMP.x + 0.5 + dt * PHOTON_SPEED;
          y = LAMP.y + (p.y - LAMP.y) * (dt / TRAVEL);
          z = p.z * (dt / TRAVEL);
        } else if (!ENERGETIC[p.col]) {
          const b = dt - TRAVEL; // bounce off
          x = PLATE_X - b * 3;
          y = p.y + b * 2.2;
          z = p.z;
          o = Math.max(0, 1 - b / 0.9);
        } else return null;
        return (
          <group key={i}>
            <Glow tex={tex} color={col} size={0.7 * big} opacity={0.95 * o * k} p={[x, y, z]} />
            {[1, 2, 3].map((q) => (
              <Glow key={q} tex={tex} color={col} size={0.26 * big} opacity={0.7 * o * k} p={[x - q * 0.14, y + Math.sin(dt * 40 - q) * 0.1 * big, z]} />
            ))}
          </group>
        );
      })}
      {/* metal plate with surface atoms */}
      <mesh position={[PLATE_X + 0.25, 0, 0]}>
        <boxGeometry args={[0.5, 3.2, 2.6]} />
        <meshStandardMaterial color="#9aa3b2" metalness={0.75} roughness={0.28} emissive="#6fb8ff" emissiveIntensity={0.15 * hitGlow} transparent opacity={k} />
      </mesh>
      {Array.from({ length: 30 }, (_, i) => {
        const y = -1.3 + (i % 6) * 0.52;
        const z = -1.05 + Math.floor(i / 6) * 0.52;
        return (
          <mesh key={i} position={[PLATE_X - 0.02, y, z]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="#cfd6e4" metalness={0.5} roughness={0.3} transparent opacity={k} />
          </mesh>
        );
      })}
      {/* ejected electrons */}
      {elec.map((e, i) => {
        const d = (t - e.t0) * e.v;
        const p: [number, number, number] = [e.o.x + e.d.x * d, e.o.y + e.d.y * d, e.o.z + e.d.z * d];
        const o = Math.max(0, 1 - (t - e.t0) / 1.8) * k;
        return (
          <group key={i}>
            <Glow tex={tex} color="#4fc3ff" size={0.6} opacity={o} p={p} />
            <Glow tex={tex} color="#e9fbff" size={0.18} opacity={o} p={p} />
            <Glow tex={tex} color="#4fc3ff" size={0.3} opacity={o * 0.5} p={[p[0] - e.d.x * 0.18, p[1] - e.d.y * 0.18, p[2] - e.d.z * 0.18]} />
          </group>
        );
      })}
      {/* flash where photons hit */}
      {elec.filter((e) => t - e.t0 < 0.18).map((e, i) => (
        <Glow key={`h${i}`} tex={tex} color="#ffffff" size={0.9} opacity={(1 - (t - e.t0) / 0.18) * k} p={[e.o.x, e.o.y, e.o.z]} />
      ))}
    </group>
  );
};

export const EinsteinScene3D: React.FC<{ t: number }> = ({ t }) => {
  const tex = useMemo(() => glowTexture(), []);
  const camera = useThree((s) => s.camera);
  camera.position.set(Math.sin(t * 0.06) * 0.35, 0.6 + Math.sin(t * 0.08) * 0.12, 9);
  camera.lookAt(0, 0, 0);
  void TL;
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 5, 6]} intensity={2.2} />
      <pointLight position={[-5, 2, 4]} intensity={25} color="#9fc8ff" />
      <Starfield count={1400} radius={60} seed="einstein" />
      <Lab t={t} k={vis("lab", t, 0.5, 0.45)} tex={tex} />
    </>
  );
};
