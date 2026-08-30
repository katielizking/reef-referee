import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { SUPPORT_URL } from "@/lib/site";

const DISMISS_KEY = "fishtankr:support-banner-dismissed";

export function WorkInProgressBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(DISMISS_KEY) !== "1");
  }, []);

  if (!visible) return null;

  return (
    <aside className="border-b border-ink/10 bg-lime/25 px-4 py-2" aria-label="Support FishTankr">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <p className="text-xs leading-relaxed text-foreground sm:text-sm">
          <strong className="font-semibold">
            FishTankr is still growing, and it’s supported by fishkeepers like you.
          </strong>{" "}
          Your support helps us improve the care data and test every update.
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center rounded-full bg-ink px-3 text-xs font-semibold text-white transition hover:opacity-90"
          >
            Support $5 AUD
          </a>
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem(DISMISS_KEY, "1");
              setVisible(false);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-white/50"
            aria-label="Dismiss support message"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}
