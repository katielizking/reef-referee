import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Plant } from "@/lib/types";
import * as THREE from "three";
import { hashRange } from "./palette";
import { useReducedMotion } from "./useReducedMotion";

interface PlantClumpProps {
  plant: Plant;
  quantity: number;
  interior: { x: number; y: number; z: number; substrateY: number };
}

export function PlantClump({ plant, quantity, interior }: PlantClumpProps) {
  const reduced = useReducedMotion();
  const positions = useMemo(() => {
    const out: Array<{ pos: [number, number, number]; scale: number; phase: number }> = [];
    for (let i = 0; i < quantity; i++) {
      const x = hashRange(plant.id, i * 5 + 1, -interior.x * 0.42, interior.x * 0.42);
      const z = hashRange(plant.id, i * 5 + 2, -interior.z * 0.42, interior.z * 0.42);
      const s = hashRange(plant.id, i * 5 + 3, 0.55, 0.85);
      out.push({ pos: [x, interior.substrateY, z], scale: s, phase: hashRange(plant.id, i * 5 + 4, 0, Math.PI * 2) });
    }
    return out;
  }, [plant.id, quantity, interior.x, interior.z, interior.substrateY]);

  return (
    <>
      {positions.map((p, i) => (
        <PlantMesh key={i} pos={p.pos} scale={p.scale} phase={p.phase} reduced={reduced} />
      ))}
    </>
  );
}

function PlantMesh({ pos, scale, phase, reduced }: { pos: [number, number, number]; scale: number; phase: number; reduced: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || reduced) return;
    ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.7 + phase) * 0.04;
  });
  const height = 1.2 * scale;
  return (
    <group ref={ref} position={pos} scale={scale}>
      {[0, 0.22, -0.22].map((x, i) => (
        <group key={x} position={[x, 0, i === 1 ? 0.08 : 0]}>
          <mesh position={[0, height / 2, 0]}>
            <cylinderGeometry args={[0.035, 0.055, height, 8]} />
            <meshStandardMaterial color="#347A48" />
          </mesh>
          <mesh position={[0.14, height * 0.55, 0]} rotation={[0, 0, -0.75]} scale={[0.11, 0.32, 0.06]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#4FA060" />
          </mesh>
          <mesh position={[-0.13, height * 0.78, 0]} rotation={[0, 0, 0.8]} scale={[0.11, 0.3, 0.06]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#4FA060" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
