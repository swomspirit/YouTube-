import { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Card, ChipStacks, FACE_DOWN, FACE_UP, FELT, Glow, PokerTable, clamp01, ease, lerp3 } from "../poker/Table3D";
import { BOARD, HERO, IVEY, beatAt, findBeat, stateAt, type Focus } from "./timeline";

/* ---------------- nameplate texture ---------------- */
let plateTex: THREE.Texture | null = null;
const nameplate = () => {
  if (plateTex) return plateTex;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0b0b10";
  g.fillRect(0, 0, 512, 128);
  g.strokeStyle = "#3ba3ff";
  g.lineWidth = 6;
  g.strokeRect(6, 6, 500, 116);
  g.fillStyle = "#e9f4ff";
  g.font = '900 64px "Arial Black", Arial';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("PHIL IVEY", 256, 68);
  plateTex = new THREE.CanvasTexture(c);
  plateTex.colorSpace = THREE.SRGBColorSpace;
  return plateTex;
};

/* ---------------- the opponent: a mysterious figure (not a likeness) ---------------- */
const Shark: React.FC<{ t: number; eyes: number; danger: number; lean: number }> = ({ t, eyes, danger, lean }) => {
  const breath = Math.sin(t * 1.3) * 0.005;
  const eyeColor = danger > 0.3 ? "#ff2b3d" : "#7fe7ff";
  return (
    <group position={[0, 0, -0.98 + lean * 0.06]} rotation={[lean * 0.1, 0, 0]}>
      <mesh position={[0, 1.02, -0.24]}>
        <boxGeometry args={[0.6, 0.85, 0.06]} />
        <meshStandardMaterial color="#14161d" roughness={0.6} />
      </mesh>
      {/* suit */}
      <mesh position={[0, 0.98 + breath, 0]} scale={[1.05, 1 + breath * 2, 0.75]}>
        <capsuleGeometry args={[0.21, 0.38, 8, 20]} />
        <meshStandardMaterial color="#161a26" roughness={0.55} />
      </mesh>
      {/* shirt collar + dark red tie */}
      <mesh position={[0, 1.2, 0.13]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.06, 0.08, 3]} />
        <meshStandardMaterial color="#dcdde4" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.08, 0.155]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.028, 0.2, 0.01]} />
        <meshStandardMaterial color="#7a1020" roughness={0.5} />
      </mesh>
      {/* arms + hands resting */}
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <mesh position={[sd * 0.25, 0.98, 0.17]} rotation={[1.1, 0, sd * 0.25]}>
            <capsuleGeometry args={[0.065, 0.3, 6, 12]} />
            <meshStandardMaterial color="#161a26" roughness={0.55} />
          </mesh>
          <mesh position={[sd * 0.17, FELT + 0.025, 0.4]} scale={[1, 0.7, 1.25]}>
            <sphereGeometry args={[0.032, 16, 12]} />
            <meshStandardMaterial color="#6b4a3a" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* hooded head with shadowed face + glowing eyes */}
      <group position={[0, 1.42 + breath, 0.02]} rotation={[0.05, Math.sin(t * 0.4) * 0.05, 0]}>
        <mesh scale={[1.05, 1.1, 1.05]}>
          <sphereGeometry args={[0.16, 28, 22]} />
          <meshStandardMaterial color="#0d0f16" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.01, 0.06]} scale={[0.85, 0.85, 0.7]}>
          <sphereGeometry args={[0.15, 24, 18]} />
          <meshStandardMaterial color="#050608" roughness={1} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[sd * 0.05, 0.01, 0.15]}>
            <mesh scale={[1.6, 0.6 - danger * 0.25, 1]}>
              <sphereGeometry args={[0.014, 12, 8]} />
              <meshBasicMaterial color={eyeColor} toneMapped={false} />
            </mesh>
            <Glow color={eyeColor} size={0.08 + eyes * 0.12} amount={0.5 + eyes * 0.5} position={[0, 0, 0.01]} />
          </group>
        ))}
      </group>
      {/* nameplate on the table */}
      <mesh position={[0, FELT + 0.03, 0.32]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[0.24, 0.06]} />
        <meshBasicMaterial map={nameplate()} toneMapped={false} />
      </mesh>
    </group>
  );
};

