import { useMemo } from "react";
import { random } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Starfield } from "../components/Starfield";
import { RUNS, W, beatOf, ease, vis } from "./timeline";
import { cloudTexture, earthTexture, galaxyPoints, glowTexture, jupiterTexture, marsTexture, nebulaTexture, ringTexture, saturnTexture } from "./space";

/*
 * All 3D for the astatine video in one canvas. Every set is driven by time `t` only
 * (no r3f clocks), so frames render deterministically and in any order.
 */
const PROTON = new THREE.Color("#ff5d6c");
const NEUTRON = new THREE.Color("#9fb3d9");
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const run = (scene: string, nth = 0) => RUNS.filter((r) => r.scene === scene)[nth];

/* ---------------- shared textures ---------------- */
const useTextures = () =>
  useMemo(
    () => ({
      glow: glowTexture(),
      earth: earthTexture(),
      clouds: cloudTexture(),
      mars: marsTexture(),
      jupiter: jupiterTexture(),
      saturn: saturnTexture(),
      ring: ringTexture(),
      neb: [nebulaTexture(3), nebulaTexture(7), nebulaTexture(12)],
    }),
    [],
  );
type Tex = ReturnType<typeof useTextures>;

const Glow: React.FC<{ tex: Tex; color: string; size: number; opacity: number; position?: [number, number, number] }> = ({ tex, color, size, opacity, position = [0, 0, 0] }) =>
  opacity > 0.003 ? (
    <sprite position={position} scale={[size, size, 1]}>
      <spriteMaterial map={tex.glow} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  ) : null;

/* ---------------- space backdrop: nebulae + galaxy ---------------- */
const NEBULAE = [
  { p: [-14, 6, -45], s: 46, c: "#7a3cff", n: 0 },
  { p: [16, -5, -50], s: 52, c: "#ff4fb8", n: 1 },
  { p: [2, 10, -60], s: 60, c: "#2f7bff", n: 2 },
  { p: [-20, -10, -55], s: 40, c: "#3cc8ff", n: 1 },
  { p: [22, 12, -58], s: 44, c: "#b84dff", n: 0 },
] as const;
const Backdrop: React.FC<{ tex: Tex; t: number; space: number; galaxy: number }> = ({ tex, t, space, galaxy }) => {
  const g = useMemo(() => galaxyPoints(), []);
  return (
    <>
      {NEBULAE.map((nb, i) => (
        <sprite key={i} position={nb.p as unknown as [number, number, number]} scale={[nb.s, nb.s, 1]}>
          <spriteMaterial map={tex.neb[nb.n]} color={nb.c} transparent opacity={0.1 + 0.32 * space} blending={THREE.AdditiveBlending} depthWrite={false} rotation={t * 0.01 * (i % 2 ? 1 : -1) + i} />
        </sprite>
      ))}
      {galaxy > 0.003 ? (
        <group position={[0, -0.5, -22]} rotation={[1.05, 0, 0.25]} scale={1.6}>
          <group rotation={[0, t * 0.04, 0]}>
            <points>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[g.pos, 3]} />
                <bufferAttribute attach="attributes-color" args={[g.col, 3]} />
              </bufferGeometry>
              <pointsMaterial size={0.09} vertexColors transparent opacity={galaxy} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
            </points>
          </group>
          <Glow tex={tex} color="#ffd9a8" size={9} opacity={0.55 * galaxy} />
        </group>
      ) : null}
    </>
  );
};

