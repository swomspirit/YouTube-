import { useMemo } from "react";
import * as THREE from "three";
import { Environment, Lightformer } from "@react-three/drei";
import { impulse, lastHit, type Piece, type PreparedPerformance } from "./hits";
import { KIT, PIECE_COLOR, type CymbalDef, type DrumDef } from "./kit";
import { beaterAngle, stickPose } from "./sticks";
import { Drummer } from "./Drummer";

const SHELL = "#7a1424";
const CHROME = { color: "#d8dde3", metalness: 1, roughness: 0.18 } as const;
const BRONZE = { color: "#d9b25a", metalness: 0.85, roughness: 0.3, envMapIntensity: 2.2 } as const;

type Props = { perf: PreparedPerformance | null; now: number; accent: string; energy: number; t: number; drummer?: boolean; pyro?: boolean };

/* ------------------------------------------------------------------ */
let glowTex: THREE.Texture | null = null;
const glowTexture = () => {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,0.45)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
};

/** Fake bloom: an additive, camera-facing glow sprite. */
export const Glow: React.FC<{ color: string; size: number; amount: number; y?: number; position?: [number, number, number] }> = ({ color, size, amount, y = 0, position }) =>
  amount > 0.01 ? (
    <sprite position={position ?? [0, y, 0]} scale={[size, size, 1]}>
      <spriteMaterial map={glowTexture()} color={color} transparent opacity={Math.min(1, amount)} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  ) : null;

const HitRing: React.FC<{ perf: PreparedPerformance | null; piece: Piece; now: number; r: number; y: number }> = ({ perf, piece, now, r, y }) => {
  if (!perf) return null;
  const h = lastHit(perf.byPiece[piece], now);
  if (!h) return null;
  const dt = now - h.t;
  if (dt > 0.28) return null;
  const k = dt / 0.28;
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={1 + k * 1.6}>
      <ringGeometry args={[r * 0.92, r, 48]} />
      <meshBasicMaterial color={PIECE_COLOR[piece]} transparent opacity={(1 - k) * (h.v / 127)} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

const Drum: React.FC<{ def: DrumDef; piece: Piece; perf: PreparedPerformance | null; now: number }> = ({ def, piece, perf, now }) => {
  const imp = perf ? impulse(perf.byPiece[piece], now, 0.09) : 0;
  const s = 1 + imp * 0.035;
  return (
    <group position={def.pos} rotation={def.rot}>
      <group scale={[s, 1 - imp * 0.02, s]}>
        <mesh>
          <cylinderGeometry args={[def.r, def.r, def.h, 48, 1, true]} />
          <meshPhysicalMaterial color={SHELL} metalness={0.3} roughness={0.25} clearcoat={1} clearcoatRoughness={0.08} side={THREE.DoubleSide} />
        </mesh>
        {/* heads */}
        <mesh position={[0, def.h / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[def.r * 0.97, 48]} />
          <meshStandardMaterial color="#f1ede4" roughness={0.6} emissive={PIECE_COLOR[piece]} emissiveIntensity={imp * 2.2} />
        </mesh>
        <mesh position={[0, -def.h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[def.r * 0.97, 32]} />
          <meshStandardMaterial color="#d9d4c8" roughness={0.7} />
        </mesh>
        {/* hoops */}
        {[def.h / 2, -def.h / 2].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[def.r, 0.008, 8, 64]} />
            <meshStandardMaterial {...CHROME} />
          </mesh>
        ))}
        {/* lugs */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * (def.r + 0.006), 0, Math.sin(a) * (def.r + 0.006)]}>
              <boxGeometry args={[0.014, def.h * 0.45, 0.014]} />
              <meshStandardMaterial {...CHROME} />
            </mesh>
          );
        })}
      </group>
      <HitRing perf={perf} piece={piece} now={now} r={def.r} y={def.h / 2 + 0.006} />
      <Glow color={PIECE_COLOR[piece]} size={def.r * 4} amount={imp} y={def.h / 2 + 0.05} />
    </group>
  );
};

