import { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Card, ChipStacks, FACE_DOWN, FACE_UP, FELT, Glow } from "../poker/Table3D";
import { Lamp, Person, Rope, Table, carpet, sign } from "../demo-twist/Casino";
import { randomLook, type Expr, type Look } from "../demo-twist/chars";
import { BOARD, HERO_CARDS, IVEY_CARDS, stateAt, type Shot } from "./timeline";

const ease = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};
const lerp3 = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k) as [number, number, number];

const HERO: Look = { skin: "#f3d2b3", shirt: "#d65a8a", hair: "bob", hairColor: "#7a4a2a" };
const IVEY: Look = { skin: "#8d5a3c", shirt: "#3a3f4c", hair: "short", hairColor: "#1b1b20", hat: "beanie", hatColor: "#1d1d24", glasses: "shades" };
const HERO_POS: [number, number, number] = [0, 1.02, 1.0];
const IVEY_POS: [number, number, number] = [0, 1.02, -1.0];

/* camera shots: [from, to] so every shot has a slow push */
type Cam = { pos: [number, number, number]; target: [number, number, number]; fov: number };
const SHOTS: Record<Shot, { a: Cam; b: Cam; reverse?: boolean }> = {
  wide: { a: { pos: [0.35, 2.6, 3.7], target: [0, 0.8, -0.35], fov: 56 }, b: { pos: [0.3, 2.35, 3.15], target: [0, 0.8, -0.35], fov: 56 } },
  iveyClose: { a: { pos: [0.1, 1.3, 0.7], target: [0, 1.1, -1.0], fov: 42 }, b: { pos: [0.08, 1.28, 0.45], target: [0, 1.12, -1.0], fov: 42 } },
  heroClose: { a: { pos: [-0.1, 1.3, -0.65], target: [0, 1.1, 1.0], fov: 42 }, b: { pos: [-0.08, 1.28, -0.42], target: [0, 1.12, 1.0], fov: 42 }, reverse: true },
  heroCards: { a: { pos: [0.75, 1.12, 0.82], target: [0, 0.92, 0.64], fov: 34 }, b: { pos: [0.66, 1.1, 0.8], target: [0, 0.92, 0.64], fov: 32 } },
  board: { a: { pos: [0.05, 2.55, 1.55], target: [0, FELT, 0.0], fov: 40 }, b: { pos: [0.03, 2.4, 1.42], target: [0, FELT, 0.0], fov: 40 } },
  chipsIvey: { a: { pos: [0.15, 1.0, 0.25], target: [-0.05, 0.92, -0.7], fov: 46 }, b: { pos: [0.1, 0.97, 0.05], target: [-0.05, 0.95, -0.7], fov: 46 } },
  iveyCards: { a: { pos: [0.02, 1.15, -0.0], target: [0, FELT, -0.55], fov: 40 }, b: { pos: [0.02, 1.08, -0.12], target: [0, FELT, -0.55], fov: 40 } },
  crowd: { a: { pos: [0.0, 1.5, -1.35], target: [0, 1.35, -2.6], fov: 56 }, b: { pos: [0.0, 1.48, -1.5], target: [0, 1.36, -2.6], fov: 54 } },
  pullback: { a: { pos: [0.2, 2.2, 2.6], target: [0, 0.85, -0.3], fov: 56 }, b: { pos: [0.3, 3.4, 4.6], target: [0, 0.8, -0.6], fov: 58 } },
};
export const isReverse = (shot: Shot) => !!SHOTS[shot].reverse;

const CameraRig: React.FC<{ shot: Shot; k: number; shake: number; t: number }> = ({ shot, k, shake, t }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const S = SHOTS[shot];
  const pos = lerp3(S.a.pos, S.b.pos, k);
  const target = lerp3(S.a.target, S.b.target, k);
  pos[0] += Math.sin(t * 0.9) * 0.006 + Math.sin(t * 41) * shake;
  pos[1] += Math.sin(t * 1.3) * 0.004 + Math.cos(t * 37) * shake;
  camera.position.set(...pos);
  camera.lookAt(new THREE.Vector3(...target));
  const fov = S.a.fov + (S.b.fov - S.a.fov) * k;
  if (Math.abs(camera.fov - fov) > 0.01) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  return null;
};

const Chips: React.FC<{ k: number; pos: [number, number, number]; s?: number }> = ({ k, pos, s = 1.45 }) =>
  k > 0 ? (
    <group position={pos} scale={s}>
      <ChipStacks amount={k} pos={[0, 0, 0]} spread={0.05} />
    </group>
  ) : null;

