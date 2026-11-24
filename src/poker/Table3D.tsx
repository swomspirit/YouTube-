import { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { cardTexture } from "./cards";
import { HERO_CARDS, OPPONENTS, beatAt, stateAt, type Focus, type TableState } from "./timeline";

/*
 * First-person poker table (three.js via @remotion/three).
 * Hero sits at +z looking across the table at the opponent (-z). Felt surface at y = FELT.
 */
export const FELT = 0.76;
const CARD_W = 0.063 * 1.35;
const CARD_H = 0.088 * 1.35;
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};

/* ---------------- glow sprite (fake bloom) ---------------- */
let glowTex: THREE.Texture | null = null;
const glowTexture = () => {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.3, "rgba(255,255,255,0.4)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
};
export const Glow: React.FC<{ color: string; size: number; amount: number; position: [number, number, number] }> = ({ color, size, amount, position }) =>
  amount > 0.01 ? (
    <sprite position={position} scale={[size, size, 1]}>
      <spriteMaterial map={glowTexture()} color={color} transparent opacity={Math.min(1, amount)} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  ) : null;

/* ---------------- a playing card ---------------- */
export const Card: React.FC<{ card: string; pos: [number, number, number]; rotX: number; rotY?: number; rotZ?: number; scale?: number }> = ({ card, pos, rotX, rotY = 0, rotZ = 0, scale = 1 }) => {
  const front = cardTexture(card);
  const back = cardTexture("back");
  return (
    <group position={pos} rotation={[rotX, rotY, rotZ]} scale={scale}>
      <mesh>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshStandardMaterial map={front} roughness={0.55} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshStandardMaterial map={back} roughness={0.55} />
      </mesh>
    </group>
  );
};
// card lying on the felt: face up = -PI/2, face down = +PI/2 (around x)
export const FACE_UP = -Math.PI / 2;
export const FACE_DOWN = Math.PI / 2;

