import { ChevronDown, Move3D, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "fishtankr:editor-onboarding-complete";

export function EditorOnboarding() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setVisible(window.localStorage.getItem(KEY) !== "1"), []);
  if (!visible) return null;
  return (
    <aside
      className="relative rounded-2xl border border-primary/25 bg-primary/5 p-4 shadow-panel"
      aria-label="Using the 3D editor"
    >
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(KEY, "1");
          setVisible(false);
        }}
        className="absolute right-2 top-2 inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Close 3D editor tips"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
      <p className="science-label text-primary">3D editor</p>
      <p className="mt-2 pr-10 text-sm leading-6 text-muted-foreground">
        Tap an item, then drag it into place. You can still scroll the page.
      </p>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-primary transition-colors hover:text-foreground"
      >
        More tips
        <ChevronDown
          className={`size-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {expanded && (
        <div className="motion-enter mt-3 grid gap-3 border-t border-primary/15 pt-3 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="flex gap-2">
            <Move3D className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
            <span>
              <strong className="text-foreground">Move an item.</strong> Drag it sideways in the
              tank.
            </span>
          </p>
          <p className="flex gap-2">
            <RotateCcw className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
            <span>
              <strong className="text-foreground">Need to undo?</strong> Use the toolbar. Desktop
              shortcuts still work.
            </span>
          </p>
        </div>
      )}
    </aside>
  );
}
