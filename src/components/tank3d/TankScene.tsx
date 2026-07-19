import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { TankState } from "@/lib/types";
import { FishGroup } from "./FishMesh";
import { PlantClump } from "./PlantMesh";
import { HardscapeClump } from "./HardscapeMesh";
import { substrateColour } from "./palette";

const CM_PER_UNIT = 10;

interface Props {
  state: TankState;
  onRemoveSpecies?: (speciesId: string) => void;
  interactive?: boolean;
}

export default function TankScene({ state, onRemoveSpecies, interactive = true }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const dims = useMemo(() => {
    const x = Math.max(state.length_cm, 20) / CM_PER_UNIT;
    const y = Math.max(state.height_cm, 20) / CM_PER_UNIT;
    const z = Math.max(state.width_cm, 20) / CM_PER_UNIT;
    return { x, y, z };
  }, [state.length_cm, state.width_cm, state.height_cm]);

  const substrateHeight = Math.min(0.4, dims.y * 0.15);
  const substrateY = -dims.y / 2 + substrateHeight;
  const interior = { x: dims.x, y: dims.y, z: dims.z, substrateY };

  const largest = Math.max(dims.x, dims.y, dims.z);
  const camDistance = largest * 1.6;
  const subColour = substrateColour(state);

  const hasFish = state.species.length > 0;
  const selectedRow = selected ? state.species.find((s) => s.species.id === selected) : null;

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-3xl border bg-gradient-to-b from-[#e8f4f6] to-[#c9e5eb]">
      <Canvas
        shadows={false}
        dpr={[1, 1.75]}
        camera={{ position: [camDistance * 0.7, camDistance * 0.35, camDistance * 0.9], fov: 40 }}
        frameloop={hasFish ? "always" : "demand"}
        onPointerMissed={() => setSelected(null)}
      >
        <color attach="background" args={["#dcefef"]} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[5, 8, 4]} intensity={0.9} />
        <directionalLight position={[-4, 3, -3]} intensity={0.35} color="#a7d8e2" />

        {/* Water tint */}
        <mesh>
          <boxGeometry args={[dims.x, dims.y, dims.z]} />
          <meshStandardMaterial color="#8fcadb" transparent opacity={0.14} depthWrite={false} />
        </mesh>

        {/* Glass edges */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(dims.x, dims.y, dims.z)]} />
          <lineBasicMaterial color="#4a7683" transparent opacity={0.8} />
        </lineSegments>

        {/* Substrate slab */}
        <mesh position={[0, -dims.y / 2 + substrateHeight / 2, 0]} receiveShadow>
          <boxGeometry args={[dims.x - 0.02, substrateHeight, dims.z - 0.02]} />
          <meshStandardMaterial color={subColour} roughness={1} />
        </mesh>

        {/* Hardscape */}
        {state.hardscape.map(({ hardscape, quantity }) => (
          <HardscapeClump key={hardscape.id} item={hardscape} quantity={quantity} interior={interior} />
        ))}

        {/* Plants */}
        {state.plants.map(({ plant, quantity }) => (
          <PlantClump key={plant.id} plant={plant} quantity={quantity} interior={interior} />
        ))}

        {/* Fish */}
        {state.species.map(({ species, quantity }) => (
          <FishGroup
            key={species.id}
            species={species}
            quantity={quantity}
            interior={interior}
            selected={selected === species.id}
            onSelect={() => interactive && setSelected(species.id)}
          />
        ))}

        <OrbitControls
          enablePan={false}
          minDistance={largest * 0.8}
          maxDistance={largest * 3}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.55}
        />
      </Canvas>

      {interactive && selectedRow && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 rounded-2xl border bg-card/95 px-3 py-2 shadow-lg backdrop-blur sm:right-auto sm:max-w-sm">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {selectedRow.species.common_name} × {selectedRow.quantity}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {selectedRow.species.scientific_name}
            </p>
          </div>
          {onRemoveSpecies && (
            <button
              type="button"
              onClick={() => {
                onRemoveSpecies(selectedRow.species.id);
                setSelected(null);
              }}
              className="rounded-lg border px-2.5 py-1 text-xs font-semibold text-coral hover:bg-coral/10"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {!hasFish && (
        <div className="pointer-events-none absolute inset-x-0 top-3 text-center text-xs text-muted-foreground">
          Drag to rotate · scroll to zoom
        </div>
      )}
    </div>
  );
}
