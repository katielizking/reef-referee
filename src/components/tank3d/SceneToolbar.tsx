import { Undo2, Redo2, RotateCw } from "lucide-react";

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetLayout: () => void;
}

export function SceneToolbar({ canUndo, canRedo, onUndo, onRedo, onResetLayout }: Props) {
  return (
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
