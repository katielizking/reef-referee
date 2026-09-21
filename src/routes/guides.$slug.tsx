import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
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
        a: "There is no reliable fixed duration. Temperature, water chemistry, microbial seeding, media and the ammonia source all matter. Use repeated ammonia and nitrite tests, not the calendar, to decide when the tank is ready.",
      },
      {
        q: "Can I cycle a tank in a day using a bottled starter?",
        a: "Not reliably. Bottled bacteria products help, especially in cold rooms, but they do not replace measuring ammonia and nitrite until both read zero. Treat them as a boost, not a shortcut.",
      },
      {
        q: "Do live plants cycle a tank?",
        a: "Plants can take up nitrogen, but they do not prove that a biological filter is established. Test ammonia and nitrite before adding fish, then keep testing once the fish are in.",
      },
      {
        q: "What ammonia level is safe for fish?",
        a: "FishTankr tells you not to add fish if any ammonia or nitrite is detected. If fish are already in the tank, act immediately to protect them and find the cause.",
      },
    ],
    body: () => (
      <>
        <section id="what-is-cycling">
          <h2>What cycling actually means</h2>
          <p>
            A freshwater tank is a tiny waste-treatment system. Fish produce ammonia, which can harm
            them. “Cycling” means growing beneficial microbes on the filter media and other wet
            surfaces. These microbes convert ammonia → nitrite → nitrate. Every tank takes a
            different amount of time, so the calendar alone cannot tell you when yours is ready.
          </p>
          <p>
            Adding fish before this process is established can cause <em>new tank syndrome</em>, a
            common and preventable cause of illness and death in new aquariums.
          </p>
        </section>

        <section id="the-cycle">
          <h2>The nitrogen cycle</h2>
          <ol>
            <li>
              <strong>Ammonia (NH₃)</strong> comes from fish waste, uneaten food and decaying
              plants. Toxic at any measurable level.
            </li>
            <li>
              <strong>Nitrite (NO₂⁻)</strong> is produced as ammonia-oxidising microbes process
              ammonia. Also harmful to fish.
            </li>
            <li>
              <strong>Nitrate (NO₃⁻)</strong> is produced when other microbes process nitrite.
              Regular testing tells you when water changes and other maintenance are needed.
            </li>
          </ol>
        </section>

        <section id="fishless">
          <h2>Fishless cycle (recommended)</h2>
          <p>
            This is the kindest way to cycle a tank because no fish are exposed while it matures.
          </p>
          <ol>
            <li>
              <strong>Set up the tank fully</strong>: substrate, hardscape, plants, filter and any
              heater running. Condition tap water appropriately.
            </li>
            <li>
              <strong>Add a controlled ammonia source</strong> using a purpose-made aquarium cycling
              product and follow its instructions. Do not improvise with fragranced or
              detergent-containing household products.
            </li>
            <li>
              <strong>Test ammonia and nitrite regularly.</strong> Record the date and result so you
              can see whether both are being processed consistently.
            </li>
            <li>
              <strong>Continue the product's test-and-dose protocol</strong> until a repeatable
              controlled challenge returns both ammonia and nitrite to zero.
            </li>
            <li>
              <strong>Check nitrate, pH and temperature too.</strong> If the results call for a
              water change, use conditioned water that matches the tank temperature. Then add fish
              gradually.
            </li>
          </ol>
        </section>

        <section id="fish-in">
          <h2>Fish-in cycle (only if you must)</h2>
          <p>
            Sometimes you inherit fish, or a tank cracks and animals need to move today. If you have
            to cycle with fish in the tank:
          </p>
          <ul>
            <li>Test ammonia and nitrite frequently and record the trend.</li>
            <li>
              Respond to any detection with an appropriate conditioned-water change and
              investigation of the cause.
            </li>
            <li>Feed cautiously so uneaten food does not add avoidable waste.</li>
            <li>
              Add established healthy media when available, without treating it as proof that
              cycling is complete.
            </li>
          </ul>
          <p>
            Fish-in cycling stresses the animals and can shorten their lifespan even when they
            visibly survive. If fish show distress or tests remain unsafe, seek help from an aquatic
            veterinarian or experienced aquatic professional.
          </p>
        </section>

        <section id="signs">
          <h2>Signs cycling is complete</h2>
          <ul>
            <li>Ammonia reads 0 mg/L after a controlled ammonia source.</li>
            <li>Nitrite reads 0 mg/L after the same challenge.</li>
            <li>Results are repeatable rather than a single isolated reading.</li>
            <li>Other parameters, including pH and temperature, suit the planned fish.</li>
          </ul>
        </section>

        <section id="mistakes">
          <h2>Common mistakes</h2>
          <ul>
            <li>
              <strong>Rinsing filter media in tap water.</strong> Chlorine kills the colony. Rinse
              in old tank water only.
            </li>
            <li>
              <strong>Skipping measurements.</strong> Choose tests that measure ammonia and nitrite
              at a useful resolution, follow their instructions and record the results.
            </li>
            <li>
              <strong>Cranking the filter on day one.</strong> Bacteria need surface area, not
              brute-force flow. Fill the media trays properly.
            </li>
            <li>
              <strong>Improvised dosing.</strong> Follow the cycling product's stated protocol
              rather than assuming more ammonia will make the process faster.
            </li>
          </ul>
        </section>

        <section id="next">
          <h2>Adding your first fish</h2>
          <p>
            Once the tank is cycled, add fish gradually. Add one group at a time, rather than the
            whole plan at once. The biofilter needs time to grow with the added waste, and adding
            too much too quickly can trigger another ammonia or nitrite spike.
          </p>
          <p>
            Not sure what to add? The{" "}
            <Link to="/calculator" className="text-primary underline">
              FishTankr builder
            </Link>{" "}
            checks compatibility, swimming space, water suitability and cycle readiness, while the{" "}
            <Link to="/species" className="text-primary underline">
              species library
            </Link>{" "}
            helps you compare freshwater fish before adding them to your plan.
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
        meta: [{ title: "Guide not found | FishTankr" }, { name: "robots", content: "noindex" }],
      };
    }
    const g = loaderData.guide;
    const url = absoluteUrl(`/guides/${params.slug}`);
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
        We don't have that one yet.{" "}
        <Link to="/guides" className="text-primary underline">
          See all guides
        </Link>
        .
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
              {guide.sections.map((s: { id: string; heading: string }) => (
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
            {guide.faqs.map((f: { q: string; a: string }) => (
              <div key={f.q} className="mb-4">
                <h3 className="text-base font-semibold">{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>

          <div className="mt-10 rounded-2xl border bg-card p-6 not-prose">
            <p className="font-display text-lg font-semibold">Ready to plan a tank?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your fish to the builder and see compatibility, space, water and cycle concerns as
              you build the plan.
            </p>
            <Link
              to="/calculator"
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
