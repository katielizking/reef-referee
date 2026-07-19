// Photorealistic fish pipeline — type definitions.
// The species asset registry is entirely additive: species without an entry
// continue to render procedurally. See docs/fish-models.md for the pipeline.

export type FishRenderMode = "procedural" | "gltf";

export type FishBodyFamily =
  | "slender-schooler"
  | "deep-bodied"
  | "livebearer"
  | "labyrinth"
  | "cichlid"
  | "catfish"
  | "loach"
  | "sucker"
  | "goldfish"
  | "predator"
  | "other";

/** Behaviour states that map onto GLB animation clips. */
export type FishAnimationState =
  | "idle"
  | "hover"
  | "cruise"
  | "fast"
  | "dart"
  | "turnLeft"
  | "turnRight"
  | "forage"
  | "surface"
  | "patrol"
  | "display";

export type FishLod = "high" | "medium" | "low";

export type FishLengthMeasurement = "total" | "standard";

export interface FishModelOrientation {
  /** Direction the model's nose points in its local frame. Default '+x' matches the procedural fish. */
  forwardAxis: "+x" | "-x" | "+z" | "-z";
  /** Extra Y translation applied after scaling, in scene units. */
  verticalOffset: number;
  /** Optional Euler rotation offset (radians) applied to the cloned scene. */
  rotationOffset?: [number, number, number];
}

export interface FishMaterialProfile {
  bodyRoughness?: number;
  iridescence?: number;
  finOpacity?: number;
  finTransmission?: number;
  eyeClearcoat?: number;
}

export interface FishAssetDefinition {
  /** Must match a `species.id` from the Supabase catalog. */
  speciesId: string;
  commonName: string;
  renderMode: FishRenderMode;
  bodyFamily: FishBodyFamily;

  /** Absolute URL or `/public`-relative path per LOD. Empty = fall back to procedural. */
  models?: Partial<Record<FishLod, string>>;

  /** Canonical adult length (matches the length convention below). */
  adultLengthCm: number;
  /** Length of the actual GLB, measured nose to caudal tip using the same convention. */
  modelReferenceLengthCm: number;
  /** How adultLengthCm / modelReferenceLengthCm are measured. Species DB uses total length. */
  lengthMeasurement: FishLengthMeasurement;

  orientation?: FishModelOrientation;

  /** Map each behavioural state to a clip name inside the GLB. Missing states fall back down the priority chain. */
  animations?: Partial<Record<FishAnimationState, string>>;

  materialProfile?: FishMaterialProfile;
}

export const DEFAULT_ORIENTATION: FishModelOrientation = {
  forwardAxis: "+x",
  verticalOffset: 0,
};
