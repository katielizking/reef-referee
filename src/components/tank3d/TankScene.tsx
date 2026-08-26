import { useMemo, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
import { detectDeviceTier } from "@/lib/fish3d/quality";
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
  const quality = useMemo(() => detectDeviceTier(), []);
  const richEffects = quality !== "low";

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
        shadows={richEffects}
        dpr={[1, quality === "high" ? 2 : 1.5]}
        camera={{ position: [camDistance * 0.7, camDistance * 0.35, camDistance * 0.9], fov: 40 }}
        frameloop={hasFish ? "always" : "demand"}
        onPointerMissed={() => select(null)}
      >
        <color attach="background" args={["#d7edf0"]} />
        <fog attach="fog" args={["#b9dce2", largest * 2.2, largest * 5.5]} />
        <hemisphereLight args={["#f7ffff", "#5d8790", 1.05]} />
        <ambientLight intensity={0.48} />
        <directionalLight
          castShadow={richEffects}
          position={[5, 9, 5]}
          intensity={1.35}
          color="#f5ffff"
          shadow-mapSize-width={quality === "high" ? 2048 : 1024}
          shadow-mapSize-height={quality === "high" ? 2048 : 1024}
        />
        <directionalLight position={[-4, 3, -3]} intensity={0.45} color="#69b7c9" />
        <pointLight
          position={[0, dims.y * 0.55, dims.z * 0.15]}
          intensity={0.65}
          color="#baf7ff"
          distance={largest * 2.5}
        />

        {/* Clear water volume plus a reflective animated surface. */}
        <mesh>
          <boxGeometry args={[dims.x, dims.y, dims.z]} />
          <meshPhysicalMaterial
            color="#63b6c8"
            transparent
            opacity={0.075}
            roughness={0.12}
            transmission={0.2}
            depthWrite={false}
          />
        </mesh>
        <WaterSurface dims={dims} reduced={!richEffects} />

        {/* Glass edges */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(dims.x, dims.y, dims.z)]} />
          <lineBasicMaterial color="#4a7683" transparent opacity={0.8} />
        </lineSegments>

        {/* Substrate slab with a lightweight granular surface. */}
        <mesh position={[0, -dims.y / 2 + substrateHeight / 2, 0]} receiveShadow>
          <boxGeometry args={[dims.x - 0.02, substrateHeight, dims.z - 0.02]} />
          <meshStandardMaterial color={subColour} roughness={0.96} />
        </mesh>
        <SubstrateGrains
          dims={dims}
          y={-dims.y / 2 + substrateHeight + 0.012}
          colour={subColour}
          count={quality === "high" ? 180 : quality === "medium" ? 90 : 40}
        />
        {richEffects && (
          <BubbleColumn
            dims={dims}
            count={quality === "high" ? 28 : 14}
          />
        )}

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
    </div>
  );
}

function WaterSurface({
  dims,
  reduced,
}: {
  dims: { x: number; y: number; z: number };
  reduced: boolean;
}) {
  const surface = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!surface.current || reduced) return;
    const t = clock.getElapsedTime();
    surface.current.position.y = dims.y / 2 - 0.035 + Math.sin(t * 0.65) * 0.012;
    surface.current.rotation.z = Math.sin(t * 0.32) * 0.008;
  });

  return (
    <mesh
      ref={surface}
      position={[0, dims.y / 2 - 0.035, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={3}
    >
      <planeGeometry args={[dims.x * 0.995, dims.z * 0.995, 1, 1]} />
      <meshPhysicalMaterial
        color="#bceef4"
        transparent
        opacity={0.32}
        roughness={0.08}
        metalness={0.05}
        transmission={0.35}
        clearcoat={1}
        clearcoatRoughness={0.12}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function SubstrateGrains({
  dims,
  y,
  colour,
  count,
}: {
  dims: { x: number; y: number; z: number };
  y: number;
  colour: string;
  count: number;
}) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const seed = Math.sin((i + 1) * 91.173) * 43758.5453;
      const seed2 = Math.sin((i + 1) * 47.731) * 12741.371;
      positions[i * 3] = (seed - Math.floor(seed) - 0.5) * dims.x * 0.94;
      positions[i * 3 + 1] = y + ((i % 5) / 5) * 0.025;
      positions[i * 3 + 2] = (seed2 - Math.floor(seed2) - 0.5) * dims.z * 0.94;
    }
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return next;
  }, [count, dims.x, dims.z, y]);

  const grainColour = useMemo(
    () => new THREE.Color(colour).offsetHSL(0, -0.08, 0.14),
    [colour],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        color={grainColour}
        size={0.045}
        sizeAttenuation
        transparent
        opacity={0.7}
      />
    </points>
  );
}

function BubbleColumn({
  dims,
  count,
}: {
  dims: { x: number; y: number; z: number };
  count: number;
}) {
  const points = useRef<THREE.Points>(null);
  const speeds = useMemo(
    () => Float32Array.from({ length: count }, (_, i) => 0.16 + (i % 7) * 0.025),
    [count],
  );
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = i * 2.39996;
      const radius = 0.08 + (i % 5) * 0.025;
      positions[i * 3] = dims.x * 0.36 + Math.cos(angle) * radius;
      positions[i * 3 + 1] = -dims.y * 0.42 + ((i * 0.618) % 1) * dims.y * 0.84;
      positions[i * 3 + 2] = -dims.z * 0.35 + Math.sin(angle) * radius;
    }
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return next;
  }, [count, dims.x, dims.y, dims.z]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const attribute = points.current?.geometry.getAttribute("position");
    if (!(attribute instanceof THREE.BufferAttribute)) return;
    for (let i = 0; i < count; i++) {
      const index = i * 3 + 1;
      attribute.array[index] += speeds[i] * delta;
      if (attribute.array[index] > dims.y * 0.46) {
        attribute.array[index] = -dims.y * 0.44;
      }
    }
    attribute.needsUpdate = true;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color="#efffff"
        size={0.075}
        sizeAttenuation
        transparent
        opacity={0.72}
        depthWrite={false}
      />
    </points>
  );
}

function CameraRig({ defaultDistance }: { defaultDistance: number }) {
  const { camera, controls } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera;
    controls: OrbitControlsImpl | null;
  };
  const preset = useEditorStore((s) => s.cameraPreset);
  const token = useEditorStore((s) => s.cameraToken);
  const lastToken = useRef(0);

  useEffect(() => {
    if (!preset || token === lastToken.current) return;
    lastToken.current = token;
    const d = defaultDistance;
    let pos: [number, number, number] = [d * 0.7, d * 0.35, d * 0.9];
    if (preset === "front") pos = [0, 0, d * 1.1];
    else if (preset === "iso") pos = [d * 0.7, d * 0.5, d * 0.9];
    else if (preset === "top") pos = [0, d * 1.2, 0.001];
    camera.position.set(...pos);
    camera.lookAt(0, 0, 0);
    controls?.target.set(0, 0, 0);
    controls?.update();
  }, [preset, token, defaultDistance, camera, controls]);

  return null;
}

