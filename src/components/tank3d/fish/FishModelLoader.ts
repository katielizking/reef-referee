import { useGLTF } from "@react-three/drei";

/**
 * Central place to set up decoders and prefetching. The real decoder paths
 * (Draco, Meshopt, KTX2) will be wired in when the first licensed model
 * ships. For now, the loader is a thin passthrough so the rest of the code
 * can already depend on the API surface.
 */

/** Preload a model URL so it is cached before a species is first rendered. */
export function preloadFishModel(url: string | null | undefined): void {
  if (!url) return;
  try {
    useGLTF.preload(url);
  } catch {
    // Preloading is best-effort; a network hiccup should not throw.
  }
}

/** Release a model URL from drei's cache when no fish of that species remain. */
export function releaseFishModel(url: string | null | undefined): void {
  if (!url) return;
  try {
    useGLTF.clear(url);
  } catch {
    // Ignore — the cache API is idempotent.
  }
}
