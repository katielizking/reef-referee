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
    <aside className="border-b border-foreground/10 bg-ink py-2" aria-label="Support FishTankr">
      <div className="mx-auto w-full max-w-[1440px] px-[clamp(24px,5.8vw,88px)] flex items-center justify-between gap-3">
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          <strong className="font-semibold text-foreground">
            FishTankr is still growing, and it’s supported by fishkeepers like you.
          </strong>{" "}
          Your support helps us improve the care data and test every update.
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center rounded-[3px] border border-[#60799e] px-3 text-xs font-semibold text-foreground transition-colors hover:border-foreground"
          >
            Support $5 AUD
          </a>
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem(DISMISS_KEY, "1");
              setVisible(false);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-foreground/10"
            aria-label="Dismiss support message"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}
