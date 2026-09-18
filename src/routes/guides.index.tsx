import { Link, createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/guides/")({
  head: () => ({
    meta: [
      { title: "Freshwater aquarium guides | FishTankr" },
      {
        name: "description",
        content:
          "Clear guides to cycling, filtration, planted tanks and planning your first freshwater aquarium.",
      },
      {
        property: "og:title",
        content: "Freshwater aquarium guides | FishTankr",
      },
      {
        property: "og:description",
        content:
          "Clear guides to cycling, filtration, planted tanks and planning your first freshwater aquarium.",
      },
      { property: "og:url", content: absoluteUrl("/guides") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/guides") }],
  }),
  component: GuidesIndex,
});

interface GuideItem {
  slug?: string;
  title: string;
  excerpt: string;
  minutes?: number;
  category: string;
  soon?: boolean;
}

const guides: GuideItem[] = [
  {
    slug: "cycling",
    title: "Cycling your tank",
    excerpt: "A fishless cycle, step by step.",
    minutes: 8,
    category: "Fishless cycle",
  },
  {
    title: "Water chemistry: pH, GH, KH",
    excerpt: "What your water readings mean, and when to leave them alone.",
    category: "Water chemistry",
    soon: true,
  },
  {
    title: "Choosing a filter",
    excerpt: "Sponge, HOB or canister. Start with flow and biological media.",
    category: "Filtration",
    soon: true,
  },
  {
    title: "Planted tank basics",
    excerpt: "Light, CO₂, substrate and hardy starter plants.",
    category: "Plants",
    soon: true,
  },
  {
    title: "Quarantine for new fish",
    excerpt: "A simple routine to keep a sick fish from spreading illness.",
    category: "Quarantine",
    soon: true,
  },
  {
    title: "Water changes done right",
    excerpt: "How much water to change and how to avoid shocking fish.",
    category: "Maintenance",
    soon: true,
  },
];

function GuidesIndex() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-foreground">Guides</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Practical guides for building and looking after a freshwater tank. Check local wildlife
        rules where you live.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {guides.map((g) =>
          g.soon || !g.slug ? (
            <div key={g.title} className="block rounded-2xl border bg-card/60 p-6 opacity-80">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-lg font-semibold text-foreground">{g.title}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Coming soon
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{g.category}</p>
              <p className="mt-2 text-sm text-muted-foreground">{g.excerpt}</p>
            </div>
          ) : (
            <Link
              key={g.slug}
              to="/guides/$slug"
              params={{ slug: g.slug }}
              className="group block rounded-2xl border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-lg font-semibold text-foreground group-hover:text-primary">
                  {g.title}
                </h2>
                <span className="text-xs text-muted-foreground">{g.minutes} min read</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{g.category}</p>
              <p className="mt-2 text-sm text-muted-foreground">{g.excerpt}</p>
            </Link>
          ),
        )}
      </div>
    </main>
  );
}
