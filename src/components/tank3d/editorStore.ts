import { create } from "zustand";
import type { PlacementKind } from "./placements";

interface Selection {
  kind: PlacementKind;
  refId: string;
}

interface EditorState {
  selected: Selection | null;
  hovered: Selection | null;
  select: (sel: Selection | null) => void;
  hover: (sel: Selection | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selected: null,
  hovered: null,
  select: (selected) => set({ selected }),
  hover: (hovered) => set({ hovered }),
}));

export function useSelected() {
  return useEditorStore((s) => s.selected);
}
export function useIsSelected(kind: PlacementKind, refId: string) {
  return useEditorStore((s) => s.selected?.kind === kind && s.selected?.refId === refId);
}
