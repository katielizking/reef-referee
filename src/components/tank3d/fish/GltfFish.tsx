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
  const { scale, localBbox } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const measured = Math.max(size.x, size.y, size.z);
    const targetSceneUnits = asset.adultLengthCm / 10; // CM_PER_UNIT = 10
    const s =
      !Number.isFinite(measured) || measured <= 0
        ? computeRenderScale({
            adultLengthCm: asset.adultLengthCm,
            modelReferenceLengthCm: asset.modelReferenceLengthCm,
          })
        : targetSceneUnits / measured;
    return {
      scale: s,
      localBbox: [
        Math.max(size.x, 0.02),
        Math.max(size.y, 0.01),
        Math.max(size.z, 0.01),
      ] as [number, number, number],
    };
  }, [gltf.scene, asset.adultLengthCm, asset.modelReferenceLengthCm]);

  const rotationY = useMemo(
    () => forwardAxisRotationY(asset.orientation?.forwardAxis ?? "+x"),
    [asset.orientation?.forwardAxis],
  );

  const groupRef = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const bettaRig = useMemo(() => {
    if (asset.commonName.toLowerCase() !== "betta") return null;
    const names = {
      tail: ["Bone.003_Armature", "Bone.004_Armature", "Bone.005_Armature"],
      leftPectoral: ["Bone.046_Armature", "Bone.048_Armature", "Bone.050_Armature"],
      rightPectoral: ["Bone.047_Armature", "Bone.049_Armature", "Bone.051_Armature"],
    };
    const resolve = (name: string) => {
      const bone = scene.getObjectByName(name);
      return bone
        ? { bone, rest: bone.quaternion.clone() }
        : null;
    };
    return {
      tail: names.tail.map(resolve).filter((entry): entry is NonNullable<typeof entry> => entry !== null),
      leftPectoral: names.leftPectoral.map(resolve).filter((entry): entry is NonNullable<typeof entry> => entry !== null),
      rightPectoral: names.rightPectoral.map(resolve).filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    };
  }, [asset.commonName, scene]);
  const controller = useFishAnimationController({
    root: scene,
    clips: gltf.animations ?? [],
    asset,
    initialPhase: phase,
  });

  useEffect(() => {
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return;
        material.roughness = asset.materialProfile?.bodyRoughness ?? material.roughness;
        material.envMapIntensity = 0.72;
        material.needsUpdate = true;
      });
    });
    controller.setState("cruise");
  }, [asset.materialProfile?.bodyRoughness, controller, scene]);

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

    const vx =
      Math.cos(gT * 0.6) * 0.6 * behaviour.rangeX * bounds.x * 0.5 * cohesion +
      Math.cos(iT * 1.15) * 1.15 * behaviour.rangeX * bounds.x * 0.38 * wander;
    const vz =
      -Math.sin(gT * 0.42) * 0.42 * behaviour.rangeZ * bounds.z * 0.5 * cohesion -
      Math.sin(iT * 0.93) * 0.93 * behaviour.rangeZ * bounds.z * 0.38 * wander;
    const desiredHeading = Math.atan2(-vz, vx) + rotationY;
    const headingDelta = Math.atan2(
      Math.sin(desiredHeading - g.rotation.y),
      Math.cos(desiredHeading - g.rotation.y),
    );
    g.rotation.y += headingDelta * Math.min(delta * behaviour.turnRate * 0.85, 1);
    const bankTarget = THREE.MathUtils.clamp(-headingDelta * 0.42, -0.16, 0.16);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, bankTarget, Math.min(delta * 3.2, 1));
    const verticalVelocity =
      Math.cos(gT * 0.3) * 0.3 * behaviour.verticalRange * bounds.y * 0.5 * cohesion +
      Math.cos(iT * 1.3) * 1.3 * behaviour.verticalRange * bounds.y * 0.42 * wander;
    const pitchTarget = THREE.MathUtils.clamp(verticalVelocity * 0.16, -0.08, 0.08);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, pitchTarget, Math.min(delta * 2.4, 1));

    // State selection — coarse mapping; refined once real clips are authored.
    let state: FishAnimationState = "cruise";
    if (burst > 0.6) state = "dart";
    else if (speedMul > 1.05) state = "fast";
    else if (pauseMul < 0.35) state = "hover";
    controller.setState(state);
    controller.tick(delta, speedMul * pauseMul);

    // The BlueMesh Betta has a detailed skinned rig but only one general
    // authored action. Layer an aquarium-scale propulsion cycle onto its
    // real tail and pectoral bones so it visibly swims rather than gliding.
    if (bettaRig) {
      const swimRate = 3.6 + speedMul * 2.8;
      const tailBeat = Math.sin(t * swimRate + phase);
      bettaRig.tail.forEach(({ bone, rest }, index) => {
        const amplitude = 0.12 + index * 0.095;
        bone.quaternion.copy(rest);
        bone.rotateZ(tailBeat * amplitude);
      });

      const pectoralBeat = Math.sin(t * (swimRate * 1.55) + phase + Math.PI * 0.5);
      // The paired fin chains are Bone.046 → .048 → .050 and
      // Bone.047 → .049 → .051 in the published BlueMesh armature.
      // Drive each joint with a small phase lag: this creates a recognisable
      // fin fan, rather than merely rotating the fin at its body attachment.
      bettaRig.leftPectoral.forEach(({ bone, rest }, index) => {
        bone.quaternion.copy(rest);
        bone.rotateZ(pectoralBeat * (0.48 - index * 0.1));
      });
      bettaRig.rightPectoral.forEach(({ bone, rest }, index) => {
        bone.quaternion.copy(rest);
        bone.rotateZ(-pectoralBeat * (0.48 - index * 0.1));
      });
    }
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
      {/* Invisible pointer hitbox sized to the model's local bbox so
          translucent fins are not relied on for click/tap selection. */}
      <mesh visible={false}>
        <boxGeometry args={[localBbox[0] * 1.15, localBbox[1] * 1.4, localBbox[2] * 1.4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -localBbox[1] * 0.6, 0]}>
          <ringGeometry args={[localBbox[0] * 0.55, localBbox[0] * 0.7, 36]} />
          <meshBasicMaterial color="#B8E84A" transparent opacity={0.9} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