/* ---------------- neutron star merger ---------------- */
const EJECTA = Array.from({ length: 420 }, (_, i) => {
  const th = random(`ej-t${i}`) * Math.PI * 2;
  const ph = Math.acos(2 * random(`ej-p${i}`) - 1);
  const flat = 0.35 + 0.65 * random(`ej-f${i}`);
  return { d: new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph) * flat * 0.5, Math.sin(ph) * Math.sin(th)), sp: 0.6 + random(`ej-s${i}`) * 2.6, gold: random(`ej-g${i}`) > 0.35 };
});
const Merger: React.FC<{ tex: Tex; t: number; k: number; collideT: number }> = ({ tex, t, k, collideT }) => {
  if (k <= 0.003) return null;
  const t0 = 0.3;
  const before = t < collideT;
  const u = clamp01((t - t0) / (collideT - t0));
  const sep = lerp(2.6, 0.15, Math.pow(u, 2.2));
  const ang = Math.pow(u, 3) * 26 + u * 3;
  const since = t - collideT;
  return (
    <group rotation={[0.5, 0, 0.15]} position={[0, 0.3, -2]}>
      {before
        ? [0, 1].map((i) => {
            const a = ang + i * Math.PI;
            const p: [number, number, number] = [Math.cos(a) * sep, 0, Math.sin(a) * sep];
            return (
              <group key={i} position={p}>
                <mesh>
                  <sphereGeometry args={[0.16, 24, 24]} />
                  <meshBasicMaterial color="#eaf4ff" />
                </mesh>
                <Glow tex={tex} color="#8fc4ff" size={1.6 + u * 1.4} opacity={0.9 * k} />
              </group>
            );
          })
        : null}
      {before ? <Glow tex={tex} color="#b9d8ff" size={2 + u * 3} opacity={0.25 * u * k} /> : null}
      {!before ? (
        <>
          <Glow tex={tex} color="#fff3d6" size={4 + since * 30} opacity={Math.max(0, 1 - since / 1.6) * k} />
          <Glow tex={tex} color="#ffb347" size={3 + since * 4} opacity={Math.max(0.15, 0.9 - since * 0.25) * k} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} scale={0.4 + since * 5}>
            <ringGeometry args={[0.9, 1, 96]} />
            <meshBasicMaterial color="#9fd0ff" transparent opacity={Math.max(0, 0.8 - since * 0.35) * k} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {EJECTA.map((e, i) => {
            const d = Math.log1p(since * e.sp * 1.6) * 3.2;
            const o = Math.max(0, 1 - since / 9) * k;
            return o > 0.01 ? (
              <sprite key={i} position={[e.d.x * d, e.d.y * d, e.d.z * d]} scale={[0.22, 0.22, 1]}>
                <spriteMaterial map={tex.glow} color={e.gold ? "#ffcc55" : "#9fd0ff"} transparent opacity={o} blending={THREE.AdditiveBlending} depthWrite={false} />
              </sprite>
            ) : null;
          })}
        </>
      ) : null}
    </group>
  );
};

/* ---------------- planets ---------------- */
/** Ring geometry whose texture u runs from the inner to the outer edge (concentric bands). */
const useRingGeo = (inner: number, outer: number) =>
  useMemo(() => {
    const g = new THREE.RingGeometry(inner, outer, 160, 1);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      uv.setXY(i, (r - inner) / (outer - inner), 0.5);
    }
    return g;
  }, [inner, outer]);

const Planet: React.FC<{ map: THREE.Texture; r: number; t: number; passT: number; x: number; y: number; ring?: Tex; k: number }> = ({ map, r, t, passT, x, y, ring, k }) => {
  const ringGeo = useRingGeo(r * 1.35, r * 2.35);
  const z = -6 + (t - passT) * 16.5;
  if (z < -70 || z > 12 || k <= 0.003) return null;
  const fadeIn = clamp01((z + 70) / 15);
  return (
    <group position={[x, y, z]}>
      <mesh rotation={[0.25, t * 0.25, 0.1]}>
        <sphereGeometry args={[r, 64, 64]} />
        <meshStandardMaterial map={map} roughness={0.9} metalness={0} transparent opacity={fadeIn * k} />
      </mesh>
      {ring ? (
        <mesh rotation={[1.25, 0.2, 0.35]} geometry={ringGeo}>
          <meshStandardMaterial map={ring.ring} transparent opacity={0.9 * fadeIn * k} side={THREE.DoubleSide} depthWrite={false} roughness={1} />
        </mesh>
      ) : null}
    </group>
  );
};