/* ---------------- chips ---------------- */
const DENOMS = [
  { v: 25, color: "#1f8a4c", edge: "#e9f5ec" },
  { v: 5, color: "#c8202f", edge: "#fbe9eb" },
  { v: 1, color: "#eeeae0", edge: "#3a6fd8" },
];
export const ChipStacks: React.FC<{ amount: number; pos: [number, number, number]; spread?: number }> = ({ amount, pos, spread = 0.05 }) => {
  if (amount <= 0) return null;
  const cols: { color: string; edge: string; n: number }[] = [];
  let left = amount;
  for (const d of DENOMS) {
    let n = Math.floor(left / d.v);
    left -= n * d.v;
    while (n > 0) {
      const k = Math.min(10, n);
      cols.push({ color: d.color, edge: d.edge, n: k });
      n -= k;
    }
  }
  return (
    <group position={pos}>
      {cols.map((c, i) => {
        const x = (i - (cols.length - 1) / 2) * spread;
        return (
          <group key={i} position={[x, 0, (i % 2) * 0.012]}>
            {Array.from({ length: c.n }, (_, j) => (
              <group key={j} position={[Math.sin(j * 2.3 + i) * 0.0015, 0.0028 + j * 0.0052, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.022, 0.022, 0.0048, 20]} />
                  <meshStandardMaterial color={c.color} roughness={0.45} />
                </mesh>
                <mesh position={[0, 0.0025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.013, 0.019, 20]} />
                  <meshStandardMaterial color={c.edge} roughness={0.5} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
};

/* ---------------- opponent (stylised, faceless-ish) ---------------- */
const Opponent: React.FC<{ n: number; t: number; lean: number; react: number }> = ({ n, t, lean, react }) => {
  const SKIN = "#d9a47e";
  const breath = Math.sin(t * 1.6) * 0.006;
  const body = n === 1 ? "#5d636d" : n === 2 ? "#b7282e" : "#2e7fd6";
  return (
    <group position={[0, 0, -0.98 + lean * 0.08]} rotation={[lean * 0.12, 0, 0]}>
      {/* chair back */}
      <mesh position={[0, 1.0, -0.22]}>
        <boxGeometry args={[0.55, 0.75, 0.06]} />
        <meshStandardMaterial color="#2a1c16" roughness={0.6} />
      </mesh>
      {/* torso */}
      <mesh position={[0, 0.98 + breath, 0]} scale={[1, 1 + breath * 2, 0.75]}>
        <capsuleGeometry args={[0.2, 0.36, 8, 20]} />
        <meshStandardMaterial color={body} roughness={0.7} />
      </mesh>
      {/* arms resting on the table edge */}
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <mesh position={[sd * 0.25, 0.98, 0.17]} rotation={[1.1, 0, sd * 0.25]}>
            <capsuleGeometry args={[0.06, 0.3, 6, 12]} />
            <meshStandardMaterial color={body} roughness={0.7} />
          </mesh>
          <mesh position={[sd * 0.17, FELT + 0.025, 0.4]} scale={[1, 0.7, 1.25]}>
            <sphereGeometry args={[0.032, 16, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* neck + head */}
      <mesh position={[0, 1.27, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.1, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>
      <group position={[0, 1.43 + breath, 0.02]} rotation={[0.05 - react * 0.25, Math.sin(t * 0.5) * 0.08, 0]}>
        <mesh>
          <sphereGeometry args={[0.15, 28, 22]} />
          <meshStandardMaterial color={SKIN} roughness={0.55} />
        </mesh>
        {n === 1 ? (
          <>
            {/* hood */}
            <mesh position={[0, 0.03, -0.03]} scale={[1.18, 1.15, 1.15]}>
              <sphereGeometry args={[0.15, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
              <meshStandardMaterial color="#4b5059" roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
            {/* dark wraparound shades */}
            <mesh position={[0, 0.02, 0.135]}>
              <boxGeometry args={[0.24, 0.05, 0.03]} />
              <meshStandardMaterial color="#0b0b0f" metalness={0.6} roughness={0.15} />
            </mesh>
            <mesh position={[0, -0.07, 0.14]}>
              <boxGeometry args={[0.06, 0.008, 0.01]} />
              <meshStandardMaterial color="#5a2a22" />
            </mesh>
          </>
        ) : n === 2 ? (
          <>
            {/* wild spiky hair */}
            {Array.from({ length: 9 }, (_, i) => {
              const a = (i / 9) * Math.PI * 1.6 - Math.PI * 0.8;
              return (
                <mesh key={i} position={[Math.sin(a) * 0.11, 0.12 + Math.cos(a) * 0.03, -0.02 + Math.cos(a) * 0.02]} rotation={[-0.2, 0, -a * 0.6]}>
                  <coneGeometry args={[0.045, 0.16, 8]} />
                  <meshStandardMaterial color="#ff7a1a" roughness={0.6} />
                </mesh>
              );
            })}
            {/* gold aviators */}
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[sd * 0.055, 0.02, 0.135]}>
                <circleGeometry args={[0.042, 20]} />
                <meshStandardMaterial color="#2a1f12" metalness={0.8} roughness={0.15} side={THREE.DoubleSide} />
              </mesh>
            ))}
            <mesh position={[0, 0.03, 0.14]}>
              <boxGeometry args={[0.2, 0.008, 0.008]} />
              <meshStandardMaterial color="#e2b84a" metalness={1} roughness={0.25} />
            </mesh>
            {/* grin */}
            <mesh position={[0, -0.075, 0.135]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.04, 0.008, 6, 16, Math.PI]} />
              <meshStandardMaterial color="#fffaf0" />
            </mesh>
            {/* gold chain */}
            <mesh position={[0, -0.2, 0.05]} rotation={[1.2, 0, 0]}>
              <torusGeometry args={[0.1, 0.01, 8, 24]} />
              <meshStandardMaterial color="#e2b84a" metalness={1} roughness={0.25} />
            </mesh>
          </>
        ) : (
          <>
            {/* bucket hat */}
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.12, 0.15, 0.1, 24]} />
              <meshStandardMaterial color="#e8d9a8" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.23, 0.23, 0.012, 32]} />
              <meshStandardMaterial color="#e8d9a8" roughness={0.8} />
            </mesh>
            {/* big friendly eyes */}
            {[-1, 1].map((sd) => (
              <group key={sd} position={[sd * 0.05, 0.0, 0.135]}>
                <mesh>
                  <sphereGeometry args={[0.028, 16, 12]} />
                  <meshStandardMaterial color="white" />
                </mesh>
                <mesh position={[0, 0, 0.022]}>
                  <sphereGeometry args={[0.012, 12, 8]} />
                  <meshStandardMaterial color="#111" />
                </mesh>
              </group>
            ))}
            <mesh position={[0, -0.075, 0.13]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.035, 0.007, 6, 16, Math.PI]} />
              <meshStandardMaterial color="#5a2a22" />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
};

/* ---------------- camera ---------------- */
const FOCUS: Record<Focus, { pos: [number, number, number]; target: [number, number, number]; fov: number }> = {
  table: { pos: [0, 1.16, 0.86], target: [0, 0.84, -0.4], fov: 50 },
  board: { pos: [0, 1.13, 0.72], target: [0, FELT, -0.02], fov: 46 },
  villain: { pos: [0, 1.15, 0.78], target: [0, 1.02, -0.9], fov: 44 },
  cards: { pos: [0, 1.12, 0.8], target: [0, 0.9, 0.5], fov: 48 },
  pot: { pos: [0, 1.15, 0.7], target: [0, FELT, -0.18], fov: 46 },
};
export const lerp3 = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k) as [number, number, number];

const focusAt = (t: number): { from: Focus; to: Focus; k: number } => {
  // decide focus per beat; ease from previous focus over 0.7s
  const f = (time: number): Focus => {
    const b = beatAt(time);
    if (!b) return "table";
    const st = b.step;
    if (st.k === "peek") return "cards";
    if (st.k === "deal") return time - b.start < 1.6 ? "board" : "board";
    if (st.k === "reveal") return "villain";
    if (st.k === "win") return "pot";
    if (st.k === "voice" && st.focus) return st.focus;
    if (st.k === "scene") return "villain";
    if (st.k === "decide") return "table";
    return "table";
  };
  const b = beatAt(t);
  const now = f(t);
  if (!b) return { from: now, to: now, k: 1 };
  const prev = f(b.start - 0.01);
  return { from: prev, to: now, k: ease((t - b.start) / 0.7) };
};

const Camera: React.FC<{ t: number; decidePush: number; shake: number }> = ({ t, decidePush, shake }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { from, to, k } = focusAt(t);
  const A = FOCUS[from];
  const B = FOCUS[to];
  const pos = lerp3(A.pos, B.pos, k);
  const target = lerp3(A.target, B.target, k);
  const fov = A.fov + (B.fov - A.fov) * k - decidePush * 6;
  // handheld sway + breathing
  pos[0] += Math.sin(t * 0.7) * 0.01 + Math.sin(t * 31) * shake;
  pos[1] += Math.sin(t * 1.1) * 0.006 + Math.cos(t * 27) * shake;
  camera.position.set(...pos);
  camera.lookAt(new THREE.Vector3(...target));
  if (Math.abs(camera.fov - fov) > 0.01) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  return null;
};

/* ---------------- room ---------------- */
const Room: React.FC<{ t: number; accent: string }> = ({ t, accent }) => {
  const bokeh = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        x: -4 + ((i * 1.37) % 8),
        y: 0.9 + ((i * 0.53) % 1.6),
        z: -4.5 - (i % 3) * 0.6,
        c: ["#ffcf7a", "#ff8a5c", "#ffd9a8", "#9fc3ff"][i % 4],
        s: 0.25 + (i % 4) * 0.12,
      })),
    [],
  );
  return (
    <group>
      <mesh position={[0, 2, -5.4]}>
        <planeGeometry args={[18, 8]} />
        <meshStandardMaterial color="#120d14" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#1a0f12" roughness={0.85} />
      </mesh>
      {bokeh.map((b, i) => (
        <Glow key={i} color={b.c} size={b.s} amount={0.35 + 0.15 * Math.sin(t * 0.8 + i)} position={[b.x, b.y, b.z]} />
      ))}
      <Glow color={accent} size={3.2} amount={0.12} position={[0, 1.4, -2.6]} />
    </group>
  );
};

export const PokerTable: React.FC = () => (
  <group>
    {/* felt */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FELT, 0]} scale={[1.55, 1, 1]}>
      <circleGeometry args={[0.95, 96]} />
      <meshStandardMaterial color="#0a4f2d" roughness={0.97} />
    </mesh>
    {/* betting line */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FELT + 0.001, 0]} scale={[1.55, 1, 1]}>
      <ringGeometry args={[0.6, 0.607, 96]} />
      <meshStandardMaterial color="#e4d9a6" roughness={0.6} transparent opacity={0.55} />
    </mesh>
    {/* padded rail */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FELT + 0.02, 0]} scale={[1.55, 1, 1]}>
      <torusGeometry args={[0.98, 0.07, 18, 120]} />
      <meshStandardMaterial color="#2b1710" roughness={0.45} />
    </mesh>
    {/* table base */}
    <mesh position={[0, FELT / 2, 0]}>
      <cylinderGeometry args={[0.25, 0.4, FELT - 0.02, 24]} />
      <meshStandardMaterial color="#1b110d" roughness={0.6} />
    </mesh>
    {/* hanging lamp */}
    <mesh position={[0, 2.05, -0.05]}>
      <coneGeometry args={[0.32, 0.22, 32, 1, true]} />
      <meshStandardMaterial color="#1c3a2a" metalness={0.4} roughness={0.4} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 3.2, -0.05]}>
      <cylinderGeometry args={[0.006, 0.006, 2.2, 6]} />
      <meshStandardMaterial color="#111" />
    </mesh>
  </group>
);

