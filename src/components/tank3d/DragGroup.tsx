import { useRef, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import {
  clampAnchor,
  groupFootprintRadius,
  snapEquipmentToBack,
  type Interior,
  type PlacementKind,
  type PlacementOverride,
} from "./placements";

interface DragGroupProps {
  placement: PlacementOverride;
  interior: Interior;
  selected: boolean;
  onSelect: () => void;
  onChange: (next: PlacementOverride) => void;
  onCommit: () => void;
  interactive: boolean;
  children: ReactNode;
}

/**
 * Wraps a scene group with click-to-select and drag-to-move.
 * Fish/plant/hardscape drag on the XZ plane at the group's current Y.
 * Equipment stays snapped to the back glass and drags along X only.
 */
export function DragGroup({
  placement,
  interior,
  selected,
  onSelect,
  onChange,
  onCommit,
  interactive,
  children,
}: DragGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { gl, camera } = useThree();
  const draggingRef = useRef(false);
  const grabOffsetRef = useRef(new THREE.Vector3());
  const plane = useMemo(() => new THREE.Plane(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);

  function pointerToNDC(event: PointerEvent) {
    const rect = gl.domElement.getBoundingClientRect();
    ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function handlePointerDown(e: ThreeEvent<PointerEvent>) {
    if (!interactive) return;
    e.stopPropagation();
    onSelect();
    // Set up plane at the group's Y for XZ drag, or at Z=back for equipment.
    if (placement.kind === "equipment") {
      plane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, placement.anchor[2]),
      );
    } else {
      plane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, placement.anchor[1], 0),
      );
    }
    pointerToNDC(e.nativeEvent);
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) {
      grabOffsetRef.current.set(
        placement.anchor[0] - hit.x,
        placement.anchor[1] - hit.y,
        placement.anchor[2] - hit.z,
      );
    } else {
      grabOffsetRef.current.set(0, 0, 0);
    }
    draggingRef.current = true;
    (e.target as Element)?.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: ThreeEvent<PointerEvent>) {
    if (!draggingRef.current) return;
    e.stopPropagation();
    pointerToNDC(e.nativeEvent);
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return;
    const raw: [number, number, number] = [
      hit.x + grabOffsetRef.current.x,
      placement.kind === "equipment"
        ? hit.y + grabOffsetRef.current.y
        : placement.anchor[1],
      hit.z + grabOffsetRef.current.z,
    ];
    const radius = groupFootprintRadius(placement.kind, interior, placement.scale);
    let clamped = clampAnchor(placement.kind, raw, interior, radius);
    if (placement.kind === "equipment") {
      clamped = snapEquipmentToBack(clamped, interior);
    }
    onChange({ ...placement, anchor: clamped });
  }

  function handlePointerUp(e: ThreeEvent<PointerEvent>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    (e.target as Element)?.releasePointerCapture?.(e.pointerId);
    onCommit();
  }

  return (
    <group
      ref={groupRef}
      position={placement.anchor}
      rotation={[0, placement.rotY, 0]}
      onPointerDown={interactive ? handlePointerDown : undefined}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerUp={interactive ? handlePointerUp : undefined}
      onPointerCancel={interactive ? handlePointerUp : undefined}
    >
      {children}
      {selected && <SelectionRing />}
    </group>
  );
}

function SelectionRing() {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.55, 0.68, 32]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.85} toneMapped={false} />
    </mesh>
  );
}
