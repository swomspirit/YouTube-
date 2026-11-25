import { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Card, ChipStacks, FACE_UP, FELT, Glow } from "../poker/Table3D";
import { characterTexture, randomLook, type Expr, type Look } from "./chars";

/* ---------------- textures ---------------- */
let carpetTex: THREE.Texture | null = null;
export const carpet = () => {
  if (carpetTex) return carpetTex;
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#5a1a1c";
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(214,150,90,0.35)";
  g.lineWidth = 5;
  for (const [x, y] of [[128, 128], [384, 384], [384, 128], [128, 384]]) {
    g.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.6) * 60, y + Math.sin(a + 0.6) * 60, x + Math.cos(a) * 70, y + Math.sin(a) * 70);
    }
    g.stroke();
    g.beginPath();
    g.arc(x, y, 18, 0, Math.PI * 2);
    g.stroke();
  }
  carpetTex = new THREE.CanvasTexture(c);
  carpetTex.wrapS = carpetTex.wrapT = THREE.RepeatWrapping;
  carpetTex.repeat.set(10, 10);
  carpetTex.colorSpace = THREE.SRGBColorSpace;
  return carpetTex;
};
const signTex = new Map<string, THREE.Texture>();
export const sign = (text: string) => {
  const hit = signTex.get(text);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 96;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1a120c";
  g.fillRect(0, 0, 512, 96);
  g.fillStyle = "#e8cf98";
  g.font = "bold 54px Georgia, serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 256, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  signTex.set(text, tex);
  return tex;
};

/* ---------------- props ---------------- */
export const Table: React.FC<{ pos: [number, number, number]; s?: number }> = ({ pos, s = 1 }) => (
  <group position={pos} scale={s}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FELT, 0]} scale={[1.5, 1, 1]}>
      <circleGeometry args={[0.9, 64]} />
      <meshStandardMaterial color="#7a1f25" roughness={0.95} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FELT + 0.001, 0]} scale={[1.5, 1, 1]}>
      <ringGeometry args={[0.55, 0.565, 64]} />
      <meshStandardMaterial color="#d9b97a" transparent opacity={0.4} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FELT + 0.02, 0]} scale={[1.5, 1, 1]}>
      <torusGeometry args={[0.93, 0.06, 14, 80]} />
      <meshStandardMaterial color="#3a2217" roughness={0.4} />
    </mesh>
    <mesh position={[0, FELT / 2, 0]}>
      <cylinderGeometry args={[0.3, 0.45, FELT - 0.02, 20]} />
      <meshStandardMaterial color="#2a1810" roughness={0.6} />
    </mesh>
  </group>
);

export const Lamp: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <mesh>
      <boxGeometry args={[1.6, 0.22, 0.9]} />
      <meshStandardMaterial color="#4a2a1c" roughness={0.5} />
    </mesh>
    <mesh position={[0, -0.115, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.45, 0.75]} />
      <meshBasicMaterial color="#ffe2aa" toneMapped={false} />
    </mesh>
    {[-0.7, 0.7].map((x) => (
      <mesh key={x} position={[x, 0.9, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1.6, 6]} />
        <meshStandardMaterial color="#2a1a12" />
      </mesh>
    ))}
    <Glow color="#ffd49a" size={2.4} amount={0.35} position={[0, -0.3, 0]} />
  </group>
);

export const Rope: React.FC<{ from: [number, number]; to: [number, number]; z?: number }> = ({ from, to }) => {
  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const k = i / 20;
      pts.push(new THREE.Vector3(from[0] + (to[0] - from[0]) * k, 0.92 - Math.sin(Math.PI * k) * 0.14, from[1] + (to[1] - from[1]) * k));
    }
    return new THREE.CatmullRomCurve3(pts);
  }, [from, to]);
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 30, 0.018, 8, false]} />
        <meshStandardMaterial color="#8a1a22" roughness={0.6} />
      </mesh>
      {[from, to].map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          <mesh position={[0, 0.48, 0]}>
            <cylinderGeometry args={[0.025, 0.035, 0.96, 12]} />
            <meshStandardMaterial color="#c9a24a" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.98, 0]}>
            <sphereGeometry args={[0.045, 12, 10]} />
            <meshStandardMaterial color="#d8b25a" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.04, 16]} />
            <meshStandardMaterial color="#c9a24a" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** A 2D character standing in the 3D world (camera-facing sprite). */
export const Person: React.FC<{ look: Look; expr?: Expr; pos: [number, number, number]; h?: number; blur?: number; bob?: number }> = ({ look, expr = "neutral", pos, h = 0.78, blur = 0, bob = 0 }) => (
  <sprite position={[pos[0], pos[1] + bob, pos[2]]} scale={[h * 0.8, h, 1]}>
    <spriteMaterial map={characterTexture(look, expr, blur)} transparent />
  </sprite>
);

/* ---------------- main-table cast ---------------- */
export const HERO_LOOK: Look = { skin: "#f3d2b3", shirt: "#d65a8a", hair: "bob", hairColor: "#7a4a2a", back: true };
export const IVEY_LOOK: Look = { skin: "#8d5a3c", shirt: "#3a3f4c", hair: "short", hairColor: "#1b1b20", hat: "beanie", hatColor: "#1d1d24", glasses: "shades" };