/* ---------------- the shark cage ---------------- */
const Cage: React.FC<{ t: number; danger: number }> = ({ t, danger }) => {
  const bars = useMemo(() => Array.from({ length: 34 }, (_, i) => (i / 34) * Math.PI * 2), []);
  const col = danger > 0.3 ? "#ff2b3d" : "#3ba3ff";
  return (
    <group position={[0, 0, -0.1]}>
      {bars.map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 2.1, 1.5, Math.cos(a) * 1.7]}>
          <cylinderGeometry args={[0.018, 0.018, 3, 8]} />
          <meshStandardMaterial color="#6f7886" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
      {[0.05, 2.95].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.1, 1.7, 1]}>
          <torusGeometry args={[1, 0.02, 8, 64]} />
          <meshStandardMaterial color="#6f7886" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
      {/* underwater-ish rim glow behind the cage */}
      <Glow color={col} size={6} amount={0.18 + Math.sin(t * 0.8) * 0.03 + danger * 0.25} position={[0, 1.6, -3.2]} />
      {Array.from({ length: 14 }, (_, i) => (
        <Glow key={i} color={col} size={0.35} amount={0.25 + 0.2 * Math.sin(t * 1.3 + i)} position={[-3 + i * 0.46, 0.4 + ((i * 0.7) % 2.2), -3.4]} />
      ))}
    </group>
  );
};

/* ---------------- camera ---------------- */
const FOCUS: Record<Focus | "slow", { pos: [number, number, number]; target: [number, number, number]; fov: number }> = {
  table: { pos: [0, 1.16, 0.86], target: [0, 0.86, -0.4], fov: 50 },
  board: { pos: [0, 1.14, 0.7], target: [0, FELT, -0.04], fov: 44 },
  ivey: { pos: [0, 1.17, 0.74], target: [0, 1.1, -0.9], fov: 42 },
  cards: { pos: [0, 1.12, 0.8], target: [0, 0.92, 0.5], fov: 48 },
  pot: { pos: [0, 1.15, 0.7], target: [0, FELT, -0.2], fov: 46 },
  slow: { pos: [0, 1.36, 0.3], target: [0, 1.38, -0.98], fov: 36 },
};
const focusOf = (time: number): Focus | "slow" => {
  const b = beatAt(time);
  const st = b.step;
  if (st.k === "peek") return "cards";
  if (st.k === "slowmo") return "slow";
  if (st.k === "reveal") return time - b.start < 1.0 ? "ivey" : "board";
  if (st.k === "deal") return "board";
  if (st.k === "win") return "pot";
  if (st.k === "voice" && st.focus) return st.focus;
  if (st.k === "title" || st.k === "outro") return "ivey";
  return "table";
};
const Camera: React.FC<{ t: number; shake: number }> = ({ t, shake }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const b = beatAt(t);
  const to = focusOf(t);
  const from = focusOf(b.start - 0.01);
  const k = ease((t - b.start) / (to === "slow" ? 2.5 : 0.7));
  const A = FOCUS[from];
  const B = FOCUS[to];
  const pos = lerp3(A.pos, B.pos, k);
  const target = lerp3(A.target, B.target, k);
  const fov = A.fov + (B.fov - A.fov) * k;
  pos[0] += Math.sin(t * 0.7) * 0.008 + Math.sin(t * 37) * shake;
  pos[1] += Math.sin(t * 1.1) * 0.005 + Math.cos(t * 29) * shake;
  camera.position.set(...pos);
  camera.lookAt(new THREE.Vector3(...target));
  if (Math.abs(camera.fov - fov) > 0.01) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  return null;
};

