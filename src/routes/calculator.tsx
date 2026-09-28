import { createFileRoute } from "@tanstack/react-router";
import { TankWorkspace } from "@/components/TankWorkspace";
import { absoluteUrl, ogImage } from "@/lib/site";

export const Route = createFileRoute("/calculator")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { tank?: string; remix?: string; idea?: string; size?: string } => ({
    tank: typeof search.tank === "string" ? search.tank : undefined,
    remix: typeof search.remix === "string" ? search.remix : undefined,
    // Plain links from tank ideas and guides: ?idea=<slug> or ?size=<L>x<W>x<H> in cm.
    idea: typeof search.idea === "string" ? search.idea : undefined,
    size: typeof search.size === "string" ? search.size : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Stocking calculator | FishTankr" },
      {
        name: "description",
        content:
          "Enter your tank size, add the fish you want, and see what needs to change before you buy.",
      },
      { property: "og:title", content: "Stocking calculator | FishTankr" },
      {
        property: "og:description",
        content:
          "Enter your tank size, add the fish you want, and see what needs to change before you buy.",
      },
      { property: "og:type", content: "website" },
      ...ogImage("/og/plan.png"),
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/calculator") }],
  }),
  component: () => <TankWorkspace />,
});