const Cymbal: React.FC<{ def: CymbalDef; piece: Piece; perf: PreparedPerformance | null; now: number }> = ({ def, piece, perf, now }) => {
  const h = perf ? lastHit(perf.byPiece[piece], now) : null;
  const dt = h ? now - h.t : 99;
  const amp = h ? (h.v / 127) * Math.exp(-dt / 0.7) : 0;
  const wobX = amp * 0.16 * Math.sin(dt * 2 * Math.PI * 3.2);
  const wobZ = amp * 0.1 * Math.cos(dt * 2 * Math.PI * 2.6);
  const glow = h ? (h.v / 127) * Math.exp(-dt / 0.25) : 0;
  return (
    <group position={def.pos}>
      {/* stand */}
      <mesh position={[0, -def.pos[1] / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.016, def.pos[1], 12]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      <group rotation={[def.rot[0] + wobX, def.rot[1], def.rot[2] + wobZ]} scale={def.china ? [1, -1, 1] : [1, 1, 1]}>
        <mesh>
          <cylinderGeometry args={[0.035, def.r, 0.035, 64, 1, true]} />
          <meshStandardMaterial {...BRONZE} side={THREE.DoubleSide} emissive={PIECE_COLOR[piece]} emissiveIntensity={glow * 1.4} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <sphereGeometry args={[0.045, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial {...BRONZE} emissive={PIECE_COLOR[piece]} emissiveIntensity={glow} />
        </mesh>
      </group>
      <Glow color={PIECE_COLOR[piece]} size={def.r * 5} amount={glow * 0.8} />
    </group>
  );
};

const HiHat: React.FC<{ perf: PreparedPerformance | null; now: number }> = ({ perf, now }) => {
  const k = KIT.hihat;
  const h = perf ? lastHit(perf.hhOpen, now) : null;
  const open = h?.i === "hho" ? 0.035 : 0.006;
  const hit = perf ? lastHit(perf.byPiece.hihat, now) : null;
  const dt = hit ? now - hit.t : 99;
  const wob = hit && hit.i !== "hhp" ? (hit.v / 127) * Math.exp(-dt / 0.15) * 0.05 * Math.sin(dt * 40) : 0;
  const glow = hit ? (hit.v / 127) * Math.exp(-dt / 0.12) : 0;
  const cym = (y: number, flip: boolean, w = 0) => (
    <mesh position={[0, y, 0]} rotation={[w, 0, w * 0.6]} scale={flip ? [1, -1, 1] : [1, 1, 1]}>
      <cylinderGeometry args={[0.03, k.r, 0.022, 48, 1, true]} />
      <meshStandardMaterial {...BRONZE} side={THREE.DoubleSide} emissive={PIECE_COLOR.hihat} emissiveIntensity={glow * 1.5} />
    </mesh>
  );
  return (
    <group position={k.pos}>
      <mesh position={[0, -k.pos[1] / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.016, k.pos[1] + 0.1, 12]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {cym(-0.01, true)}
      {cym(open, false, wob)}
    </group>
  );
};

const Kick: React.FC<{ perf: PreparedPerformance | null; now: number; accent: string; double: boolean }> = ({ perf, now, accent, double }) => {
  const k = KIT.kick as { kind: "kick"; pos: [number, number, number]; r: number; depth: number };
  const imp = perf ? impulse(perf.byPiece.kick, now, 0.1) : 0;
  const s = 1 + imp * 0.03;
  const beater = (foot: "RF" | "LF", x: number) => (
    // pivot on the pedal near the floor; +0.55 rad tilt = beater touching the back head
    <group position={[x, -k.pos[1] + 0.05, -k.depth / 2 - 0.12]} rotation={[0.55 + beaterAngle(perf, foot, now), 0, 0]}>
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.22, 8]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshStandardMaterial color="#efe9da" roughness={0.6} />
      </mesh>
    </group>
  );
  return (
    <group position={k.pos}>
      <group rotation={[Math.PI / 2, 0, 0]} scale={[s, 1, s]}>
        <mesh>
          <cylinderGeometry args={[k.r, k.r, k.depth, 64, 1, true]} />
          <meshPhysicalMaterial color={SHELL} metalness={0.3} roughness={0.25} clearcoat={1} clearcoatRoughness={0.08} side={THREE.DoubleSide} />
        </mesh>
        {[k.depth / 2, -k.depth / 2].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[k.r, 0.014, 10, 64]} />
            <meshStandardMaterial color="#1b1b1f" metalness={0.5} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* front head with glowing logo ring */}
      <mesh position={[0, 0, k.depth / 2 + 0.002]}>
        <circleGeometry args={[k.r * 0.97, 64]} />
        <meshStandardMaterial color="#141218" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, k.depth / 2 + 0.004]}>
        <ringGeometry args={[k.r * 0.55, k.r * 0.62, 64]} />
        <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.35 + imp * 0.65} />
      </mesh>
      <mesh position={[0, 0, k.depth / 2 + 0.004]}>
        <circleGeometry args={[k.r * 0.22 * (1 + imp * 0.6), 48]} />
        <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.25 + imp * 0.75} />
      </mesh>
      <Glow color={accent} size={k.r * 5} amount={imp * 0.9} position={[0, 0, k.depth / 2 + 0.05]} />
      {/* spurs */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * (k.r + 0.05), -k.r + 0.05, k.depth * 0.25]} rotation={[0, 0, sd * 0.5]}>
          <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
      ))}
      {beater("RF", double ? -0.06 : 0)}
      {double ? beater("LF", 0.06) : null}
    </group>
  );
};