/* ---------------- Earth ---------------- */
const SPARKS = Array.from({ length: 26 }, (_, i) => {
  const th = random(`sp-t${i}`) * Math.PI * 2;
  const ph = Math.acos(2 * random(`sp-p${i}`) - 1);
  return { v: new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)).multiplyScalar(2.25), off: random(`sp-o${i}`) * 3, per: 1.4 + random(`sp-r${i}`) * 1.6 };
});
const Earth: React.FC<{ tex: Tex; t: number; k: number; pos: [number, number, number]; scale: number; sparks: boolean }> = ({ tex, t, k, pos, scale, sparks }) => {
  if (k <= 0.003) return null;
  return (
    <group position={pos} scale={scale}>
      <Glow tex={tex} color="#4fa8ff" size={7.4} opacity={0.5 * k} position={[0, 0, -0.5]} />
      <group rotation={[0.38, t * 0.12 + 2.2, 0]}>
        <mesh>
          <sphereGeometry args={[2.2, 96, 96]} />
          <meshStandardMaterial map={tex.earth} roughness={0.75} metalness={0.05} transparent opacity={k} />
        </mesh>
        <mesh rotation={[0, t * 0.03, 0]}>
          <sphereGeometry args={[2.235, 96, 96]} />
          <meshStandardMaterial map={tex.clouds} transparent opacity={0.9 * k} depthWrite={false} roughness={1} />
        </mesh>
        {sparks
          ? SPARKS.map((p, i) => {
              const ph = ((t + p.off) % p.per) / p.per;
              const s = ph < 0.25 ? Math.sin((ph / 0.25) * Math.PI) : 0;
              return s > 0.01 ? (
                <group key={i} position={p.v}>
                  <Glow tex={tex} color="#ff7ad9" size={0.6 * s} opacity={s * k} />
                </group>
              ) : null;
            })
          : null}
      </group>
      <mesh scale={1.045}>
        <sphereGeometry args={[2.2, 64, 64]} />
        <meshBasicMaterial color="#6fc0ff" transparent opacity={0.22 * k} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
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
    const y = 1 - (2 * (((i * 7919) % N) + 0.5)) / N;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    return new THREE.Vector3(Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r);
  });
  const order = pts.map((_, i) => i).sort((a, b) => random(`np${a}`) - random(`np${b}`));
  const isProton = new Array(N).fill(false);
  order.slice(0, 85).forEach((i) => (isProton[i] = true));
  return { pts, isProton };
})();

const Nucleus: React.FC<{ tex: Tex; t: number; k: number; shake: number; scale?: number; alphaT?: number }> = ({ tex, t, k, shake, scale = 1, alphaT }) => {
  if (k <= 0.003) return null;
  const s = scale * (0.5 + 0.5 * ease(k));
  return (
    <group scale={s}>
      <Glow tex={tex} color="#ff6fb0" size={7 + Math.sin(t * 3) * 0.3} opacity={(0.45 + shake * 0.4) * k} position={[0, 0, -1.5]} />
      <group rotation={[0.3 + t * 0.07, t * 0.25, 0]}>
        {NUC.pts.map((p, i) => {
          const j = shake * 0.09;
          return (
            <mesh key={i} position={[p.x + Math.sin(t * 31 + i * 1.7) * j, p.y + Math.sin(t * 27 + i * 2.3) * j, p.z + Math.sin(t * 23 + i * 3.1) * j]}>
              <sphereGeometry args={[0.27, 18, 18]} />
              <meshStandardMaterial color={NUC.isProton[i] ? PROTON : NEUTRON} roughness={0.35} metalness={0.1} emissive={NUC.isProton[i] ? "#ff2040" : "#203060"} emissiveIntensity={0.18 + shake * 0.25} transparent opacity={k} />
            </mesh>
          );
        })}
        {alphaT !== undefined && t > alphaT ? (
          <group position={[(t - alphaT) * 3.2 + 1.3, (t - alphaT) * 1.2, (t - alphaT) * 1.5]}>
            <Glow tex={tex} color="#ffd34d" size={2.2} opacity={0.9 * k} />
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} position={[(i % 2) * 0.42 - 0.21, Math.floor(i / 2) * 0.42 - 0.21, 0]}>
                <sphereGeometry args={[0.24, 16, 16]} />
                <meshStandardMaterial color={i % 2 ? NEUTRON : PROTON} emissive="#ffcc66" emissiveIntensity={0.7} />
              </mesh>
            ))}
          </group>
        ) : null}
      </group>
    </group>
  );
};

