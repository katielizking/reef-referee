import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";

type Guide = {
  slug: string;
  title: string;
  description: string;
  minutes: number;
  sections: { id: string; heading: string }[];
  faqs: { q: string; a: string }[];
  body: () => ReactNode;
};

const guides: Record<string, Guide> = {
  cycling: {
    slug: "cycling",
    title: "Cycling your tank: the complete guide",
    description:
      "How to cycle a freshwater aquarium the fish-safe way. The nitrogen cycle explained, plus a step-by-step fishless cycle.",
    minutes: 8,
    sections: [
      { id: "what-is-cycling", heading: "What cycling actually means" },
      { id: "the-cycle", heading: "The nitrogen cycle" },
      { id: "fishless", heading: "Fishless cycle (recommended)" },
      { id: "fish-in", heading: "Fish-in cycle (only if you must)" },
      { id: "signs", heading: "Signs cycling is complete" },
      { id: "mistakes", heading: "Common mistakes" },
      { id: "next", heading: "Adding your first fish" },
    ],
    faqs: [
      {
        q: "How long does cycling a fish tank take?",
        a: "A fishless cycle with pure ammonia takes 3–6 weeks in typical Australian tap water. Using seeded media from an established tank can cut that to under two weeks.",
      },
      {
        q: "Can I cycle a tank in a day using a bottled starter?",
        a: "Not reliably. Bottled bacteria products help, especially in cold rooms, but they do not replace measuring ammonia and nitrite until both read zero. Treat them as a boost, not a shortcut.",
      },
      {
        q: "Do live plants cycle a tank?",
        a: "Heavily planted tanks can skip a traditional cycle because plants absorb ammonia directly. You still need a test kit to confirm ammonia stays at zero once fish are added.",
      },
      {
        q: "What ammonia level is safe for fish?",
        a: "Zero. Any measurable ammonia is stressful; above about 0.5 ppm it starts damaging gills. Nitrite should also read zero.",
      },
    ],
    body: () => (
      <>
        <section id="what-is-cycling">
          <h2>What cycling actually means</h2>
          <p>
            A freshwater tank is a tiny sewage-treatment plant. Fish produce ammonia,
            which is toxic to them. "Cycling" is the weeks-long process of growing a
            colony of bacteria on your filter media that converts ammonia → nitrite →
            nitrate. Once that colony is established, waste is processed within hours
            and the tank is stable.
          </p>
          <p>
            Adding fish to a tank that has not cycled is called <em>new tank
            syndrome</em>. It is the single most common reason beginner fish die.
          </p>
        </section>

        <section id="the-cycle">
          <h2>The nitrogen cycle</h2>
          <ol>
            <li>
              <strong>Ammonia (NH₃)</strong> — comes from fish waste, uneaten food,
              decaying plants. Toxic at any measurable level.
            </li>
            <li>
              <strong>Nitrite (NO₂⁻)</strong> — produced by <em>Nitrosomonas</em>
              bacteria as they consume ammonia. Also toxic.
            </li>
            <li>
              <strong>Nitrate (NO₃⁻)</strong> — produced by <em>Nitrobacter</em> and
              <em>Nitrospira</em> bacteria as they consume nitrite. Much less toxic;
              removed by weekly water changes and by live plants.
            </li>
          </ol>
        </section>

        <section id="fishless">
          <h2>Fishless cycle (recommended)</h2>
          <p>The animal-welfare-friendly path. No fish suffer while the tank matures.</p>
          <ol>
            <li>
              <strong>Set up the tank fully</strong>: substrate, hardscape, plants,
              filter running, heater at 26 °C. Dechlorinate the water.
            </li>
            <li>
              <strong>Dose ammonia to 2 ppm</strong> using pure ammonia (available from
              cleaning-product aisles as "cloudy ammonia" — check the label says
              ammonia and nothing else) or a dedicated aquarium ammonia product.
            </li>
            <li>
              <strong>Test daily</strong> with a liquid test kit (API or Salifert).
              Around day 7–10 ammonia will start dropping and nitrite will spike.
            </li>
            <li>
              <strong>Redose ammonia to 2 ppm</strong> whenever it drops below 0.5 ppm.
              Keep going until you can dose 2 ppm ammonia and see both ammonia AND
              nitrite read zero within 24 hours.
            </li>
            <li>
              <strong>Do a large water change (75%+)</strong> to bring nitrate down,
              then add fish within a day so the bacteria colony has food.
            </li>
          </ol>
        </section>

        <section id="fish-in">
          <h2>Fish-in cycle (only if you must)</h2>
          <p>
            Sometimes you inherit fish, or a tank cracks and animals need to move
            today. If you have to cycle with fish in the tank:
          </p>
          <ul>
            <li>Stock <em>lightly</em> — one or two hardy fish per 40L, no more.</li>
            <li>Test daily. Do a 25% water change any time ammonia + nitrite exceeds 0.5 ppm combined.</li>
            <li>Feed sparingly — every second day, tiny amounts.</li>
            <li>Use a bottled bacteria starter to seed the filter.</li>
          </ul>
          <p>
            Fish-in cycling stresses the animals and can shorten their lifespan even
            when they visibly survive. Fishless is always kinder.
          </p>
        </section>

        <section id="signs">
          <h2>Signs cycling is complete</h2>
          <ul>
            <li>Ammonia reads 0 ppm.</li>
            <li>Nitrite reads 0 ppm.</li>
            <li>Nitrate reads 5–40 ppm.</li>
            <li>The tank processes a fresh 2 ppm dose of ammonia to zero in 24 hours.</li>
          </ul>
        </section>

        <section id="mistakes">
          <h2>Common mistakes</h2>
          <ul>
            <li>
              <strong>Rinsing filter media in tap water</strong> — the chlorine kills
              the colony. Rinse in old tank water only.
            </li>
            <li>
              <strong>Skipping the test kit</strong> — colour-strip tests are OK for
              screening, but for cycling you need a liquid kit that measures
              ammonia + nitrite reliably.
            </li>
            <li>
              <strong>Cranking the filter on day one</strong> — bacteria need surface
              area, not brute-force flow. Fill the media trays properly.
            </li>
            <li>
              <strong>Dosing too much ammonia</strong> — above 5 ppm actually stalls
              the cycle. Stick to 2 ppm.
            </li>
          </ul>
        </section>

        <section id="next">
          <h2>Adding your first fish</h2>
          <p>
            Once cycled, add fish in stages — a group at a time, a week apart. The
            bacteria colony grows to match its food supply, and dumping in the full
            stocking list at once causes a mini-cycle.
          </p>
          <p>
            Not sure what to add? The{" "}
            <Link to="/" className="text-primary underline">FishTankr builder</Link>{" "}
            will show you the bioload as you go, and the{" "}
            <Link to="/quiz" className="text-primary underline">fish quiz</Link>{" "}
            recommends species that suit your tank size and experience.
          </p>
        </section>
      </>
    ),
  },
};

