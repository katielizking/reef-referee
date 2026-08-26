import { Undo2, Redo2, RotateCw, SquareStack, Box, Layers } from "lucide-react";
import { useEditorStore, type CameraPreset } from "./editorStore";

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetLayout: () => void;
}

export function SceneToolbar({ canUndo, canRedo, onUndo, onRedo, onResetLayout }: Props) {
  const setCameraPreset = useEditorStore((s) => s.setCameraPreset);
  return (
    <>
      <div className="pointer-events-none absolute right-2 top-2 z-10 flex gap-1.5 sm:right-3 sm:top-3">
        <ToolbarButton onClick={onUndo} disabled={!canUndo} label="Undo (⌘Z)">
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={onRedo} disabled={!canRedo} label="Redo (⌘⇧Z)">
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={onResetLayout} label="Reset layout">
          <RotateCw className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <div className="pointer-events-none absolute left-2 top-2 z-10 flex gap-1.5 sm:left-3 sm:top-3">
        <CamButton preset="front" label="Front view" onPick={setCameraPreset}>
          <SquareStack className="h-4 w-4" />
        </CamButton>
        <CamButton preset="iso" label="Isometric view" onPick={setCameraPreset}>
          <Box className="h-4 w-4" />
        </CamButton>
        <CamButton preset="top" label="Top-down view" onPick={setCameraPreset}>
          <Layers className="h-4 w-4" />
        </CamButton>
      </div>
    </>
  );
}

function CamButton({
  preset,
  label,
  onPick,
  children,
}: {
  preset: CameraPreset;
  label: string;
  onPick: (p: CameraPreset) => void;
  children: React.ReactNode;
}) {
  return (
    <ToolbarButton onClick={() => onPick(preset)} label={label}>
      {children}
    </ToolbarButton>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border bg-card/90 p-2 sm:h-auto sm:w-auto sm:rounded-lg sm:p-1.5 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
