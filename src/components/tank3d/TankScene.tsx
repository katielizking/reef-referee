import { useMemo, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { TankState } from "@/lib/types";
import { FishGroup } from "./FishMesh";
import { PlantClump } from "./PlantMesh";
import { HardscapeClump } from "./HardscapeMesh";
import { EquipmentMesh } from "./EquipmentMesh";
import { DragGroup } from "./DragGroup";
import { substrateColour } from "./palette";
import { useEditorStore } from "./editorStore";
import {
  getPlacement,
  setPlacement,
  type PlacementKind,
  type PlacementOverride,
} from "./placements";

const CM_PER_UNIT = 10;

interface Props {
  state: TankState;
  setState?: (updater: (s: TankState) => TankState) => void;
  commit?: () => void;
  onRemoveSpecies?: (speciesId: string) => void;
  interactive?: boolean;
}

export default function TankScene({
  state,
  setState,
  commit,
  interactive = true,
}: Props) {
  const select = useEditorStore((s) => s.select);
  const selected = useEditorStore((s) => s.selected);

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

  // Clear selection when it points at a deleted row.
  useEffect(() => {
    if (!selected) return;
    const exists =
      (selected.kind === "fish" && state.species.some((r) => r.species.id === selected.refId)) ||
      (selected.kind === "plant" && state.plants.some((r) => r.plant.id === selected.refId)) ||
      (selected.kind === "hardscape" &&
        state.hardscape.some((r) => r.hardscape.id === selected.refId)) ||
      (selected.kind === "equipment" && !!state.filter);
    if (!exists) select(null);
  }, [selected, state.species, state.plants, state.hardscape, state.filter, select]);

  function onChangePlacement(next: PlacementOverride) {
    if (!setState) return;
    setState((s) => ({ ...s, overrides: setPlacement(s.overrides ?? {}, next) }));
  }
  function doCommit() {
    commit?.();
  }
  function onSelect(kind: PlacementKind, refId: string) {
    select({ kind, refId });
  }

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-3xl border bg-gradient-to-b from-[#e8f4f6] to-[#c9e5eb]">
      <Canvas
        shadows={false}
        dpr={[1, 1.75]}
        camera={{ position: [camDistance * 0.7, camDistance * 0.35, camDistance * 0.9], fov: 40 }}
        frameloop={hasFish ? "always" : "demand"}
        onPointerMissed={() => select(null)}
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
        {state.hardscape.map(({ hardscape, quantity }) => {
          if (hardscape.type === "substrate") return null;
          const placement = getPlacement(state.overrides, "hardscape", hardscape.id, interior);
          const isSel = selected?.kind === "hardscape" && selected?.refId === hardscape.id;
          return (
            <DragGroup
              key={hardscape.id}
              placement={placement}
              interior={interior}
              selected={isSel}
              onSelect={() => onSelect("hardscape", hardscape.id)}
              onChange={onChangePlacement}
              onCommit={doCommit}
              interactive={interactive}
            >
              <group scale={placement.scale}>
                <HardscapeClump
                  item={hardscape}
                  quantity={quantity}
                  interior={interior}
                  groundY={0}
                />
              </group>
            </DragGroup>
          );
        })}

        {/* Plants */}
        {state.plants.map(({ plant, quantity }) => {
          const placement = getPlacement(state.overrides, "plant", plant.id, interior);
          const isSel = selected?.kind === "plant" && selected?.refId === plant.id;
          return (
            <DragGroup
              key={plant.id}
              placement={placement}
              interior={interior}
              selected={isSel}
              onSelect={() => onSelect("plant", plant.id)}
              onChange={onChangePlacement}
              onCommit={doCommit}
              interactive={interactive}
            >
              <group scale={placement.scale}>
                <PlantClump
                  plant={plant}
                  quantity={quantity}
                  interior={interior}
                  groundY={0}
                />
              </group>
            </DragGroup>
          );
        })}

        {/* Fish */}
        {state.species.map(({ species, quantity }) => {
          const placement = getPlacement(state.overrides, "fish", species.id, interior);
          const isSel = selected?.kind === "fish" && selected?.refId === species.id;
          const hasOverride = !!state.overrides?.[`fish:${species.id}`];
          return (
            <DragGroup
              key={species.id}
              placement={placement}
              interior={interior}
              selected={isSel}
              onSelect={() => onSelect("fish", species.id)}
              onChange={onChangePlacement}
              onCommit={doCommit}
              interactive={interactive}
            >
              <FishGroup
                species={species}
                quantity={quantity}
                interior={interior}
                selected={isSel}
                onSelect={() => onSelect("fish", species.id)}
                centerY={hasOverride ? placement.anchor[1] : undefined}
              />
            </DragGroup>
          );
        })}

        {/* Equipment (filter) */}
        {state.filter && (() => {
          const placement = getPlacement(state.overrides, "equipment", "filter", interior);
          const isSel = selected?.kind === "equipment" && selected?.refId === "filter";
          return (
            <DragGroup
              placement={placement}
              interior={interior}
              selected={isSel}
              onSelect={() => onSelect("equipment", "filter")}
              onChange={onChangePlacement}
              onCommit={doCommit}
              interactive={interactive}
            >
              <EquipmentMesh />
            </DragGroup>
          );
        })()}

        <CameraRig defaultDistance={camDistance} />
        <OrbitControls
          enablePan={false}
          minDistance={largest * 0.8}
          maxDistance={largest * 3}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.55}
          makeDefault
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <span className="rounded-full bg-card/85 px-3 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
          {hasFish
            ? "Tap fish · plants · hardscape to edit"
            : "Drag to rotate · scroll to zoom · click objects to edit"}
        </span>
      </div>

      {!hasFish && (
        <div className="pointer-events-none absolute inset-x-0 top-3 text-center text-xs text-muted-foreground">
          Drag to rotate · scroll to zoom · click objects to edit
        </div>
      )}
    </div>
  );
}
