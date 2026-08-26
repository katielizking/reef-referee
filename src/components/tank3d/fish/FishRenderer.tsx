import { Html } from "@react-three/drei";
import { Suspense, lazy } from "react";
import type { Species } from "@/lib/types";
import type { FishMeshProps } from "../FishMesh";
import { getFishAsset, hasGltfAsset, resolveModelUrl } from "@/lib/fish3d/registry";
import { detectDeviceTier, resolveQuality, tierToLod } from "@/lib/fish3d/quality";
import { FishAssetErrorBoundary } from "./FishAssetFallback";

const GltfFish = lazy(() =>
  import("./GltfFish").then((mod) => ({ default: mod.GltfFish })),
);

export interface FishRendererProps extends FishMeshProps {
  species: Species;
  quantity: number;
}

function UnverifiedFishMarker({
  species,
  basePosition,
  length,
  selected,
  instanceIndex,
  onSelect,
}: Pick<
  FishRendererProps,
  "species" | "basePosition" | "length" | "selected" | "instanceIndex" | "onSelect"
>) {
  return (
    <group
      position={basePosition}
      scale={Math.max(length, 0.24)}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <mesh scale={[0.42, 0.16, 0.09]}>
        <sphereGeometry args={[1, 14, 9]} />
        <meshPhysicalMaterial
          color="#d9f4f5"
          transparent
          opacity={selected ? 0.34 : 0.16}
          wireframe
          roughness={0.35}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-0.48, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.18, 0.28, 3]} />
        <meshBasicMaterial color="#8ecbd0" transparent opacity={0.25} wireframe />
      </mesh>
      {instanceIndex === 0 && (
        <Html center position={[0, 0.3, 0]} distanceFactor={8} zIndexRange={[20, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full border border-white/70 bg-ink/80 px-2 py-1 font-display text-[9px] font-semibold text-white shadow-sm backdrop-blur">
            {species.common_name} · model pending
          </div>
        </Html>
      )}
    </group>
  );
}

export function FishRenderer(props: FishRendererProps) {
  const { species, quantity, reduced, selected, showFineDetail, ...rest } = props;
  const asset = getFishAsset(species.id);

  const tier = resolveQuality({
    deviceTier: detectDeviceTier(),
    quantity,
    prefersReducedMotion: reduced,
    showFineDetail,
    selected,
  });

  const canUseGltf = tier !== "procedural" && asset !== null && hasGltfAsset(species.id);
  const modelUrl = canUseGltf && asset ? resolveModelUrl(asset, tierToLod(tier)) : null;
  const marker = (
    <UnverifiedFishMarker
      species={species}
      basePosition={rest.basePosition}
      length={rest.length}
      selected={selected}
      instanceIndex={rest.instanceIndex}
      onSelect={rest.onSelect}
    />
  );

  if (!modelUrl || !asset) return marker;

  return (
    <FishAssetErrorBoundary fallback={marker}>
      <Suspense fallback={marker}>
        <GltfFish
          asset={asset}
          modelUrl={modelUrl}
          {...rest}
          reduced={reduced}
          selected={selected}
          showFineDetail={showFineDetail}
        />
      </Suspense>
    </FishAssetErrorBoundary>
  );
}