/* ---------------- Hero atom ---------------- */
const SHELLS = [2, 8, 18, 32, 18, 7];
const Atom: React.FC<{ tex: Tex; t: number; k: number; scale?: number }> = ({ tex, t, k, scale = 1 }) => {
  if (k <= 0.003) return null;
  return (
    <group scale={scale * (0.55 + 0.45 * ease(k))}>
      <Nucleus tex={tex} t={t} k={k} shake={0.15} scale={0.3} />
      <group rotation={[0.35, t * 0.12, 0.08]}>
        {SHELLS.map((n, si) => {
          const r = 1.15 + si * 0.5;
          const tilt: [number, number, number] = [Math.PI / 2 + (si - 2.5) * 0.24, (si * 0.95) % 3, 0];
          const w = 0.95 - si * 0.11;
          return (
            <group key={si} rotation={tilt}>
              <mesh>
                <torusGeometry args={[r, 0.01, 6, 160]} />
                <meshBasicMaterial color="#7fd8ff" transparent opacity={0.3 * k} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
              {Array.from({ length: n }, (_, e) => {
                const a0 = (e / n) * Math.PI * 2 + t * w;
                return (
                  <group key={e}>
                    {[0, 1, 2, 3, 4].map((q) => {
                      const a = a0 - q * 0.07;
                      return (
                        <sprite key={q} position={[Math.cos(a) * r, Math.sin(a) * r, 0]} scale={[0.2 * (1 - q * 0.17), 0.2 * (1 - q * 0.17), 1]}>
                          <spriteMaterial map={tex.glow} color={q ? "#6fd0ff" : "#e8fbff"} transparent opacity={(1 - q * 0.2) * k} blending={THREE.AdditiveBlending} depthWrite={false} />
                        </sprite>
                      );
                    })}
                  </group>
                );
              })}
            </group>
          );
        })}
      </group>
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
const EMBERS = Array.from({ length: 240 }, (_, i) => {
  const th = random(`vp-t${i}`) * Math.PI * 2;
  const ph = Math.acos(2 * random(`vp-p${i}`) - 1);
  return { d: new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph) * 0.8 + 0.4, Math.sin(ph) * Math.sin(th)), sp: 1.5 + random(`vp-s${i}`) * 3 };
});
const Chunk: React.FC<{ tex: Tex; t: number; k: number; mode: "hot" | "mystery"; vapT: number }> = ({ tex, t, k, mode, vapT }) => {
  const geo = useChunkGeo();
  if (k <= 0.003) return null;
  const since = t - vapT;
  const gone = mode === "hot" ? ease(since / 1.1) : 0;
  const heat = mode === "hot" ? Math.min(1, 0.3 + Math.max(0, t - (vapT - 4)) * 0.18) : 0;
  const size = (0.5 + 0.5 * ease(k)) * (1 - gone);
  return (
    <group>
      {mode === "hot" ? <Glow tex={tex} color="#ff7a2a" size={(4 + heat * 3) * Math.max(size, since > 0 ? Math.max(0, 1 - since / 1.5) : 0)} opacity={(0.4 + heat * 0.5) * k} position={[0, 0, -1]} /> : null}
      {mode === "mystery" ? <Glow tex={tex} color="#8fa6ff" size={6} opacity={0.25 * k} position={[0, 0, -1.5]} /> : null}
      {size > 0.01 ? (
        <mesh geometry={geo} scale={size * (1 + (mode === "hot" ? Math.sin(t * 20) * 0.02 * heat : 0))} rotation={[0.3, t * 0.35, 0.1]}>
          <meshStandardMaterial
            color={mode === "hot" ? "#3a2c28" : "#5d6270"}
            emissive={mode === "hot" ? "#ff6a1a" : "#000000"}
            emissiveIntensity={mode === "hot" ? heat * 1.4 : 0}
            metalness={mode === "hot" ? 0.3 : 0.55}
            roughness={mode === "hot" ? 0.6 : 0.28}
            flatShading
            transparent
            opacity={k}
          />
        </mesh>
      ) : null}
      {mode === "hot" && since > 0 && since < 3.2
        ? EMBERS.map((p, i) => {
            const d = since * p.sp;
            const o = Math.max(0, 1 - since / 3.2);
            return (
              <sprite key={i} position={[p.d.x * d, p.d.y * d, p.d.z * d]} scale={[0.18 + 0.2 * o, 0.18 + 0.2 * o, 1]}>
                <spriteMaterial map={tex.glow} color={i % 3 ? "#ffa040" : "#fff1c2"} transparent opacity={o * k} blending={THREE.AdditiveBlending} depthWrite={false} />
              </sprite>
            );
          })
        : null}
    </group>
  );
};