/* ---------------- whole scene ---------------- */
export const PokerScene: React.FC<{ t: number }> = ({ t }) => {
  const s: TableState = stateAt(t);
  const beat = beatAt(t);
  const opp = s.scene ? OPPONENTS[s.scene - 1] : null;
  const accent = opp?.color ?? "#d4b25a";

  // hero hole cards: peek animation at the start of each scene + during "cards" focus
  const peekBeat = beat?.step.k === "peek" ? beat : null;
  const peekK = peekBeat ? Math.sin(Math.PI * clamp01((t - peekBeat.start) / (peekBeat.end - peekBeat.start))) : 0;
  const titlePeek = beat?.step.k === "title" ? clamp01((t - beat.start - 0.8) / 1.2) * (1 - clamp01((t - beat.end + 1.2) / 1.0)) : 0;
  const riverSet = beat?.step.k === "voice" && beat.step.id === "s3_river" ? Math.sin(Math.PI * clamp01((t - beat.start) / (beat.end - beat.start))) : 0;
  const lift = Math.max(peekK, titlePeek, riverSet * 0.8);
  const folded = s.heroFolded !== null ? ease((t - s.heroFolded) / 0.6) : 0;

  const heroCards = HERO_CARDS.map((c, i) => {
    const sd = i === 0 ? -1 : 1;
    const rest: [number, number, number] = [sd * 0.048, FELT + 0.002 + i * 0.001, 0.42];
    const up: [number, number, number] = [sd * 0.046, 0.95, 0.6];
    const muck: [number, number, number] = [0.14 + sd * 0.03, FELT + 0.002, -0.12];
    let pos = lerp3(rest, up, ease(lift));
    let rotX = FACE_DOWN + (-0.7 - FACE_DOWN) * ease(lift);
    if (folded > 0) {
      pos = lerp3(rest, muck, folded);
      rotX = FACE_DOWN;
    }
    return <Card key={c} card={c} pos={pos} rotX={rotX} rotZ={sd * -0.08 * ease(lift)} rotY={0} />;
  });

  // board cards: slide from the dealer spot, then flip
  const board = s.board.map((b, i) => {
    const dt = t - b.dealtAt;
    const slide = ease(dt / 0.35);
    const flip = ease((dt - 0.55) / 0.3);
    const target: [number, number, number] = [-0.22 + i * 0.11, FELT + 0.002, -0.02];
    const pos = lerp3([0.75, FELT + 0.002, -0.1], target, slide);
    pos[1] += Math.sin(Math.PI * flip) * 0.04;
    return <Card key={b.card} card={b.card} pos={pos} rotX={FACE_DOWN + (FACE_UP - FACE_DOWN) * flip} />;
  });

  // villain hole cards
  const reveal = s.revealedAt !== null ? ease((t - s.revealedAt) / 0.4) : 0;
  const villCards = opp
    ? opp.cards.map((c, i) => {
        const sd = i === 0 ? -1 : 1;
        const pos: [number, number, number] = [sd * 0.05, FELT + 0.002 + i * 0.001 + Math.sin(Math.PI * reveal) * 0.05, -0.42];
        return <Card key={c} card={c} pos={pos} rotX={FACE_DOWN + (FACE_UP - FACE_DOWN) * reveal} />;
      })
    : null;

  // chips: bets slide in from the player's stack; pot slides to the winner
  const betSlide = (who: "hero" | "villain") => (s.lastBet && s.lastBet.who === who ? ease((t - s.lastBet.t) / 0.45) : 1);
  const hb = betSlide("hero");
  const vb = betSlide("villain");
  const heroBetPos = lerp3([0.3, FELT, 0.42], [0.12, FELT, 0.22], hb);
  const villBetPos = lerp3([-0.3, FELT, -0.5], [-0.14, FELT, -0.28], vb);
  const winK = s.winner ? ease((t - s.winAt) / 0.8) : 0;
  const potPos = lerp3([0.02, FELT, -0.17], s.winner === "hero" ? [0.3, FELT, 0.4] : [-0.3, FELT, -0.5], winK);

  const lastBetAge = s.lastBet ? t - s.lastBet.t : 9;
  const lean = s.lastBet?.who === "villain" ? Math.max(0, 1 - lastBetAge / 1.2) : 0;
  const react = s.revealedAt !== null ? Math.max(0, 1 - (t - s.revealedAt) / 1.5) * 0.8 : 0;
  const decide = beat?.step.k === "decide" ? clamp01((t - beat.start) / 3.5) : 0;
  const allIn = s.label.includes("ALL IN") ? Math.max(0, 1 - (t - s.labelAt) / 0.5) * 0.012 : 0;

  return (
    <>
      <color attach="background" args={["#0a0709"]} />
      <fog attach="fog" args={["#0a0709", 3.5, 7]} />
      <Camera t={t} decidePush={decide} shake={allIn} />
      <ambientLight intensity={0.3} />
      <spotLight position={[0, 2.0, -0.1]} angle={0.75} penumbra={0.8} intensity={7} color="#ffdcae" distance={5} />
      {/* soft key light on the opponent's face, from the hero's side */}
      <pointLight position={[0.3, 1.45, 0.4]} intensity={2.2} color="#ffe6cc" distance={3} />
      <pointLight position={[-0.6, 1.3, -0.3]} intensity={0.8} color="#9fc3ff" distance={3} />
      <pointLight position={[0, 1.6, -2.2]} intensity={2} color={accent} distance={4} />
      <Room t={t} accent={accent} />
      <PokerTable />
      {opp ? <Opponent n={opp.n} t={t} lean={lean} react={react} /> : null}
      {/* stacks */}
      {s.scene ? (
        <>
          <ChipStacks amount={s.heroStack} pos={[0.3, FELT, 0.42]} spread={0.05} />
          <ChipStacks amount={s.villStack} pos={[-0.3, FELT, -0.5]} spread={0.05} />
          <ChipStacks amount={s.heroBet} pos={heroBetPos} spread={0.04} />
          <ChipStacks amount={s.villBet} pos={villBetPos} spread={0.04} />
          <ChipStacks amount={s.pot} pos={potPos} spread={0.04} />
          {villCards}
          {board}
        </>
      ) : null}
      {heroCards}
      {/* dealer button */}
      <mesh position={[0.42, FELT + 0.004, 0.2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.008, 24]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.4} />
      </mesh>
    </>
  );
};
