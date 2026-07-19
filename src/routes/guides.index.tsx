import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/guides")({
  head: () => ({
    meta: [
      { title: "Freshwater aquarium guides | FishTankr" },
      {
        name: "description",
        content:
          "In-depth, Australian-friendly guides on cycling, filtration, planted tanks and stocking your first freshwater aquarium.",
      },
      { property: "og:title", content: "Freshwater aquarium guides | FishTankr" },
      {
        property: "og:description",
        content:
          "In-depth, Australian-friendly guides on cycling, filtration, planted tanks and stocking your first freshwater aquarium.",
      },
      { property: "og:url", content: "/guides" },
    ],
    links: [{ rel: "canonical", href: "/guides" }],
  }),
  component: GuidesIndex,
});

const guides = [
  {
    slug: "cycling",
    title: "Cycling your tank",
    excerpt:
      "The nitrogen cycle in plain English, plus a step-by-step fishless cycle you can actually follow.",
    minutes: 8,
  },
];

function GuidesIndex() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-foreground">Guides</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Deep-dive articles on the biology and gear behind a healthy freshwater tank.
        Everything is written with Australian keepers in mind.
      </p>
      <div className="mt-8 grid gap-4">
        {guides.map((g) => (
          <Link
            key={g.slug}
            to="/guides/$slug"
            params={{ slug: g.slug }}
            className="group block rounded-2xl border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-primary">
                {g.title}
              </h2>
              <span className="text-xs text-muted-foreground">{g.minutes} min read</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{g.excerpt}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