/* ---------------- Cyclotron ---------------- */
const CYC = { R: 2.3, turns: 6, spiralT: 3.0, flyT: 0.55 };
const alphaPos = (tau: number) => {
  if (tau < CYC.spiralT) {
    const u = tau / CYC.spiralT;
    const ang = u * CYC.turns * Math.PI * 2;
    const r = 0.12 + (CYC.R - 0.12) * u;
    return new THREE.Vector3(Math.cos(ang) * r, 0.2, Math.sin(ang) * r);
  }
  const u = (tau - CYC.spiralT) / CYC.flyT;
  return new THREE.Vector3(CYC.R + u * 1.15, 0.2, -u * 0.2);
};
const Cyclotron: React.FC<{ tex: Tex; t: number; k: number; slamT: number; glow: number }> = ({ tex, t, k, slamT, glow }) => {
  if (k <= 0.003) return null;
  const period = CYC.spiralT + CYC.flyT + 0.5;
  const tau = (((t - slamT + CYC.spiralT + CYC.flyT) % period) + period) % period;
  const flying = tau <= CYC.spiralT + CYC.flyT;
  const p = alphaPos(Math.min(tau, CYC.spiralT + CYC.flyT));
  const sinceHit = tau - (CYC.spiralT + CYC.flyT);
  const big = t >= slamT && t < slamT + 1.2 ? 1.6 : 1;
  const target: [number, number, number] = [CYC.R + 1.35, 0.2, -0.24];
  return (
    <group scale={0.75 + 0.25 * ease(k)} rotation={[0.95, -0.35, 0]} position={[-0.6, -0.2, 0]}>
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, 0, i ? -0.09 : 0.09]} rotation={[0, i ? Math.PI : 0, 0]}>
          <cylinderGeometry args={[2.55, 2.55, 0.32, 96, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#c98b55" metalness={0.55} roughness={0.3} emissive="#3a1a08" emissiveIntensity={0.4} transparent opacity={0.95 * k} />
        </mesh>
      ))}
      {[0.6, 1.2, 1.8, 2.4].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.17, 0]}>
          <ringGeometry args={[r - 0.008, r + 0.008, 128]} />
          <meshBasicMaterial color="#ffcf9a" transparent opacity={0.25 * k} />
        </mesh>
      ))}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[5.1, 0.02, 0.1]} />
        <meshBasicMaterial color="#7fd8ff" transparent opacity={(0.5 + 0.3 * Math.sin(t * 18)) * k} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={target}>
        <boxGeometry args={[0.35, 0.7, 0.7]} />
        <meshStandardMaterial color="#d8c7e8" metalness={0.5} roughness={0.35} emissive="#ff7ad9" emissiveIntensity={glow * 1.1} transparent opacity={k} />
      </mesh>
      <Glow tex={tex} color="#ff7ad9" size={2.4 * glow} opacity={0.7 * glow * k} position={target} />
      {flying ? (
        <>
          <Glow tex={tex} color="#fff3a8" size={0.9} opacity={k} position={[p.x, p.y, p.z]} />
          {Array.from({ length: 34 }, (_, i) => {
            const q = alphaPos(Math.max(0, tau - i * 0.035));
            return <Glow key={i} tex={tex} color="#ffb340" size={0.55 * (1 - i / 34)} opacity={(1 - i / 34) * 0.85 * k} position={[q.x, q.y, q.z]} />;
          })}
        </>
      ) : null}
      {sinceHit > 0 && sinceHit < 0.55 ? <Glow tex={tex} color="#fff6d0" size={(1 + sinceHit * 9) * big} opacity={(1 - sinceHit / 0.55) * k} position={target} /> : null}
    </group>
  );
};