/* ---------------- scene ---------------- */
export const IveyScene: React.FC<{ t: number }> = ({ t }) => {
  const s = stateAt(t);
  const b = beatAt(t);
  const slow = findBeat("slowmo");
  const danger = t >= slow.start + 2 ? 1 : 0;
  const peekBeat = b.step.k === "peek" ? b : null;
  const peek = peekBeat ? Math.sin(Math.PI * clamp01((t - peekBeat.start) / (peekBeat.end - peekBeat.start))) : 0;
  const coolBeat = b.step.k === "voice" && b.step.id === "m_cool" ? b : null;
  const coolPeek = coolBeat ? Math.sin(Math.PI * clamp01((t - coolBeat.start) / (coolBeat.end - coolBeat.start))) * 0.9 : 0;
  const lift = Math.max(peek, coolPeek);

  const heroCards = HERO.map((c, i) => {
    const sd = i === 0 ? -1 : 1;
    const rest: [number, number, number] = [sd * 0.048, FELT + 0.002 + i * 0.001, 0.42];
    const up: [number, number, number] = [sd * 0.046, 0.95, 0.6];
    return <Card key={c} card={c} pos={lerp3(rest, up, ease(lift))} rotX={FACE_DOWN + (-0.7 - FACE_DOWN) * ease(lift)} rotZ={sd * -0.08 * ease(lift)} />;
  });

  const board = s.dealt.map((dealt, i) => {
    const slide = ease((t - dealt) / 0.3);
    const flip = ease((t - s.flips[i]) / 0.28);
    const target: [number, number, number] = [-0.22 + i * 0.11, FELT + 0.002, -0.02];
    const pos = lerp3([0.75, FELT + 0.002, -0.1], target, slide);
    pos[1] += Math.sin(Math.PI * flip) * 0.05;
    return <Card key={BOARD[i]} card={BOARD[i]} pos={pos} rotX={FACE_DOWN + (FACE_UP - FACE_DOWN) * flip} />;
  });

  const reveal = s.revealAt !== null ? ease((t - s.revealAt) / 0.7) : 0;
  const iveyCards = IVEY.map((c, i) => {
    const sd = i === 0 ? -1 : 1;
    const pos: [number, number, number] = [sd * 0.05, FELT + 0.002 + i * 0.001 + Math.sin(Math.PI * reveal) * 0.08, -0.42];
    return <Card key={c} card={c} pos={pos} rotX={FACE_DOWN + (FACE_UP - FACE_DOWN) * reveal} />;
  });

  const slideDur = (big?: boolean) => (big ? 1.6 : 0.45);
  const slideOf = (who: "hero" | "ivey") => (s.lastBet && s.lastBet.who === who ? ease((t - s.lastBet.t) / slideDur(s.lastBet.big)) : 1);
  const heroBetPos = lerp3([0.3, FELT, 0.42], [0.12, FELT, 0.22], slideOf("hero"));
  const iveyBetPos = lerp3([-0.3, FELT, -0.5], [-0.14, FELT, -0.28], slideOf("ivey"));
  const winK = s.winAt !== null ? ease((t - s.winAt) / 0.9) : 0;
  const potPos = lerp3([0.02, FELT, -0.17], [-0.3, FELT, -0.5], winK);
  const lean = s.lastBet?.who === "ivey" ? Math.max(0, 1 - (t - s.lastBet.t) / 1.5) : 0;
  const eyes = danger ? 0.6 + 0.4 * Math.sin(t * 6) : 0.2;
  const shake = s.lastBet?.big ? Math.max(0, 1 - (t - s.lastBet.t) / 0.6) * 0.01 : 0;

  // chips are shown in units of 1K (each "$1" chip = 1,000)
  const k = (x: number) => Math.round(x / 1000);
  return (
    <>
      <color attach="background" args={["#04070d"]} />
      <fog attach="fog" args={["#04070d", 3, 7]} />
      <Camera t={t} shake={shake} />
      <ambientLight intensity={0.3} />
      <spotLight position={[0, 2.0, -0.1]} angle={0.75} penumbra={0.8} intensity={7} color="#ffdcae" distance={5} />
      <pointLight position={[0.3, 1.45, 0.4]} intensity={1.6} color="#ffe6cc" distance={3} />
      <pointLight position={[0, 1.6, -2]} intensity={2.5 + danger * 2} color={danger ? "#ff2b3d" : "#3ba3ff"} distance={4} />
      <Cage t={t} danger={danger} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#0a0d14" roughness={0.8} />
      </mesh>
      <PokerTable />
      <Shark t={t} eyes={eyes} danger={danger} lean={lean} />
      <ChipStacks amount={Math.max(0, 300 - k(s.heroBet))} pos={[0.3, FELT, 0.42]} spread={0.05} />
      <ChipStacks amount={300} pos={[-0.3, FELT, -0.5]} spread={0.05} />
      <ChipStacks amount={k(s.heroBet)} pos={heroBetPos} spread={0.04} />
      <ChipStacks amount={k(s.iveyBet)} pos={iveyBetPos} spread={0.04} />
      <ChipStacks amount={k(s.pot)} pos={potPos} spread={0.04} />
      {iveyCards}
      {board}
      {heroCards}
    </>
  );
};
