import { Move3D, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "fishtankr:editor-onboarding-complete";

export function EditorOnboarding() {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(window.localStorage.getItem(KEY) !== "1"), []);
  if (!visible) return null;
  return (
    <aside
      className="relative rounded-[1.5rem] border border-primary/30 bg-primary/5 p-4"
      aria-label="3D editor quick start"
    >
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(KEY, "1");
          setVisible(false);
        }}
        className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
        aria-label="Dismiss editor quick start"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
      <p className="science-label text-primary">3D editor quick start</p>
      <div className="mt-3 grid gap-3 pr-8 text-sm text-muted-foreground sm:grid-cols-2">
        <p className="flex gap-2">
          <Move3D className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden />
          <span>
            <strong className="text-foreground">Tap, then drag.</strong> Select any fish, plant or
            décor and move it inside the tank.
          </span>
        </p>
        <p className="flex gap-2">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden />
          <span>
            <strong className="text-foreground">Undo is always visible.</strong> Use the toolbar
            arrows after a move; keyboard shortcuts are optional.
          </span>
        </p>
      </div>
    </aside>
  );
}
