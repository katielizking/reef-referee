import { Html } from "@react-three/drei";
import { Suspense, lazy } from "react";
import type { Species } from "@/lib/types";
import { SpeciesPortrait } from "@/components/SpeciesPortrait";
import { ProceduralFish, type FishMeshProps } from "../FishMesh";
import { getFishAsset, resolveModelUrl } from "@/lib/fish3d/registry";
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
  quantity,
  onSelect,
}: Pick<
  FishRendererProps,
  "species" | "basePosition" | "length" | "selected" | "instanceIndex" | "quantity" | "onSelect"
>) {
  if (instanceIndex > 0) return null;

  return (
    <group position={basePosition}>
      <mesh
        scale={[Math.max(length * 0.55, 0.18), Math.max(length * 0.24, 0.09), 0.08]}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html center sprite distanceFactor={6} zIndexRange={[20, 0]}>
        <div className={`pointer-events-none relative w-28 overflow-hidden rounded-[1.25rem] border-2 bg-white shadow-[0_8px_24px_rgba(18,35,46,.2)] ${
          selected ? "border-lime" : "border-white/80"
        }`}>
          <SpeciesPortrait
            commonName={species.common_name}
            scientificName={species.scientific_name}
            compact
            className="aspect-[4/3] w-full"
          />
          <div className="bg-ink px-2 py-1.5 text-center text-[8px] font-semibold leading-tight text-white">
            {species.common_name}
            {quantity > 1 ? <span className="ml-1 text-lime">×{quantity}</span> : null}
            <span className="mt-0.5 block font-normal italic text-white/55">
              photographic reference
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}

export function FishRenderer(props: FishRendererProps) {
  const { species, quantity, reduced, selected, showFineDetail, ...rest } = props;
  const asset = getFishAsset(species.id, species.scientific_name);

  const tier = resolveQuality({
    deviceTier: detectDeviceTier(),
    quantity,
    prefersReducedMotion: reduced,
    showFineDetail,
    selected,
  });

  const canUseGltf = tier !== "procedural" && asset !== null;
  const modelUrl = canUseGltf && asset ? resolveModelUrl(asset, tierToLod(tier)) : null;
  const marker = (
    <UnverifiedFishMarker
      species={species}
      basePosition={rest.basePosition}
      length={rest.length}
      selected={selected}
      instanceIndex={rest.instanceIndex}
      quantity={quantity}
      onSelect={rest.onSelect}
    />
  );

  // A verified model may take a moment to download/decode on its first use.
  // Keep a living fish in the tank during that interval; only species without
  // an approved exact model use the clearly labelled photo marker.
  const loadingFallback = (
    <ProceduralFish
      {...rest}
      reduced={reduced}
      selected={selected}
      showFineDetail={showFineDetail}
    />
  );

  if (!modelUrl || !asset) return marker;

  return (
    <FishAssetErrorBoundary fallback={loadingFallback}>
      <Suspense fallback={loadingFallback}>
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
