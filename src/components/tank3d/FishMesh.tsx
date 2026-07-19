import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Species } from "@/lib/types";
import { hash01, hashRange, speciesColour } from "./palette";
import { useReducedMotion } from "./useReducedMotion";

interface FishGroupProps {
  species: Species;
  quantity: number;
  /** Tank interior in scene units. */
  interior: { x: number; y: number; z: number; substrateY: number };
  selected: boolean;
  onSelect: () => void;
}

const CM_PER_UNIT = 10;

function zoneY(zone: "top" | "mid" | "bottom", interior: FishGroupProps["interior"]): number {
  const swimTop = interior.substrateY + (interior.y - (interior.substrateY + interior.y / 2)) * 0; // placeholder
  const bottom = interior.substrateY;
  const top = interior.y / 2 - 0.15;
  const usable = top - bottom;
  if (zone === "top") return bottom + usable * 0.78;
  if (zone === "bottom") return bottom + usable * 0.18;
  void swimTop;
  return bottom + usable * 0.5;
}

interface FishInstance {
  offset: [number, number, number];
  phase: number;
  amp: number;
}

export function FishGroup({ species, quantity, interior, selected, onSelect }: FishGroupProps) {
  const colour = useMemo(() => speciesColour(species), [species]);
  const reduced = useReducedMotion();

  // Fish length in units, clamped so a monster doesn't blow past the glass.
  const rawLen = species.adult_size_cm / CM_PER_UNIT;
  const maxLen = Math.min(interior.x, interior.y, interior.z) * 0.4;
  const fishLen = Math.max(0.12, Math.min(rawLen, maxLen));

  const instances = useMemo<FishInstance[]>(() => {
    const yCentre = zoneY(species.swim_zone, interior);
    // School? cluster them; else spread across the tank width.
    const school = species.is_schooling && quantity > 1;
    const out: FishInstance[] = [];
    // Cluster radius scales with the group size.
    const clusterR = Math.min(interior.x, interior.z) * (school ? 0.35 : 0.45);
    for (let i = 0; i < quantity; i++) {
      const rx = hashRange(species.id, i * 3 + 1, -clusterR, clusterR);
      const rz = hashRange(species.id, i * 3 + 2, -interior.z * 0.4, interior.z * 0.4);
      const ry = hashRange(species.id, i * 3 + 3, -0.25, 0.25);
      out.push({
        offset: [rx, yCentre + ry, rz],
        phase: hash01(species.id, i * 7) * Math.PI * 2,
        amp: school ? 0.25 : 0.55,
      });
    }
    return out;
  }, [species.id, species.swim_zone, species.is_schooling, quantity, interior.x, interior.y, interior.z, interior.substrateY]);

  return (
    <group>
      {instances.map((inst, idx) => (
        <FishMesh
          key={idx}
          basePosition={inst.offset}
          phase={inst.phase}
          amp={inst.amp}
          colour={colour}
          length={fishLen}
          selected={selected}
          reduced={reduced}
          bounds={interior}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

interface FishMeshProps {
  basePosition: [number, number, number];
  phase: number;
  amp: number;
  colour: string;
  length: number;
  selected: boolean;
  reduced: boolean;
  bounds: FishGroupProps["interior"];
  onSelect: () => void;
}

function FishMesh({ basePosition, phase, amp, colour, length, selected, reduced, bounds, onSelect }: FishMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, delta) => {
    const g = groupRef.current;
    if (!g) return;
    if (reduced) {
      g.position.set(basePosition[0], basePosition[1], basePosition[2]);
      return;
    }
    const t = clock.getElapsedTime();
    const hx = Math.sin(t * 0.55 + phase) * amp;
    const hz = Math.cos(t * 0.35 + phase) * amp * 0.5;
    const hy = Math.sin(t * 0.9 + phase) * 0.05;

    const nx = THREE.MathUtils.clamp(basePosition[0] + hx, -bounds.x / 2 + 0.2, bounds.x / 2 - 0.2);
    const nz = THREE.MathUtils.clamp(basePosition[2] + hz, -bounds.z / 2 + 0.2, bounds.z / 2 - 0.2);
    const ny = THREE.MathUtils.clamp(basePosition[1] + hy, bounds.substrateY + 0.15, bounds.y / 2 - 0.15);

    target.set(nx, ny, nz);
    g.position.lerp(target, Math.min(delta * 2, 1));

    const goingRight = Math.cos(t * 0.55 + phase) >= 0;
    g.rotation.y = goingRight ? 0 : Math.PI;
  });

  // Fish is modelled ~1 unit long, scaled to `length`.
  return (
    <group
      ref={groupRef}
      position={basePosition}
      scale={length}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <mesh scale={[0.75, 0.38, 0.3]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={colour} roughness={0.45} />
      </mesh>
      <mesh position={[-0.88, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.42, 0.42, 0.25]}>
        <coneGeometry args={[0.65, 0.85, 3]} />
        <meshStandardMaterial color={colour} roughness={0.5} />
      </mesh>
      <mesh position={[-0.08, 0.37, 0]} rotation={[0, 0, -0.15]} scale={[0.35, 0.28, 0.08]}>
        <coneGeometry args={[0.55, 0.8, 3]} />
        <meshStandardMaterial color={colour} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0.55, 0.12, 0.25]} scale={0.08}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#12232E" />
      </mesh>
      <mesh position={[0.55, 0.12, -0.25]} scale={0.08}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#12232E" />
      </mesh>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]}>
          <ringGeometry args={[0.62, 0.78, 32]} />
          <meshBasicMaterial color="#B8E84A" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
