import { create } from "zustand";
import type { PlacementKind } from "./placements";

interface Selection {
  kind: PlacementKind;
  refId: string;
}

export type CameraPreset = "front" | "iso" | "top";

interface EditorState {
  selected: Selection | null;
  hovered: Selection | null;
  cameraPreset: CameraPreset | null;
  cameraToken: number;
  select: (sel: Selection | null) => void;
  hover: (sel: Selection | null) => void;
  setCameraPreset: (p: CameraPreset) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selected: null,
  hovered: null,
  cameraPreset: null,
  cameraToken: 0,
  select: (selected) => set({ selected }),
  hover: (hovered) => set({ hovered }),
  setCameraPreset: (cameraPreset) =>
    set((s) => ({ cameraPreset, cameraToken: s.cameraToken + 1 })),
}));

export function useSelected() {
  return useEditorStore((s) => s.selected);
}
export function useIsSelected(kind: PlacementKind, refId: string) {
  return useEditorStore((s) => s.selected?.kind === kind && s.selected?.refId === refId);
}