export const Casino: React.FC<{ t: number; iveyExpr: Expr; cam: { pos: [number, number, number]; target: [number, number, number]; fov: number } }> = ({ t, iveyExpr, cam }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(...cam.pos);
  camera.lookAt(new THREE.Vector3(...cam.target));
  if (Math.abs(camera.fov - cam.fov) > 0.01) {
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
  }
  const bgTables = useMemo(
    () => [
      { p: [-3.2, 0, -3.2] as [number, number, number] },
      { p: [3.4, 0, -3.6] as [number, number, number] },
      { p: [-0.2, 0, -6.2] as [number, number, number] },
      { p: [4.2, 0, -0.4] as [number, number, number] },
      { p: [-4.4, 0, 0.2] as [number, number, number] },
    ],
    [],
  );
  const seats = (cx: number, cz: number, n: number, rx: number, rz: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + 0.3;
      return [cx + Math.cos(a) * rx, cz + Math.sin(a) * rz] as [number, number];
    });

  // main table seats: Ivey across (back), hero in front (seen from behind), others around
  const mainSeats: { look: Look; pos: [number, number]; expr?: Expr }[] = [
    { look: IVEY_LOOK, pos: [0.15, -0.98], expr: iveyExpr },
    { look: randomLook(3), pos: [-1.05, -0.65] },
    { look: randomLook(7), pos: [1.2, -0.55] },
    { look: randomLook(11), pos: [-1.45, 0.25] },
    { look: { ...randomLook(15), back: true }, pos: [1.35, 0.55] },
    { look: HERO_LOOK, pos: [0.0, 1.0] },
  ];
  return (
    <>
      <color attach="background" args={["#1a0f0c"]} />
      <fog attach="fog" args={["#2a1612", 4, 11]} />
      <ambientLight intensity={0.55} color="#ffd9b8" />
      <spotLight position={[0, 3.2, 0]} angle={0.7} penumbra={0.7} intensity={14} color="#ffe2b0" distance={7} />
      <pointLight position={[0, 2.5, 3]} intensity={3} color="#ffcf9a" distance={8} />
      {/* floor + walls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial map={carpet()} roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.5, -8]}>
        <planeGeometry args={[30, 6]} />
        <meshStandardMaterial color="#3a2418" roughness={0.9} />
      </mesh>
      {[-6, -2, 2, 6].map((x) => (
        <mesh key={x} position={[x, 2.5, -7.8]}>
          <boxGeometry args={[0.6, 5, 0.4]} />
          <meshStandardMaterial color="#6b4a2a" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[4, 2.4, -7.55]}>
        <planeGeometry args={[2.2, 0.42]} />
        <meshBasicMaterial map={sign("CASHIER")} toneMapped={false} />
      </mesh>
      <mesh position={[-4, 2.4, -7.55]}>
        <planeGeometry args={[2.6, 0.42]} />
        <meshBasicMaterial map={sign("REGISTRATION")} toneMapped={false} />
      </mesh>

      {/* background tables with seated players (slightly blurred = depth of field) */}
      {bgTables.map((tb, i) => (
        <group key={i}>
          <Table pos={tb.p} />
          <Lamp pos={[tb.p[0], 2.6, tb.p[2]]} />
          {seats(tb.p[0], tb.p[2], 6, 1.45, 0.95).map((s2, j) => (
            <Person key={j} look={{ ...randomLook(i * 13 + j + 40), back: j === 1 || j === 2 }} pos={[s2[0], 1.0, s2[1]]} blur={2.5} bob={Math.sin(t * 1.3 + i + j) * 0.01} />
          ))}
        </group>
      ))}

      {/* main table */}
      <Table pos={[0, 0, 0]} />
      <Lamp pos={[0, 2.75, 0]} />
      {mainSeats.map((m, i) => (
        <Person key={i} look={m.look} expr={m.expr} pos={[m.pos[0], 1.02, m.pos[1]]} bob={Math.sin(t * 1.6 + i * 1.3) * 0.006} />
      ))}
      {/* board + chips */}
      {["8c", "8d", "As", "7h", "9c"].map((c, i) => (
        <Card key={c} card={c} pos={[-0.36 + i * 0.18, FELT + 0.003, 0.05]} rotX={FACE_UP} scale={1.25} />
      ))}
      <group scale={1.6} position={[0, FELT * -0.6, 0]}>
        <ChipStacks amount={220} pos={[0.03, FELT, -0.17]} spread={0.05} />
        <ChipStacks amount={300} pos={[0.38, FELT, -0.36]} spread={0.05} />
        <ChipStacks amount={180} pos={[-0.32, FELT, 0.34]} spread={0.05} />
      </group>

      {/* rope line + rail spectators */}
      <Rope from={[-2.6, -2.0]} to={[-0.9, -2.2]} />
      <Rope from={[-0.9, -2.2]} to={[0.9, -2.2]} />
      <Rope from={[0.9, -2.2]} to={[2.6, -2.0]} />
      {[-1.9, -0.4, 0.6, 1.8].map((x, i) => (
        <Person key={i} look={randomLook(90 + i)} pos={[x, 1.35, -2.6]} h={0.85} blur={1} bob={Math.sin(t * 2 + i) * 0.01} />
      ))}
    </>
  );
};
