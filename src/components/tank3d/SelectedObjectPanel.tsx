import { Copy, Trash2, RotateCcw, RotateCw, X } from "lucide-react";
import type { TankState } from "@/lib/types";
import {
  getPlacement,
  placementLabel,
  removePlacement,
  setPlacement,
  type Interior,
  type PlacementKind,
} from "./placements";
import { useSelected, useEditorStore } from "./editorStore";
import { getFishAsset } from "@/lib/fish3d/registry";

interface Props {
  state: TankState;
  setState: (updater: (s: TankState) => TankState) => void;
  interior: Interior;
  commit: () => void;
  onClose?: () => void;
}

export function SelectedObjectPanel({ state, setState, interior, commit, onClose }: Props) {
  const selected = useSelected();
  const clearSelection = useEditorStore((s) => s.select);
  if (!selected) return null;

  const { kind, refId } = selected;
  const label = placementLabel(state, kind, refId);
  const placement = getPlacement(state.overrides, kind, refId, interior);
  const fishAttribution = kind === "fish" ? getFishAsset(refId)?.attribution : undefined;

  const rowExists = groupExists(state, kind, refId);
  if (!rowExists) {
    // Row was deleted elsewhere.
    clearSelection(null);
    return null;
  }

  function updateOverride(patch: Partial<typeof placement>) {
    setState((s) => ({
      ...s,
      overrides: setPlacement(s.overrides ?? {}, { ...placement, ...patch }),
    }));
  }

  function duplicate() {
    setState((s) => bumpQuantity(s, kind, refId, +1));
    commit();
  }
  function remove() {
    setState((s) => {
      const next = removeGroup(s, kind, refId);
      next.overrides = removePlacement(next.overrides ?? {}, kind, refId);
      return next;
    });
    clearSelection(null);
    commit();
  }

  const canRotate = kind !== "fish" && kind !== "equipment";
  const canScale = kind === "plant" || kind === "hardscape";

  return (
    <div className="rounded-3xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Selected · {kindLabel(kind)}
          </p>
          <h3 className="truncate font-display text-base font-semibold text-foreground">{label}</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            clearSelection(null);
            onClose?.();
          }}
          className="rounded-lg border p-1 text-muted-foreground hover:bg-muted"
          aria-label="Close selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">{hintFor(kind)}</p>

      <div className="space-y-3">
        <AxisSlider
          label="Position X"
          value={placement.anchor[0]}
          min={-interior.x / 2}
          max={interior.x / 2}
          step={0.05}
          onChange={(v) =>
            updateOverride({
              anchor: [v, placement.anchor[1], placement.anchor[2]],
            })
          }
          onCommit={commit}
        />
        <AxisSlider
          label="Position Z"
          value={placement.anchor[2]}
          min={-interior.z / 2}
          max={interior.z / 2}
          step={0.05}
          onChange={(v) =>
            updateOverride({
              anchor: [placement.anchor[0], placement.anchor[1], v],
            })
          }
          onCommit={commit}
        />
        {kind === "fish" && (
          <AxisSlider
            label="Height"
            value={placement.anchor[1]}
            min={interior.substrateY + 0.15}
            max={interior.y / 2 - 0.15}
            step={0.05}
            onChange={(v) =>
              updateOverride({
                anchor: [placement.anchor[0], v, placement.anchor[2]],
              })
            }
            onCommit={commit}
          />
        )}
        {canRotate && (
          <AxisSlider
            label="Rotation"
            value={placement.rotY}
            min={-Math.PI}
            max={Math.PI}
            step={Math.PI / 24}
            format={(v) => `${Math.round((v * 180) / Math.PI)}°`}
            onChange={(v) => updateOverride({ rotY: v })}
            onCommit={commit}
          />
        )}
        {canScale && (
          <AxisSlider
            label="Size"
            value={placement.scale}
            min={0.5}
            max={1.6}
            step={0.05}
            format={(v) => `${v.toFixed(2)}×`}
            onChange={(v) => updateOverride({ scale: v })}
            onCommit={commit}
          />
        )}
      </div>

      {fishAttribution && (
        <p className="mt-4 rounded-xl border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          3D model by{" "}
          <a
            href={fishAttribution.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-foreground underline underline-offset-2"
          >
            {fishAttribution.creator}
          </a>{" "}
          ·{" "}
          <a
            href={fishAttribution.licenseUrl ?? fishAttribution.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {fishAttribution.licenseLabel}
          </a>
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {kind !== "equipment" && (
          <button
            type="button"
            onClick={duplicate}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
        )}
        {canRotate && (
          <>
            <button
              type="button"
              onClick={() => {
                updateOverride({ rotY: placement.rotY - Math.PI / 12 });
                commit();
              }}
              className="inline-flex items-center gap-1 rounded-xl border bg-card px-2 py-1.5 text-xs font-semibold hover:bg-muted"
              aria-label="Rotate left"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                updateOverride({ rotY: placement.rotY + Math.PI / 12 });
                commit();
              }}
              className="inline-flex items-center gap-1 rounded-xl border bg-card px-2 py-1.5 text-xs font-semibold hover:bg-muted"
              aria-label="Rotate right"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={remove}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-coral/40 bg-card px-3 py-1.5 text-xs font-semibold text-coral hover:bg-coral/10"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
    </div>
  );
}

function kindLabel(k: PlacementKind): string {
  if (k === "fish") return "Fish";
  if (k === "plant") return "Plant";
  if (k === "hardscape") return "Décor";
  return "Equipment";
}

function hintFor(k: PlacementKind): string {
  if (k === "fish") return "Drag in the scene to reposition the school's centre.";
  if (k === "plant") return "Sits on the substrate. Rotate and resize as needed.";
  if (k === "hardscape") return "Sits on the substrate. Drag, rotate or resize.";
  return "Snapped to the back glass. Drag left/right or up/down.";
}

function groupExists(state: TankState, kind: PlacementKind, refId: string): boolean {
  if (kind === "fish") return state.species.some((r) => r.species.id === refId);
  if (kind === "plant") return state.plants.some((r) => r.plant.id === refId);
  if (kind === "hardscape") return state.hardscape.some((r) => r.hardscape.id === refId);
  return !!state.filter;
}

function bumpQuantity(
  state: TankState,
  kind: PlacementKind,
  refId: string,
  delta: number,
): TankState {
  if (kind === "fish") {
    return {
      ...state,
      species: state.species.map((r) =>
        r.species.id === refId ? { ...r, quantity: Math.max(1, r.quantity + delta) } : r,
      ),
    };
  }
  if (kind === "plant") {
    return {
      ...state,
      plants: state.plants.map((r) =>
        r.plant.id === refId ? { ...r, quantity: Math.max(1, r.quantity + delta) } : r,
      ),
    };
  }
  if (kind === "hardscape") {
    return {
      ...state,
      hardscape: state.hardscape.map((r) =>
        r.hardscape.id === refId ? { ...r, quantity: Math.max(1, r.quantity + delta) } : r,
      ),
    };
  }
  return state;
}

function removeGroup(state: TankState, kind: PlacementKind, refId: string): TankState {
  if (kind === "fish") {
    return {
      ...state,
      species: state.species.filter((r) => r.species.id !== refId),
    };
  }
  if (kind === "plant") {
    return {
      ...state,
      plants: state.plants.filter((r) => r.plant.id !== refId),
    };
  }
  if (kind === "hardscape") {
    return {
      ...state,
      hardscape: state.hardscape.filter((r) => r.hardscape.id !== refId),
    };
  }
  return { ...state, filter: null };
}

function AxisSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onCommit,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  onCommit: () => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="block text-xs">
      <div className="mb-1 flex items-center justify-between text-muted-foreground">
        <span className="font-semibold uppercase tracking-wide">{label}</span>
        <span className="font-mono text-foreground">
          {format ? format(value) : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        className="w-full accent-primary"
      />
    </label>
  );
}