export const ShortScene: React.FC<{ t: number }> = ({ t }) => {
  const st = stateAt(t);
  const reverse = isReverse(st.shot);
  const shotK = ease((t - st.shotAt) / 4);
  const shake = st.lastBet?.big ? Math.max(0, 1 - (t - st.lastBet.t) / 0.5) * 0.008 : 0;

  // background crowd: tables on both sides so reverse shots have a world too
  const bgTables = useMemo(
    () =>
      [
        [-3.2, -3.2],
        [3.4, -3.6],
        [-0.2, -6.2],
        [4.2, -0.4],
        [-4.4, 0.2],
        [-2.8, 3.8],
        [3.0, 4.2],
        [0.2, 6.4],
      ] as [number, number][],
    [],
  );
  const seats = (cx: number, cz: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      return [cx + Math.cos(a) * 1.45, cz + Math.sin(a) * 0.95] as [number, number];
    });

  // hole cards
  const peek = st.peekAt !== null ? Math.sin(Math.PI * Math.min(1, Math.max(0, (t - st.peekAt) / 2.6))) : 0;
  const heroCards = HERO_CARDS.map((c, i) => {
    const sd = i ? 1 : -1;
    const rest: [number, number, number] = [sd * 0.06, FELT + 0.003 + i * 0.001, 0.52];
    const up: [number, number, number] = [sd * 0.075, 0.92, 0.66 - sd * 0.05];
    const p = ease(peek);
    return <Card key={c} card={c} pos={lerp3(rest, up, p)} rotX={FACE_DOWN + (-0.55 - FACE_DOWN) * p} rotY={0.5 * p} rotZ={sd * -0.1 * p} scale={1.2} />;
  });
  const reveal = st.revealAt !== null ? ease((t - st.revealAt - 0.2) / 0.5) : 0;
  const iveyCards = IVEY_CARDS.map((c, i) => {
    const sd = i ? 1 : -1;
    const pos: [number, number, number] = [sd * 0.065, FELT + 0.003 + i * 0.001 + Math.sin(Math.PI * reveal) * 0.06, -0.52];
    return <Card key={c} card={c} pos={pos} rotX={FACE_DOWN + (FACE_UP - FACE_DOWN) * reveal} scale={1.2} />;
  });
  const board = st.board.map((b, i) => {
    const slide = ease((t - b.dealt) / 0.3);
    const flip = ease((t - b.flip) / 0.3);
    const target: [number, number, number] = [-0.36 + i * 0.18, FELT + 0.003, 0.02];
    const pos = lerp3([0.9, FELT + 0.003, -0.2], target, slide);
    pos[1] += Math.sin(Math.PI * flip) * 0.06;
    return <Card key={BOARD[i]} card={BOARD[i]} pos={pos} rotX={FACE_DOWN + (FACE_UP - FACE_DOWN) * flip} scale={1.45} />;
  });

  // chips (thousands): bets fly in an arc from the stacks
  const fly = (who: "hero" | "ivey") => (st.lastBet && st.lastBet.who === who ? ease((t - st.lastBet.t) / (st.lastBet.big ? 0.8 : 0.4)) : 1);
  const arc = (k: number) => Math.sin(Math.PI * k) * 0.12;
  const hk = fly("hero");
  const ik = fly("ivey");
  const heroBet = lerp3([0.45, FELT, 0.62], [0.14, FELT, 0.3], hk);
  heroBet[1] += arc(hk);
  const iveyBet = lerp3([-0.45, FELT, -0.62], [-0.14, FELT, -0.3], ik);
  iveyBet[1] += arc(ik);

  // knock = quick lean of the checking player's sprite
  const knock = (who: "hero" | "ivey") => (st.lastCheck && st.lastCheck.who === who && t - st.lastCheck.t < 0.4 ? Math.sin(((t - st.lastCheck.t) / 0.4) * Math.PI * 2) * 0.02 : 0);
  const crowdHop = st.crowdExpr === "shock" ? 0.02 : 0;

  return (
    <>
      <CameraRig shot={st.shot} k={shotK} shake={shake} t={t} />
      <color attach="background" args={["#1a0f0c"]} />
      <fog attach="fog" args={["#2a1612", 4, 11]} />
      <ambientLight intensity={0.55} color="#ffd9b8" />
      <spotLight position={[0, 3.2, 0]} angle={0.7} penumbra={0.7} intensity={14} color="#ffe2b0" distance={7} />
      <pointLight position={[0, 2.5, 3]} intensity={2.5} color="#ffcf9a" distance={8} />
      <pointLight position={[0, 2.5, -3]} intensity={2} color="#ffcf9a" distance={8} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial map={carpet()} roughness={0.95} />
      </mesh>
      {[-8, 8].map((z) => (
        <group key={z}>
          <mesh position={[0, 2.5, z]} rotation={[0, z > 0 ? Math.PI : 0, 0]}>
            <planeGeometry args={[30, 6]} />
            <meshStandardMaterial color="#3a2418" roughness={0.9} />
          </mesh>
          {[-6, -2, 2, 6].map((x) => (
            <mesh key={x} position={[x, 2.5, z + (z > 0 ? -0.2 : 0.2)]}>
              <boxGeometry args={[0.6, 5, 0.4]} />
              <meshStandardMaterial color="#6b4a2a" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[4, 2.4, -7.55]}>
        <planeGeometry args={[2.2, 0.42]} />
        <meshBasicMaterial map={sign("CASHIER")} toneMapped={false} />
      </mesh>
      <mesh position={[-4, 2.4, -7.55]}>
        <planeGeometry args={[2.6, 0.42]} />
        <meshBasicMaterial map={sign("REGISTRATION")} toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.4, 7.55]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3.0, 0.42]} />
        <meshBasicMaterial map={sign("HIGH STAKES")} toneMapped={false} />
      </mesh>

      {bgTables.map((tb, i) => (
        <group key={i}>
          <Table pos={[tb[0], 0, tb[1]]} />
          <Lamp pos={[tb[0], 2.6, tb[1]]} />
          {seats(tb[0], tb[1]).map((s2, j) => {
            // seat faces the table: from our side we see their back if they sit between us and the table
            const camZ = reverse ? -3 : 3;
            const back = Math.sign(s2[1] - tb[1]) === Math.sign(camZ);
            return <Person key={j} look={{ ...randomLook(i * 13 + j + 40), back }} pos={[s2[0], 1.0, s2[1]]} blur={2.5} bob={Math.sin(t * 1.3 + i + j) * 0.01} />;
          })}
        </group>
      ))}

      {/* main table + cast */}
      <Table pos={[0, 0, 0]} />
      <Lamp pos={[0, 2.75, 0]} />
      <Person look={{ ...IVEY, back: reverse }} expr={st.iveyExpr} pos={[IVEY_POS[0], IVEY_POS[1] + knock("ivey"), IVEY_POS[2]]} bob={Math.sin(t * 1.6) * 0.005} />
      <Person look={{ ...HERO, back: !reverse }} expr={st.heroExpr} pos={[HERO_POS[0], HERO_POS[1] + knock("hero"), HERO_POS[2]]} bob={Math.sin(t * 1.6 + 1) * 0.005} />
      {[
        { look: randomLook(3), pos: [-1.1, -0.6] },
        { look: randomLook(7), pos: [1.15, -0.55] },
        { look: randomLook(11), pos: [-1.35, 0.45] },
        { look: randomLook(19), pos: [1.3, 0.5] },
      ].map((m, i) => (
        <Person key={i} look={{ ...(m.look as Look), back: reverse ? m.pos[1] < 0 : m.pos[1] > 0 }} expr={st.crowdExpr === "shock" ? "shock" : "neutral"} pos={[m.pos[0], 1.02, m.pos[1]]} bob={Math.sin(t * 1.6 + i * 1.3) * 0.006} />
      ))}
      {heroCards}
      {iveyCards}
      {board}
      <Chips k={Math.max(0, 300 - st.heroBet)} pos={[0.45, FELT, 0.62]} />
      <Chips k={Math.max(0, 300 - st.iveyBet)} pos={[-0.45, FELT, -0.62]} />
      <Chips k={st.heroBet} pos={heroBet} />
      <Chips k={st.iveyBet} pos={iveyBet} />
      <Chips k={st.pot} pos={[0.55, FELT, -0.12]} />
      <Glow color="#ffd49a" size={2.6} amount={0.18} position={[0, 1.6, 0]} />

      {/* rope line + rail spectators (behind Ivey) */}
      <Rope from={[-2.6, -2.0]} to={[-0.9, -2.2]} />
      <Rope from={[-0.9, -2.2]} to={[0.9, -2.2]} />
      <Rope from={[0.9, -2.2]} to={[2.6, -2.0]} />
      {[-1.6, -0.32, 0.32, 1.6].map((x, i) => (
        <Person
          key={i}
          look={{ ...randomLook(90 + i), back: reverse }}
          expr={(st.crowdExpr === "shock" ? "shock" : "neutral") as Expr}
          pos={[x, 1.38 + (st.crowdExpr === "shock" ? Math.abs(Math.sin(t * 8 + i)) * crowdHop : 0), -2.6]}
          h={0.9}
          blur={st.shot === "crowd" ? 0 : 1}
          bob={Math.sin(t * 2 + i) * 0.01}
        />
      ))}
    </>
  );
};
