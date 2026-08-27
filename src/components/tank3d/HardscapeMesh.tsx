import { useMemo } from "react";
import type { Hardscape } from "@/lib/types";
import { hardscapeColour, hashRange } from "./palette";

interface HardscapeClumpProps {
  item: Hardscape;
  quantity: number;
  interior: { x: number; y: number; z: number; substrateY: number };
  /** Override the Y at which the clump sits (defaults to interior.substrateY). */
  groundY?: number;
}

export function HardscapeClump({ item, quantity, interior, groundY }: HardscapeClumpProps) {
  const colour = hardscapeColour(item);
  const y = groundY ?? interior.substrateY;

  const nodes = useMemo(() => {
    const out: Array<{ pos: [number, number, number]; scale: number; rot: number }> = [];
    for (let i = 0; i < quantity; i++) {
      const x = hashRange(item.id, i * 4 + 1, -interior.x * 0.4, interior.x * 0.4);
      const z = hashRange(item.id, i * 4 + 2, -interior.z * 0.4, interior.z * 0.4);
      const s = hashRange(item.id, i * 4 + 3, 0.6, 1.1);
      const r = hashRange(item.id, i * 4 + 4, 0, Math.PI * 2);
      out.push({ pos: [x, y, z], scale: s, rot: r });
    }
    return out;
  }, [item.id, quantity, interior.x, interior.z, y]);

  // Substrate is drawn separately as a slab; skip meshes for substrate rows.
  // Returned after the hooks above so hook order stays stable across renders.
  if (item.type === "substrate") return null;

  return (
    <>
      {nodes.map((n, i) => (
        <group key={i} position={n.pos} rotation={[0, n.rot, 0]} scale={n.scale}>
          {item.type === "wood" && (
            <mesh rotation={[0, 0, Math.PI / 2.4]} position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.12, 0.18, 1.4, 8]} />
              <meshStandardMaterial color={colour} roughness={0.9} />
            </mesh>
          )}
          {item.type === "leaf_litter" && (
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.55, 12]} />
              <meshStandardMaterial color={colour} roughness={1} />
            </mesh>
          )}
          {item.type === "rock" && (
            <mesh position={[0, 0.3, 0]} scale={[0.75, 0.5, 0.6]}>
              <dodecahedronGeometry args={[0.7, 0]} />
              <meshStandardMaterial color={colour} roughness={0.9} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}
