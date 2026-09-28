import { Link, createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
import { TANK_SIZE_PAGES } from "@/lib/tank-idea-collections";

export const Route = createFileRoute("/guides/")({
  head: () => ({
    meta: [
      { title: "Freshwater aquarium guides | FishTankr" },
      {
        name: "description",
        content:
          "Complete guides to cycling a freshwater aquarium and setting up a betta tank, plus fish lists for every common tank size.",
      },
      {
        property: "og:title",
        content: "Freshwater aquarium guides | FishTankr",
      },
      {
        property: "og:description",
        content:
          "Complete guides to cycling a freshwater aquarium and setting up a betta tank, plus fish lists for every common tank size.",
      },
      { property: "og:url", content: absoluteUrl("/guides") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/guides") }],
  }),
  component: GuidesIndex,
});

interface GuideItem {
  slug: string;
  title: string;
  excerpt: string;
  minutes: number;
  category: string;
}

// Only finished guides are listed. Unfinished topics stay off the page until they are ready.
const guides: GuideItem[] = [
  {
    slug: "cycling",
    title: "Cycling your tank",
    excerpt: "A fishless cycle, step by step.",
    minutes: 8,
    category: "Fishless cycle",
  },
  {
    slug: "betta-tank-setup",
    title: "Betta tank setup",
    excerpt: "Tank size, heater, gentle filtration, water, plants and tank mates for one betta.",
    minutes: 7,
    category: "Single species",
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
        {guides.map((g) => (
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
        ))}
      </div>
      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-foreground">Plan by tank size</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Fish that fit your tank, with ready-made plans to open in the calculator.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {TANK_SIZE_PAGES.map((p) => (
            <li key={p.slug}>
              <Link
                to="/fish-for/$size"
                params={{ size: p.slug }}
                className="inline-block rounded-full border px-3 py-1.5 text-foreground hover:bg-muted"
              >
                Fish for a {p.litres} L tank
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
