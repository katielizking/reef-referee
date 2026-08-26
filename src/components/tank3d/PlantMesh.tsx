import { Html } from "@react-three/drei";
import { useMemo } from "react";
import type { Plant } from "@/lib/types";
import { hashRange } from "./palette";

interface PlantClumpProps {
  plant: Plant;
  quantity: number;
  interior: { x: number; y: number; z: number; substrateY: number };
  groundY?: number;
}

/**
 * Honest placeholder for plants that do not yet have a verified,
 * species-specific visual asset. It intentionally reads as a schematic,
 * not as a botanical likeness.
 */
export function PlantClump({ plant, quantity, interior, groundY }: PlantClumpProps) {
  const y = groundY ?? interior.substrateY;
  const positions = useMemo(() => {
    const count = Math.min(Math.max(quantity, 1), 8);
    return Array.from({ length: count }, (_, index) => ({
      x: hashRange(plant.id, index * 5 + 1, -interior.x * 0.3, interior.x * 0.3),
      z: hashRange(plant.id, index * 5 + 2, -interior.z * 0.28, interior.z * 0.28),
      height: hashRange(plant.id, index * 5 + 3, 0.42, 0.82),
      lean: hashRange(plant.id, index * 5 + 4, -0.14, 0.14),
    }));
  }, [plant.id, quantity, interior.x, interior.z]);

  return (
    <group position={[0, y, 0]}>
      {positions.map((position, index) => (
        <group
          key={index}
          position={[position.x, 0, position.z]}
          rotation={[0, 0, position.lean]}
        >
          <mesh position={[0, position.height / 2, 0]}>
            <cylinderGeometry args={[0.012, 0.018, position.height, 6]} />
            <meshBasicMaterial color="#7fcdb0" transparent opacity={0.3} wireframe />
          </mesh>
          <mesh position={[0.06, position.height * 0.72, 0]} rotation={[0, 0, -0.72]}>
            <planeGeometry args={[0.18, 0.06]} />
            <meshBasicMaterial color="#9edac1" transparent opacity={0.24} wireframe />
          </mesh>
        </group>
      ))}
      <Html center position={[0, 0.92, 0]} distanceFactor={8} zIndexRange={[20, 0]}>
        <div className="pointer-events-none whitespace-nowrap rounded-full border border-white/70 bg-ink/80 px-2 py-1 font-display text-[9px] font-semibold text-white shadow-sm backdrop-blur">
          {plant.common_name} · model pending
        </div>
      </Html>
    </group>
  );
}