export const Route = createFileRoute("/guides/$slug")({
  loader: ({ params }) => {
    const guide = guides[params.slug];
    if (!guide) throw notFound();
    return { guide };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Guide not found | FishTankr" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const g = loaderData.guide;
    const url = `/guides/${params.slug}`;
    return {
      meta: [
        { title: `${g.title} | FishTankr` },
        { name: "description", content: g.description },
        { property: "og:title", content: g.title },
        { property: "og:description", content: g.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: g.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
      ],
    };
  },
  component: GuidePage,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold">Guide not found</h1>
      <p className="mt-2 text-muted-foreground">
        We don't have that one yet. <Link to="/guides" className="text-primary underline">See all guides</Link>.
      </p>
    </main>
  ),
});

function GuidePage() {
  const { guide } = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-24">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </p>
            <ul className="space-y-1.5 text-sm">
              {guide.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-muted-foreground hover:text-foreground">
                    {s.heading}
                  </a>
                </li>
              ))}
              <li>
                <a href="#faq" className="text-muted-foreground hover:text-foreground">
                  FAQ
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <article className="prose prose-slate max-w-3xl">
          <h1 className="font-display">{guide.title}</h1>
          <p className="lead text-lg text-muted-foreground">{guide.description}</p>
          {guide.body()}

          <section id="faq">
            <h2>Frequently asked questions</h2>
            {guide.faqs.map((f) => (
              <div key={f.q} className="mb-4">
                <h3 className="text-base font-semibold">{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>

          <div className="mt-10 rounded-2xl border bg-card p-6 not-prose">
            <p className="font-display text-lg font-semibold">Ready to plan a tank?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try the builder to see live stocking, biotope and bioload scores as you add fish.
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-95"
            >
              Open the builder
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
