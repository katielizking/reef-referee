import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone as cloneSkinnedScene } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { FishMeshProps } from "../FishMesh";
import type { FishAnimationState, FishAssetDefinition } from "@/lib/fish3d/types";
import { computeRenderScale, forwardAxisRotationY } from "@/lib/fish3d/scaling";
import { useFishAnimationController } from "./FishAnimationController";
import type { Species } from "@/lib/types";

export interface GltfFishProps extends FishMeshProps {
  asset: FishAssetDefinition;
  modelUrl: string;
  species?: Species;
}

/**
 * Rigged GLB fish. Reuses the shared movement math via the same behaviour
 * profile input, but writes it onto a cloned skinned scene and drives the
 * cross-fading animation controller.
 *
 * IMPORTANT: this component does not run today — no species in the registry
 * has a resolvable model URL yet. `FishRenderer` transparently routes to
 * `ProceduralFish` until an approved GLB is uploaded and wired in.
 */
export function GltfFish({
  asset,
  modelUrl,
  basePosition,
  phase,
  behaviour,
  length,
  selected,
  reduced,
  bounds,
  instanceIndex,
  onSelect,
}: GltfFishProps) {
  const gltf = useGLTF(modelUrl);

  // SkeletonUtils.clone gives each instance its own bone hierarchy so the
  // AnimationMixer can pose them independently. Static geometry and textures
  // are still shared across all clones.
  const scene = useMemo(() => cloneSkinnedScene(gltf.scene), [gltf.scene]);

  // Measure the actual loaded bounding box rather than trusting the
  // exporter's declared units. The GLB ships in metres (4cm ≈ 0.04 model
  // units), so treating modelReferenceLengthCm as scene units directly
  // would render the fish 100× too small.
  const scale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const measured = Math.max(size.x, size.y, size.z);
    const targetSceneUnits = asset.adultLengthCm / 10; // CM_PER_UNIT = 10
    if (!Number.isFinite(measured) || measured <= 0) {
      return computeRenderScale({
        adultLengthCm: asset.adultLengthCm,
        modelReferenceLengthCm: asset.modelReferenceLengthCm,
      });
    }
    return targetSceneUnits / measured;
  }, [gltf.scene, asset.adultLengthCm, asset.modelReferenceLengthCm]);

  const rotationY = useMemo(
    () => forwardAxisRotationY(asset.orientation?.forwardAxis ?? "+x"),
    [asset.orientation?.forwardAxis],
  );

  const groupRef = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const controller = useFishAnimationController({
    root: scene,
    clips: gltf.animations ?? [],
    asset,
  });

  useEffect(() => {
    controller.setState("cruise");
  }, [controller]);

  useFrame(({ clock }, delta) => {
    const g = groupRef.current;
    if (!g) return;
    if (reduced) {
      g.position.set(basePosition[0], basePosition[1], basePosition[2]);
      g.rotation.set(0, rotationY, 0);
      controller.freeze();
      return;
    }

    const t = clock.getElapsedTime();
    const groupPhase = ((asset.speciesId.charCodeAt(0) * 13) % 100) / 100 * Math.PI * 2;
    const cohesion = behaviour.schoolingCohesion;
    const wander = behaviour.individualWander;

    const gT = t * behaviour.cruiseSpeed + groupPhase;
    const gx = Math.sin(gT * 0.6) * behaviour.rangeX * bounds.x * 0.5;
    const gz = Math.cos(gT * 0.42) * behaviour.rangeZ * bounds.z * 0.5;
    const gy = Math.sin(gT * 0.3) * behaviour.verticalRange * bounds.y * 0.5;

    const iT = t * behaviour.cruiseSpeed * (0.85 + (instanceIndex % 5) * 0.06) + phase;
    const ix = Math.sin(iT * 1.15) * behaviour.rangeX * bounds.x * 0.38 * wander;
    const iz = Math.cos(iT * 0.93) * behaviour.rangeZ * bounds.z * 0.38 * wander;
    const iy = Math.sin(iT * 1.3) * behaviour.verticalRange * bounds.y * 0.42 * wander;

    const burstCycle = Math.sin(t * 0.55 + phase * 2.7);
    const burst = burstCycle > 0.72 ? (burstCycle - 0.72) / 0.28 : 0;
    const speedMul = 1 + burst * behaviour.burstStrength * 1.5;
    const pauseCycle = (Math.sin(t * 0.24 + phase * 1.7) + 1) * 0.5;
    const pauseMul = 1 - pauseCycle * behaviour.pauseStrength * 0.85;

    const dx = (gx * cohesion + ix) * speedMul * pauseMul;
    const dz = (gz * cohesion + iz) * speedMul * pauseMul;
    const dy = gy * cohesion + iy;

    const modelHalf = length * 0.6;
    const nx = THREE.MathUtils.clamp(
      basePosition[0] + dx,
      -bounds.x / 2 + modelHalf,
      bounds.x / 2 - modelHalf,
    );
    const nz = THREE.MathUtils.clamp(
      basePosition[2] + dz,
      -bounds.z / 2 + modelHalf,
      bounds.z / 2 - modelHalf,
    );
    const ny = THREE.MathUtils.clamp(
      basePosition[1] + dy,
      bounds.substrateY + modelHalf,
      bounds.y / 2 - modelHalf,
    );

    target.set(nx, ny, nz);
    g.position.lerp(target, Math.min(delta * 2.25, 1));

    const vx = Math.cos(gT * 0.6) * behaviour.rangeX * bounds.x;
    const vz = -Math.sin(gT * 0.42) * behaviour.rangeZ * bounds.z;
    const desiredHeading = Math.atan2(-vz, vx) + rotationY;
    const headingDelta = Math.atan2(
      Math.sin(desiredHeading - g.rotation.y),
      Math.cos(desiredHeading - g.rotation.y),
    );
    g.rotation.y += headingDelta * Math.min(delta * behaviour.turnRate * 0.85, 1);

    // State selection — coarse mapping; refined once real clips are authored.
    let state: FishAnimationState = "cruise";
    if (burst > 0.6) state = "dart";
    else if (speedMul > 1.05) state = "fast";
    else if (pauseMul < 0.35) state = "hover";
    controller.setState(state);
    controller.tick(delta, speedMul * pauseMul);
  });

  return (
    <group
      ref={groupRef}
      position={basePosition}
      rotation={[0, rotationY, 0]}
      scale={scale}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <primitive object={scene} />
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
          <ringGeometry args={[0.48, 0.61, 36]} />
          <meshBasicMaterial color="#B8E84A" transparent opacity={0.9} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
