import { createFileRoute } from "@tanstack/react-router";
import { TankWorkspace } from "@/components/TankWorkspace";
export const Route = createFileRoute("/visualiser")({
 validateSearch: (search: Record<string,unknown>): {tank?:string;remix?:string} => ({tank: typeof search.tank === "string" ? search.tank : undefined, remix: typeof search.remix === "string" ? search.remix : undefined}),
 head: () => ({meta: [
  {title: "Aquarium visual planner | FishTankr"},
  {name: "description", content: "Arrange your freshwater aquarium in 3D with fish, plants, hardscape and equipment."},
  {property: "og:title", content: "Aquarium visual planner | FishTankr"},
  {property: "og:description", content: "Arrange your freshwater aquarium in 3D with fish, plants, hardscape and equipment."},
  {property: "og:type", content: "website"},
  {name: "twitter:card", content: "summary"},
 ]}),
 component: () => <TankWorkspace visualiser />,
});
