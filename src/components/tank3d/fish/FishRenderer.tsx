import { Suspense, lazy } from "react";
import type { Species } from "@/lib/types";
import { ProceduralFish, type FishMeshProps } from "../FishMesh";
import { getFishAsset, hasGltfAsset, resolveModelUrl } from "@/lib/fish3d/registry";
import { detectDeviceTier, resolveQuality, tierToLod } from "@/lib/fish3d/quality";
import { FishAssetErrorBoundary } from "./FishAssetFallback";

// Lazy import keeps the GLB code path out of the initial bundle for tanks
// that only contain procedural species. The Suspense boundary below routes
// to ProceduralFish while the chunk (and later the model itself) streams.
const GltfFish = lazy(() =>
  import("./GltfFish").then((mod) => ({ default: mod.GltfFish })),
);

export interface FishRendererProps extends FishMeshProps {
  /** Full species record — GLB path needs adult size and body family. */
  species: Species;
  /** School size for this species entry (used by the quality manager). */
  quantity: number;
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

  if (!modelUrl || !asset) {
    return (
      <ProceduralFish
        {...rest}
        reduced={reduced}
        selected={selected}
        showFineDetail={showFineDetail}
      />
    );
  }

  return (
    <FishAssetErrorBoundary
      fallback={
        <ProceduralFish
          {...rest}
          reduced={reduced}
          selected={selected}
          showFineDetail={showFineDetail}
        />
      }
    >
      <Suspense
        fallback={
          <ProceduralFish
            {...rest}
            reduced={reduced}
            selected={selected}
            showFineDetail={showFineDetail}
          />
        }
      >
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