/* ---------------- scene root ---------------- */
export const AstatineScene3D: React.FC<{ t: number }> = ({ t }) => {
  const tex = useTextures();
  const camera = useThree((s) => s.camera);

  const cosmos = run("cosmos");
  const planets = run("planets");
  const title = run("title");
  const finale = run("finale");

  // camera: slow push in on the merger, dolly into the title atom, gentle drift otherwise
  let camZ = 9;
  if (t < cosmos.end) camZ = lerp(13, 9.5, ease((t - cosmos.start) / (cosmos.end - cosmos.start)));
  else if (t >= title.start && t < title.end) camZ = lerp(10, 7, ease((t - title.start) / (title.end - title.start)));
  camera.position.set(Math.sin(t * 0.05) * 0.4, 0.2 + Math.sin(t * 0.07) * 0.15, camZ);
  camera.lookAt(0, 0, 0);

  const space = Math.max(vis(["cosmos", "planets", "title", "finale", "outro"], t, 0.8, 0.8), 0);
  const galaxy = Math.max(vis("cosmos", t, 1.2, 1.2), vis("outro", t, 1, 1), t >= finale.start ? ease((t - finale.start - 5) / 4) : 0);

  // Earth: arrives at the end of the fly-by, sits centre-stage, then recedes in the finale
  const arriveT = W("x02", "small") - 1.2;
  let earthPos: [number, number, number] = [0, 0, 0];
  let earthScale = 1;
  let earthK = vis("earth", t);
  if (t >= planets.start && t < planets.end + 0.1) {
    const u = ease((t - arriveT) / (planets.end - arriveT));
    earthPos = [0, 0, lerp(-90, 0, u)];
    earthK = t >= arriveT ? clamp01((t - arriveT) / 0.8) : 0;
  }
  const s02 = beatOf("s02");
  const s11 = beatOf("s11");
  if (t >= s02.start + 0.5 && t < s11.start) earthPos = [lerp(0, -2.4, ease((t - s02.start - 0.5) / 0.7)), 0, 0];
  if (t >= finale.start) {
    const u = ease((t - finale.start) / 9);
    earthPos = [lerp(0, 3, u), lerp(0, 1, u), lerp(0, -70, u)];
    earthK = Math.max(0, 1 - ease((t - finale.start - 7) / 3));
    earthScale = 1;
  }

  const nucK = vis("nucleus", t);
  const radioT = W("s07", "radioactive");
  const shake = t < beatOf("s07").start ? 0.12 : 0.12 + 0.6 * ease((t - beatOf("s07").start) / 2) + (t > radioT ? 0.25 : 0);
  const vapT = W("s12", "vaporize");
  const slamT = W("s18", "slam");
  const targetGlow = t >= W("s19", "Astatine") ? 1 : t >= slamT ? 0.4 : 0;

  const planetK = vis("planets", t, 0.3, 0.6);
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 3, 6]} intensity={2.6} />
      <pointLight position={[-6, -2, 4]} intensity={30} color="#6fb8ff" />
      <pointLight position={[3, 5, -3]} intensity={20} color="#ffd0a0" />
      <Starfield count={2600} radius={70} seed="astatine" />
      <Backdrop tex={tex} t={t} space={space} galaxy={galaxy} />
      <Merger tex={tex} t={t} k={Math.max(vis("cosmos", t, 0.8, 1.2), t < planets.start + 3 ? vis("planets", t, 0.1, 1) * clamp01(1 - (t - planets.start) / 3) : 0)} collideT={W("x01", "colliding") + 0.5} />
      <Planet map={tex.saturn} ring={tex} r={2.4} t={t} passT={W("x02", "Saturn") + 0.4} x={-5.2} y={1.2} k={planetK} />
      <Planet map={tex.jupiter} r={3.0} t={t} passT={W("x02", "Jupiter") + 0.4} x={5.6} y={-0.8} k={planetK} />
      <Planet map={tex.mars} r={1.2} t={t} passT={W("x02", "Mars") + 0.3} x={-3.4} y={-0.6} k={planetK} />
      <Earth tex={tex} t={t} k={earthK} pos={earthPos} scale={earthScale} sparks={t >= s11.start - 0.2 && t < s11.end} />
      <Nucleus tex={tex} t={t} k={nucK} shake={shake} alphaT={radioT + 0.1} />
      <Atom tex={tex} t={t} k={vis("title", t, 1.0, 0.6)} />
      <group position={[0, -0.2, 0]}>
        <Atom tex={tex} t={t} k={vis("outro", t, 1.2, 1)} scale={0.62} />
      </group>
      <Chunk tex={tex} t={t} k={vis("vapor", t)} mode="hot" vapT={vapT} />
      <Chunk tex={tex} t={t} k={vis("mystery", t)} mode="mystery" vapT={Infinity} />
      <Cyclotron tex={tex} t={t} k={vis("cyclotron", t)} slamT={slamT} glow={targetGlow} />
    </>
  );
};
