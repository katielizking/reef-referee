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
      <div className="pointer-events-none absolute right-3 top-3 z-10 flex gap-1.5">
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
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex gap-1.5">
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
      className="pointer-events-auto rounded-lg border bg-card/90 p-1.5 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
