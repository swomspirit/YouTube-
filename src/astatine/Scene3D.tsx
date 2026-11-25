import { useMemo } from "react";
import { random } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Starfield } from "../components/Starfield";
import { W, beatOf, ease, vis } from "./timeline";

/*
 * All 3D for the astatine video in one canvas. Every set is driven by time `t` only
 * (no r3f clocks), so frames render deterministically and in any order.
 */
const PROTON = new THREE.Color("#ff5d6c");
const NEUTRON = new THREE.Color("#9fb3d9");
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/* ---------------- Earth ---------------- */
const useEarthTexture = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const g = c.getContext("2d")!;
    const sea = g.createLinearGradient(0, 0, 0, 512);
    sea.addColorStop(0, "#1b4f8a");
    sea.addColorStop(0.5, "#1f6fb5");
    sea.addColorStop(1, "#1b4f8a");
    g.fillStyle = sea;
    g.fillRect(0, 0, 1024, 512);
    // continents: clusters of soft blobs
    const centers = [
      [180, 170], [250, 300], [520, 160], [560, 300], [600, 220], [780, 180], [840, 330], [380, 420], [930, 260],
    ];
    centers.forEach(([cx, cy], i) => {
      for (let k = 0; k < 55; k++) {
        const a = random(`ca${i}-${k}`) * Math.PI * 2;
        const r = Math.pow(random(`cr${i}-${k}`), 0.7) * 95;
        const x = cx + Math.cos(a) * r * 1.3;
        const y = cy + Math.sin(a) * r * 0.8;
        const s = 14 + random(`cs${i}-${k}`) * 30;
        g.fillStyle = random(`cc${i}-${k}`) > 0.72 ? "#c9b27a" : random(`cg${i}-${k}`) > 0.5 ? "#3d8b4a" : "#2f7a3e";
        g.beginPath();
        g.ellipse(x, y, s, s * 0.75, random(`ce${i}-${k}`) * 3, 0, Math.PI * 2);
        g.fill();
      }
    });
    // ice caps
    g.fillStyle = "#eef4fb";
    g.fillRect(0, 0, 1024, 26);
    g.fillRect(0, 486, 1024, 26);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

