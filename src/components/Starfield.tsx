import { useMemo } from "react";
import { random } from "remotion";

/**
 * Deterministic starfield. Uses Remotion's seeded random() so every render
 * process produces identical stars (Math.random() would flicker between
 * frames rendered in parallel tabs).
 */
export const Starfield: React.FC<{ count?: number; radius?: number; seed?: string }> = ({
  count = 3000,
  radius = 50,
  seed = "stars",
}) => {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = radius * (0.5 + random(`${seed}-r-${i}`) * 0.5);
      const theta = random(`${seed}-t-${i}`) * Math.PI * 2;
      const phi = Math.acos(2 * random(`${seed}-p-${i}`) - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count, radius, seed]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="white" sizeAttenuation fog={false} />
    </points>
  );
};
