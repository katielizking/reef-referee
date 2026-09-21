import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { TankState } from "@/lib/types";
import { supportsWebGL } from "./webgl";

const TankScene = lazy(() => import("./TankScene"));

function Fallback() {
  return (
    <div className="flex h-[56svh] min-h-[360px] max-h-[520px] sm:h-[480px] sm:max-h-none w-full items-center justify-center rounded-3xl border bg-gradient-to-b from-[#e8f4f6] to-[#c9e5eb] text-sm text-muted-foreground">
      Loading tank preview…
    </div>
  );
}

function WebGLFallback() {
  return (
    <div
      role="status"
      className="flex h-[56svh] min-h-[360px] max-h-[520px] w-full flex-col items-center justify-center rounded-3xl border bg-gradient-to-b from-[#e8f4f6] to-[#c9e5eb] px-6 text-center sm:h-[480px] sm:max-h-none"
    >
      <p className="font-display text-base font-bold text-foreground">3D preview unavailable</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your browser can’t display the aquarium preview. You can still build and edit your plan
        using the controls on this page.
      </p>
    </div>
  );
}

function BrowserTankScene(props: Props) {
  if (!supportsWebGL()) return <WebGLFallback />;

  return (
    <Suspense fallback={<Fallback />}>
      <TankScene {...props} />
    </Suspense>
  );
}

interface Props {
  state: TankState;
  setState?: (updater: (s: TankState) => TankState) => void;
  commit?: () => void;
  onRemoveSpecies?: (speciesId: string) => void;
  interactive?: boolean;
}

export function ClientOnlyTankScene(props: Props) {
  return (
    <ClientOnly fallback={<Fallback />}>
      <BrowserTankScene {...props} />
    </ClientOnly>
  );
}