const Earth: React.FC<{ t: number; k: number; x: number; sparks: boolean }> = ({ t, k, x, sparks }) => {
  const tex = useEarthTexture();
  const sparkPts = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const th = random(`sp-t${i}`) * Math.PI * 2;
        const ph = Math.acos(2 * random(`sp-p${i}`) - 1);
        return { v: new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)).multiplyScalar(2.24), off: random(`sp-o${i}`) * 3, per: 1.4 + random(`sp-r${i}`) * 1.6 };
      }),
    [],
  );
  if (k <= 0.001) return null;
  return (
    <group position={[x, 0, 0]} scale={0.6 + 0.4 * k}>
      <group rotation={[0.35, t * 0.18, 0]}>
        <mesh>
          <sphereGeometry args={[2.2, 64, 64]} />
          <meshStandardMaterial map={tex} roughness={0.85} metalness={0} transparent opacity={k} />
        </mesh>
        {sparks
          ? sparkPts.map((p, i) => {
              const ph = ((t + p.off) % p.per) / p.per;
              const s = ph < 0.25 ? Math.sin((ph / 0.25) * Math.PI) : 0;
              return s > 0.01 ? (
                <mesh key={i} position={p.v} scale={0.06 + 0.1 * s}>
                  <sphereGeometry args={[1, 12, 12]} />
                  <meshBasicMaterial color="#ffe36b" transparent opacity={s * k} />
                </mesh>
              ) : null;
            })
          : null}
      </group>
      <mesh scale={1.07}>
        <sphereGeometry args={[2.2, 48, 48]} />
        <meshBasicMaterial color="#5fb4ff" transparent opacity={0.16 * k} side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

/* ---------------- Nucleus (85 protons + 125 neutrons) ---------------- */
const NUC = (() => {
  const N = 210;
  const R = 1.55;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pts = Array.from({ length: N }, (_, i) => {
    const r = R * Math.cbrt((i + 0.5) / N);
    const y = 1 - (2 * ((i * 7919) % N + 0.5)) / N;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    return new THREE.Vector3(Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r);
  });
  // choose 85 protons deterministically
  const order = pts.map((_, i) => i).sort((a, b) => random(`np${a}`) - random(`np${b}`));
  const isProton = new Array(N).fill(false);
  order.slice(0, 85).forEach((i) => (isProton[i] = true));
  return { pts, isProton };
})();

const Nucleus: React.FC<{ t: number; k: number; shake: number; scale?: number; alphaT?: number }> = ({ t, k, shake, scale = 1, alphaT }) => {
  if (k <= 0.001) return null;
  const s = scale * (0.5 + 0.5 * ease(k));
  return (
    <group scale={s} rotation={[0.3 + t * 0.07, t * 0.25, 0]}>
      {NUC.pts.map((p, i) => {
        const j = shake * 0.09;
        const dx = Math.sin(t * 31 + i * 1.7) * j;
        const dy = Math.sin(t * 27 + i * 2.3) * j;
        const dz = Math.sin(t * 23 + i * 3.1) * j;
        return (
          <mesh key={i} position={[p.x + dx, p.y + dy, p.z + dz]}>
            <sphereGeometry args={[0.27, 18, 18]} />
            <meshStandardMaterial color={NUC.isProton[i] ? PROTON : NEUTRON} roughness={0.45} metalness={0.05} transparent opacity={k} />
          </mesh>
        );
      })}
      {alphaT !== undefined && t > alphaT ? (
        <group position={[(t - alphaT) * 3.2 + 1.3, (t - alphaT) * 1.2, (t - alphaT) * 1.5]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[(i % 2) * 0.42 - 0.21, Math.floor(i / 2) * 0.42 - 0.21, 0]}>
              <sphereGeometry args={[0.24, 16, 16]} />
              <meshStandardMaterial color={i % 2 ? NEUTRON : PROTON} emissive="#ffcc66" emissiveIntensity={0.6} />
            </mesh>
          ))}
        </group>
      ) : null}
    </group>
  );
};

