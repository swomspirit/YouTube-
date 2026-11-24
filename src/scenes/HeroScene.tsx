import { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Starfield } from "../components/Starfield";

/**
 * IMPORTANT: In Remotion, never animate with r3f's useFrame() or clocks.
 * Derive everything from useCurrentFrame() so every render is deterministic
 * and frames can be rendered in parallel / out of order.
 */
export const HeroScene: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const camera = useThree((s) => s.camera);
  const t = frame / fps; // seconds

  // Pop-in of the main object
  const entrance = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });

  // Slow camera dolly + orbit
  const orbit = interpolate(frame, [0, durationInFrames], [0, Math.PI * 0.6]);
  // Pull the camera back for vertical (Shorts) so the subject still fits.
  const aspectFix = height > width ? 1.7 : 1;
  const distance = interpolate(frame, [0, durationInFrames], [9, 6.5]) * aspectFix;
  camera.position.set(Math.sin(orbit) * distance, 1 + Math.sin(t * 0.5) * 0.5, Math.cos(orbit) * distance);
  camera.lookAt(0, 0, 0);

  const orbiters = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        radius: 2.6 + (i % 3) * 0.5,
        speed: 0.4 + (i % 4) * 0.15,
        offset: (i / 8) * Math.PI * 2,
        tilt: ((i % 3) - 1) * 0.5,
        size: 0.12 + (i % 2) * 0.1,
        color: new THREE.Color().setHSL(0.6 + i * 0.04, 0.8, 0.6),
      })),
    [],
  );

  return (
    <>
      <color attach="background" args={["#05010f"]} />
      <fog attach="fog" args={["#05010f", 8, 25]} />

      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={2} />
      <pointLight position={[-4, -2, 3]} intensity={30} color={accentColor} />

      {/* Main hero object */}
      <mesh scale={entrance * 1.2} rotation={[t * 0.4, t * 0.6, 0]}>
        <torusKnotGeometry args={[1, 0.32, 256, 48]} />
        <meshStandardMaterial color={accentColor} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Orbiting spheres */}
      {orbiters.map((o, i) => {
        const a = o.offset + t * o.speed;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * o.radius, Math.sin(a) * o.radius * o.tilt, Math.sin(a) * o.radius]}
            scale={entrance}
          >
            <sphereGeometry args={[o.size, 32, 32]} />
            <meshStandardMaterial color={o.color} emissive={o.color} emissiveIntensity={0.6} />
          </mesh>
        );
      })}

      {/* Background stars (seeded, rotated by frame) */}
      <group rotation={[0, t * 0.03, 0]}>
        <Starfield />
      </group>
    </>
  );
};
