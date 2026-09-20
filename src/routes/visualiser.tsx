import { createFileRoute } from "@tanstack/react-router";
import { TankWorkspace } from "@/components/TankWorkspace";
export const Route = createFileRoute("/visualiser")({
 validateSearch: (search: Record<string,unknown>): {tank?:string;remix?:string} => ({tank: typeof search.tank === "string" ? search.tank : undefined, remix: typeof search.remix === "string" ? search.remix : undefined}),
 head: () => ({meta: [{title: "Tank visualiser | FishTankr"}]}),
 component: () => <TankWorkspace visualiser />,
});