/* ---------------- Atom (title + outro) ---------------- */
const SHELLS = [2, 8, 18, 32, 18, 7];
const Atom: React.FC<{ t: number; k: number }> = ({ t, k }) => {
  if (k <= 0.001) return null;
  return (
    <group scale={0.6 + 0.4 * ease(k)} rotation={[0.4, t * 0.15, 0.1]}>
      <Nucleus t={t} k={k} shake={0.15} scale={0.28} />
      {SHELLS.map((n, si) => {
        const r = 1.05 + si * 0.48;
        const tilt: [number, number, number] = [Math.PI / 2 + (si - 2.5) * 0.22, (si * 0.9) % 3, 0];
        return (
          <group key={si} rotation={tilt}>
            <mesh>
              <torusGeometry args={[r, 0.008, 6, 128]} />
              <meshBasicMaterial color="#7fd8ff" transparent opacity={0.35 * k} />
            </mesh>
            {Array.from({ length: n }, (_, e) => {
              const a = (e / n) * Math.PI * 2 + t * (0.9 - si * 0.11);
              return (
                <mesh key={e} position={[Math.cos(a) * r, Math.sin(a) * r, 0]}>
                  <sphereGeometry args={[0.035, 8, 8]} />
                  <meshBasicMaterial color="#bff0ff" transparent opacity={k} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

/* ---------------- Chunk that vaporizes itself ---------------- */
const useChunkGeo = () =>
  useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1.2, 3);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = 1 + 0.18 * Math.sin(v.x * 3.1 + 1) * Math.cos(v.y * 2.7) + 0.1 * Math.sin(v.z * 5.3);
      v.multiplyScalar(n);
      pos.setXYZ(i, v.x, v.y * 0.8, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);

const VAPOR_PTS = Array.from({ length: 220 }, (_, i) => {
  const th = random(`vp-t${i}`) * Math.PI * 2;
  const ph = Math.acos(2 * random(`vp-p${i}`) - 1);
  return { d: new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph) * 0.8 + 0.4, Math.sin(ph) * Math.sin(th)), sp: 1.5 + random(`vp-s${i}`) * 3 };
});

const Chunk: React.FC<{ t: number; k: number; mode: "hot" | "mystery"; vapT: number }> = ({ t, k, mode, vapT }) => {
  const geo = useChunkGeo();
  if (k <= 0.001) return null;
  const since = t - vapT;
  const gone = mode === "hot" ? ease(since / 1.1) : 0;
  const heat = mode === "hot" ? Math.min(1, 0.35 + Math.max(0, t - (vapT - 4)) * 0.18) : 0;
  const size = (0.5 + 0.5 * ease(k)) * (1 - gone);
  const shimmer = mode === "hot" ? Math.sin(t * 20) * 0.02 * heat : 0;
  return (
    <group>
      {size > 0.01 ? (
        <mesh geometry={geo} scale={size * (1 + shimmer)} rotation={[0.3, t * 0.35, 0.1]}>
          <meshStandardMaterial
            color={mode === "hot" ? "#3a2c28" : "#5d6270"}
            emissive={mode === "hot" ? "#ff6a1a" : "#000000"}
            emissiveIntensity={mode === "hot" ? heat * 1.6 : 0}
            metalness={mode === "hot" ? 0.3 : 0.55}
            roughness={mode === "hot" ? 0.6 : 0.28}
            flatShading
            transparent
            opacity={k}
          />
        </mesh>
      ) : null}
      {mode === "hot" && since > 0 && since < 3.2
        ? VAPOR_PTS.map((p, i) => {
            const d = since * p.sp;
            const o = Math.max(0, 1 - since / 3.2);
            return (
              <mesh key={i} position={[p.d.x * d, p.d.y * d, p.d.z * d]} scale={0.04 + 0.05 * o}>
                <sphereGeometry args={[1, 6, 6]} />
                <meshBasicMaterial color={i % 3 ? "#ffb36b" : "#fff1c2"} transparent opacity={o * k} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

/* ---------------- Cyclotron ---------------- */
const CYC = { R: 2.3, turns: 6, spiralT: 3.0, flyT: 0.55 };
const alphaPos = (tau: number) => {
  // tau in [0, spiralT + flyT]
  if (tau < CYC.spiralT) {
    const u = tau / CYC.spiralT;
    const ang = u * CYC.turns * Math.PI * 2;
    const r = 0.12 + (CYC.R - 0.12) * u;
    return new THREE.Vector3(Math.cos(ang) * r, 0.05, Math.sin(ang) * r);
  }
  const u = (tau - CYC.spiralT) / CYC.flyT;
  return new THREE.Vector3(CYC.R + u * 1.15, 0.05, -u * 0.2);
};
const Cyclotron: React.FC<{ t: number; k: number; slamT: number; glow: number }> = ({ t, k, slamT, glow }) => {
  if (k <= 0.001) return null;
  const period = CYC.spiralT + CYC.flyT + 0.5;
  const tau = ((((t - slamT + CYC.spiralT + CYC.flyT) % period) + period) % period);
  const flying = tau <= CYC.spiralT + CYC.flyT;
  const p = alphaPos(Math.min(tau, CYC.spiralT + CYC.flyT));
  const trail = flying ? Array.from({ length: 28 }, (_, i) => alphaPos(Math.max(0, tau - i * 0.045))) : [];
  const sinceHit = tau - (CYC.spiralT + CYC.flyT);
  const bigHit = Math.abs(t - slamT) < 1.2 && t >= slamT ? 1 : 0.45;
  return (
    <group scale={0.75 + 0.25 * ease(k)} rotation={[0.95, -0.35, 0]} position={[-0.6, -0.2, 0]}>
      {/* the two D-shaped electrodes */}
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, 0, i ? -0.09 : 0.09]} rotation={[0, i ? Math.PI : 0, 0]}>
          <cylinderGeometry args={[2.55, 2.55, 0.32, 64, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#c98b55" metalness={0.65} roughness={0.33} transparent opacity={0.92 * k} />
        </mesh>
      ))}
      {/* gap glow */}
      <mesh position={[0, 0.17, 0]}>
        <boxGeometry args={[5.1, 0.02, 0.1]} />
        <meshBasicMaterial color="#7fd8ff" transparent opacity={0.6 * k} />
      </mesh>
      {/* bismuth target */}
      <mesh position={[CYC.R + 1.35, 0.05, -0.24]}>
        <boxGeometry args={[0.35, 0.7, 0.7]} />
        <meshStandardMaterial color="#d8c7e8" metalness={0.5} roughness={0.4} emissive="#ff7ad9" emissiveIntensity={glow * 0.9} transparent opacity={k} />
      </mesh>
      {flying ? (
        <>
          <mesh position={p}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshBasicMaterial color="#fff3a8" />
          </mesh>
          {trail.map((q, i) => (
            <mesh key={i} position={q} scale={0.09 * (1 - i / 28)}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshBasicMaterial color="#ffd34d" transparent opacity={(1 - i / 28) * 0.8 * k} />
            </mesh>
          ))}
        </>
      ) : null}
      {sinceHit > 0 && sinceHit < 0.5 ? (
        <mesh position={[CYC.R + 1.2, 0.05, -0.24]} scale={0.2 + sinceHit * 2.2 * bigHit}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#fff6d0" transparent opacity={(1 - sinceHit / 0.5) * 0.85} />
        </mesh>
      ) : null}
    </group>
  );
};

/* ---------------- scene root ---------------- */
export const AstatineScene3D: React.FC<{ t: number }> = ({ t }) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(Math.sin(t * 0.05) * 0.4, 0.2 + Math.sin(t * 0.07) * 0.15, 9);
  camera.lookAt(0, 0, 0);

  const s02 = beatOf("s02");
  const s11 = beatOf("s11");
  const earthK = vis("earth", t);
  const earthX = t >= s02.start + 0.5 && t < s11.start ? lerp(0, -2.4, ease((t - s02.start - 0.5) / 0.7)) : 0;

  const nucK = vis("nucleus", t);
  const radioT = W("s07", "radioactive");
  const shake = t < beatOf("s07").start ? 0.12 : 0.12 + 0.6 * ease((t - beatOf("s07").start) / 2) + (t > radioT ? 0.25 : 0);

  const vapT = W("s12", "vaporize");
  const slamT = W("s18", "slam");
  const targetGlow = t >= W("s19", "Astatine") ? 1 : t >= slamT ? 0.4 : 0;

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 4, 6]} intensity={2.2} />
      <pointLight position={[-6, -2, 4]} intensity={30} color="#6fb8ff" />
      <pointLight position={[3, 5, -3]} intensity={20} color="#ffd0a0" />
      <Starfield count={1500} radius={60} seed="astatine" />
      <Earth t={t} k={earthK} x={earthX} sparks={t >= s11.start - 0.2} />
      <Nucleus t={t} k={nucK} shake={shake} alphaT={radioT + 0.1} />
      <Atom t={t} k={vis(["title", "outro"], t)} />
      <Chunk t={t} k={vis("vapor", t)} mode="hot" vapT={vapT} />
      <Chunk t={t} k={vis("mystery", t)} mode="mystery" vapT={Infinity} />
      <Cyclotron t={t} k={vis("cyclotron", t)} slamT={slamT} glow={targetGlow} />
    </>
  );
};
