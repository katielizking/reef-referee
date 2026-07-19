import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { TankState } from "@/lib/types";

const TankScene = lazy(() => import("./TankScene"));

function Fallback() {
  return (
    <div className="flex h-[480px] w-full items-center justify-center rounded-3xl border bg-gradient-to-b from-[#e8f4f6] to-[#c9e5eb] text-sm text-muted-foreground">
      Loading tank preview…
    </div>
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
      <Suspense fallback={<Fallback />}>
        <TankScene {...props} />
      </Suspense>
    </ClientOnly>
  );
}
