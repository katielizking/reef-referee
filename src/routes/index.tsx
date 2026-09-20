import { createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
import { HomeHero } from "@/components/HomeHero";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { tank?: string; remix?: string } => ({
    tank: typeof search.tank === "string" ? search.tank : undefined,
    remix: typeof search.remix === "string" ? search.remix : undefined,
  }),
  head: () => ({
    meta: [
      { title: "FishTankr | Plan a better freshwater tank" },
      {
        name: "description",
        content:
          "Plan your freshwater tank with clearer stocking checks, fish compatibility guidance and practical next steps.",
      },
      {
        property: "og:title",
        content: "Plan a better freshwater tank",
      },
      {
        property: "og:description",
        content:
          "Clear stocking checks, fish compatibility guidance and practical next steps.",
      },
      { property: "og:url", content: absoluteUrl("/") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/") }],
  }),
  component: () => (
    <main>
      <HomeHero />
    </main>
  ),
});