const Stick: React.FC<{ perf: PreparedPerformance | null; hand: "R" | "L"; now: number }> = ({ perf, hand, now }) => {
  const pose = stickPose(perf, hand, now);
  return (
    <group position={pose.mid} quaternion={pose.quat}>
      {/* local +y points to the tip */}
      <mesh>
        <cylinderGeometry args={[0.0065, 0.0095, pose.len, 12]} />
        <meshStandardMaterial color="#e3c18f" roughness={0.45} />
      </mesh>
      <mesh position={[0, pose.len / 2 + 0.006, 0]}>
        <sphereGeometry args={[0.009, 12, 12]} />
        <meshStandardMaterial color="#f1dcb8" roughness={0.4} />
      </mesh>
    </group>
  );
};

/* ------------------------------------------------------------------ */
/** LED wall behind the kit: a dot-grid shader that pulses with the kick. */
const LedWall: React.FC<{ accent: string; kick: number; crash: number; t: number; energy: number }> = ({ accent, kick, crash, t, energy }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color() }, uKick: { value: 0 }, uCrash: { value: 0 }, uTime: { value: 0 }, uEnergy: { value: 0 } },
        transparent: false,
        toneMapped: false,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform vec3 uColor; uniform float uKick; uniform float uCrash; uniform float uTime; uniform float uEnergy;
          varying vec2 vUv;
          void main(){
            vec2 grid = vec2(64.0, 24.0);
            vec2 g = vUv * grid;
            vec2 cell = floor(g);
            vec2 f = fract(g) - 0.5;
            float dotMask = smoothstep(0.34, 0.22, length(f));
            vec2 c = cell / grid - vec2(0.5, 0.35);
            float rings = 0.5 + 0.5 * sin(length(c * vec2(1.0, 0.6)) * 22.0 - uTime * (2.0 + uEnergy * 4.0));
            float bars = 0.5 + 0.5 * sin(cell.x * 0.35 + uTime * 1.5);
            float b = mix(rings, bars, 0.35) * (0.05 + uEnergy * 0.12) + uKick * 0.55 * max(0.0, 1.0 - length(c) * 1.2) + uCrash * 0.35;
            vec3 col = uColor * b * dotMask;
            gl_FragColor = vec4(col + vec3(0.012, 0.01, 0.02), 1.0);
          }`,
      }),
    [],
  );
  mat.uniforms.uColor.value.set(accent);
  mat.uniforms.uKick.value = kick;
  mat.uniforms.uCrash.value = crash;
  mat.uniforms.uTime.value = t;
  mat.uniforms.uEnergy.value = energy;
  return (
    <mesh position={[0, 2.2, -3.6]} material={mat}>
      <planeGeometry args={[11, 4.2]} />
    </mesh>
  );
};

/** Volumetric-looking stage beams (additive cones). */
const Beams: React.FC<{ accent: string; t: number; flash: number; energy: number }> = ({ accent, t, flash, energy }) => (
  <group>
    {[-2.6, -1.2, 1.2, 2.6].map((x, i) => {
      const sweep = Math.sin(t * (0.4 + energy * 0.5) + i * 1.7) * 0.35;
      return (
        <group key={i} position={[x, 4.6, -1.8]} rotation={[0.35, 0, sweep + (x > 0 ? 0.25 : -0.25)]}>
          <mesh position={[0, -2.6, 0]}>
            <coneGeometry args={[0.75, 5.2, 32, 1, true]} />
            <meshBasicMaterial
              color={accent}
              transparent
              opacity={0.05 + flash * 0.12 + energy * 0.03}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshBasicMaterial color={accent} toneMapped={false} />
          </mesh>
          <Glow color={accent} size={0.9} amount={0.6 + flash * 0.4} />
        </group>
      );
    })}
  </group>
);

/* ------------------------------------------------------------------ */
const gripOf = (perf: PreparedPerformance | null, hand: "R" | "L", now: number) => {
  const p = stickPose(perf, hand, now);
  const dir = p.mid.clone().sub(p.tip).normalize();
  return p.tip.clone().add(dir.multiplyScalar(p.len * 0.8));
};

const DrummerOnKit: React.FC<{ perf: PreparedPerformance | null; now: number; energy: number }> = ({ perf, now, energy }) => {
  const beat = perf ? 60 / perf.bpm : 0.6;
  const fast = perf && perf.bpm > 140;
  const period = fast ? beat * 2 : beat; // headbang on half notes when it's fast
  const phase = perf ? (((now - perf.countIn) / period) % 1 + 1) % 1 : (now * 0.5) % 1;
  const playingNow = !!perf && now >= perf.countIn && now < perf.duration - 2;
  const intensity = playingNow ? 0.35 + energy * 0.65 : 0.12;
  const bang = intensity * Math.pow(Math.cos(Math.PI * phase), 2);
  const crash = perf ? Math.max(impulse(perf.byPiece.crash, now, 0.3), impulse(perf.byPiece.china, now, 0.3)) : 0;
  const press = (f: "RF" | "LF") => 1 - beaterAngle(perf, f, now) / -0.75;
  return (
    <Drummer
      pose={{
        gripR: gripOf(perf, "R", now),
        gripL: gripOf(perf, "L", now),
        bang,
        sway: Math.sin(now * 1.3) * (playingNow ? 0.6 : 0.3),
        angry: playingNow ? Math.min(1, energy * 0.9 + crash * 0.3) : 0,
        surprised: perf && now < perf.countIn ? 0.6 : crash * 0.4,
        footR: press("RF"),
        footL: press("LF"),
      }}
    />
  );
};

/** Flame jets at the stage edges on big crash hits, plus sparks. */
const Pyro: React.FC<{ perf: PreparedPerformance | null; now: number }> = ({ perf, now }) => {
  if (!perf) return null;
  const h = lastHit(perf.byPiece.crash, now) ?? lastHit(perf.byPiece.china, now);
  const c2 = lastHit(perf.byPiece.china, now);
  const hit = h && c2 ? (h.t > c2.t ? h : c2) : h ?? c2;
  if (!hit || hit.v < 110) return null;
  const dt = now - hit.t;
  if (dt > 0.9) return null;
  const life = dt / 0.9;
  const jets = [-1.9, 1.9];
  return (
    <group>
      {jets.map((x) => (
        <group key={x} position={[x, 0, -0.9]}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 0.16, 16]} />
            <meshStandardMaterial color="#1b1b20" metalness={0.6} roughness={0.4} />
          </mesh>
          {Array.from({ length: 9 }, (_, i) => {
            const k = i / 9;
            const y = 0.2 + k * 2.6 * Math.min(1, dt * 6);
            const size = (0.5 + k * 0.9) * (1 - life * 0.6);
            const col = k < 0.3 ? "#fff1a8" : k < 0.65 ? "#ff9a2e" : "#ff3d1f";
            return <Glow key={i} color={col} size={size} amount={(1 - life) * (1 - k * 0.5)} position={[Math.sin(i * 2.1 + now * 20) * 0.05, y, 0]} />;
          })}
        </group>
      ))}
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2 + i;
        const sp = 1.2 + (i % 5) * 0.35;
        const x = (i % 2 ? 1.9 : -1.9) + Math.cos(a) * sp * dt;
        const y = 2.0 + Math.abs(Math.sin(a)) * sp * dt * 1.6 - 4.9 * dt * dt;
        return y > 0 ? <Glow key={`s${i}`} color="#ffd27a" size={0.09} amount={1 - life} position={[x, y, -0.9 + Math.sin(a) * dt]} /> : null;
      })}
    </group>
  );
};

/* ------------------------------------------------------------------ */
export const DrumStage: React.FC<Props> = ({ perf, now, accent, energy, t, drummer = false, pyro = false }) => {
  const kickImp = perf ? impulse(perf.byPiece.kick, now, 0.12) : 0;
  const crashImp = perf
    ? Math.max(impulse(perf.byPiece.crash, now, 0.35), impulse(perf.byPiece.crash2, now, 0.35), impulse(perf.byPiece.china, now, 0.35))
    : 0;
  const double = !!perf && perf.byLimb.LF.hits.some((h) => h.i === "kick");

  return (
    <>
      <color attach="background" args={["#05040a"]} />
      <fog attach="fog" args={["#05040a", 5, 13]} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 2]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#ffd9a8" position={[-4, 2, 0]} rotation-y={Math.PI / 2} scale={[4, 2, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#a8c8ff" position={[4, 2, 0]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} />
        <Lightformer form="ring" intensity={2} position={[0, 2, -4]} scale={2} />
      </Environment>

      <ambientLight intensity={0.25} />
      <directionalLight position={[0, 0.6, 3]} intensity={1.2} color="#ffe8cc" />
      <spotLight position={[0, 4.5, 2.5]} angle={0.55} penumbra={0.6} intensity={45 + kickImp * 30} color="#fff3e0" />
      <pointLight position={[0, 1.2, -1.6]} intensity={6 + kickImp * 25} color={accent} distance={6} />
      <pointLight position={[1.5, 2.5, 1]} intensity={4 + crashImp * 30} color="#ffd9a8" distance={6} />

      <LedWall accent={accent} kick={kickImp} crash={crashImp} t={t} energy={energy} />
      <Beams accent={accent} t={t} flash={crashImp} energy={energy} />

      {/* stage floor + riser + rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0d0c12" metalness={0.6} roughness={0.32} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, -0.2]}>
        <circleGeometry args={[1.6, 64]} />
        <meshStandardMaterial color="#2a0f18" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, -0.2]}>
        <ringGeometry args={[1.58, 1.64, 96]} />
        <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.4 + kickImp * 0.6} />
      </mesh>

      {/* throne */}
      <group position={[0, 0, -0.85]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.02, 0.03, 0.5, 12]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.2, 0.18, 0.08, 32]} />
          <meshStandardMaterial color="#141218" roughness={0.6} />
        </mesh>
      </group>

      {/* tom + snare stands */}
      {(["snare", "floor"] as const).map((p) => {
        const d = KIT[p] as DrumDef;
        return (
          <mesh key={p} position={[d.pos[0], d.pos[1] / 2 - d.h / 4, d.pos[2]]}>
            <cylinderGeometry args={[0.01, 0.014, d.pos[1] - d.h / 2, 10]} />
            <meshStandardMaterial {...CHROME} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.72, 0.0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 10]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>

      <Kick perf={perf} now={now} accent={accent} double={double} />
      <Drum def={KIT.snare as DrumDef} piece="snare" perf={perf} now={now} />
      <Drum def={KIT.tom1 as DrumDef} piece="tom1" perf={perf} now={now} />
      <Drum def={KIT.tom2 as DrumDef} piece="tom2" perf={perf} now={now} />
      <Drum def={KIT.floor as DrumDef} piece="floor" perf={perf} now={now} />
      <HiHat perf={perf} now={now} />
      <Cymbal def={KIT.crash as CymbalDef} piece="crash" perf={perf} now={now} />
      <Cymbal def={KIT.crash2 as CymbalDef} piece="crash2" perf={perf} now={now} />
      <Cymbal def={KIT.ride as CymbalDef} piece="ride" perf={perf} now={now} />
      <Cymbal def={KIT.china as CymbalDef} piece="china" perf={perf} now={now} />
      <Stick perf={perf} hand="R" now={now} />
      <Stick perf={perf} hand="L" now={now} />
      {drummer ? <DrummerOnKit perf={perf} now={now} energy={energy} /> : null}
      {pyro ? <Pyro perf={perf} now={now} /> : null}

    </>
  );
};
