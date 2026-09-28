import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { TWO_CHECKS } from "@/lib/two-checks";
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
            scores compatibility, swimming space and water suitability, while the{" "}
            <Link to="/species" className="text-primary underline">
              species library
            </Link>{" "}
            helps you compare freshwater fish before adding them to your plan. The score never
            includes cycling: log your tests in the{" "}
            <Link to="/tracker" className="text-primary underline">
              tank tracker
            </Link>{" "}
            to see whether the tank is ready for fish. {TWO_CHECKS.reminder}
          </p>
        </section>
      </>
    ),
  },
  "betta-tank-setup": {
    slug: "betta-tank-setup",
    title: "Betta tank setup: a complete guide",
    description:
      "How to set up a tank for one betta (Siamese fighting fish): tank size, heater, gentle filtration, water, plants, tank mates and a step-by-step setup order.",
    minutes: 7,
    sections: [
      { id: "needs", heading: "What a betta needs" },
      { id: "tank", heading: "Tank size and shape" },
      { id: "equipment", heading: "Heater, filter and lid" },
      { id: "water", heading: "Water" },
      { id: "scape", heading: "Plants and décor" },
      { id: "tank-mates", heading: "Tank mates" },
      { id: "steps", heading: "Setting up, step by step" },
    ],
    faqs: [
      {
        q: "What size tank does a betta need?",
        a: "Our catalogue minimum for a betta is 20 litres. Our betta plan uses 45 × 30 × 30 cm (about 40 litres gross) because the extra surface area and stability make care easier, and a betta spends much of its time near the top.",
      },
      {
        q: "Can two bettas live together?",
        a: "No. Keep one betta per tank. Two or more in the same tank are likely to fight, causing serious injury or death. FishTankr treats this as a critical conflict.",
      },
      {
        q: "Does a betta need a heater?",
        a: "In most homes, yes. Bettas are tropical fish; our catalogue range is 24–28 °C. A small adjustable heater keeps the temperature steady through the day and night.",
      },
      {
        q: "Does a betta need a filter?",
        a: "Yes. A filter holds the bacteria that break down waste. Choose a gentle one, such as a sponge filter, because long fins make strong currents tiring.",
      },
    ],
    body: () => (
      <>
        <section id="needs">
          <h2>What a betta needs</h2>
          <p>
            The betta (<em>Betta splendens</em>, also sold as the Siamese fighting fish) is a
            tropical fish from still, heavily planted water. It breathes air from the surface as
            well as through its gills, has long fins that make it a slow swimmer, and is aggressive
            towards other bettas. A good setup gives it warm, stable water, gentle flow, cover to
            rest in and easy access to the surface.
          </p>
        </section>

        <section id="tank">
          <h2>Tank size and shape</h2>
          <p>
            Our catalogue minimum is 20 litres, with at least 24 cm of swimming length. That is a
            floor, not a target. Our{" "}
            <Link to="/tank-ideas/$slug" params={{ slug: "betta-shaded-garden" }}>
              betta&apos;s shaded garden
            </Link>{" "}
            plan uses 45 × 30 × 30 cm, about 40 litres before substrate and décor. Larger volumes
            hold temperature and water quality more steadily, which matters more than looks.
          </p>
          <p>
            Favour length and surface area over height. A betta rests near the top and needs to
            reach the surface easily to breathe.
          </p>
        </section>

        <section id="equipment">
          <h2>Heater, filter and lid</h2>
          <ul>
            <li>
              <strong>Heater.</strong> An adjustable heater sized for the tank, with a thermometer
              you can read at a glance.
            </li>
            <li>
              <strong>Filter.</strong> A gentle filter, such as a sponge filter, with plenty of
              biological media. If the outflow pushes the fish around, baffle it.
            </li>
            <li>
              <strong>Lid.</strong> Bettas can jump. A secure lid with an air gap above the water
              keeps the fish in and the air it breathes warm and humid.
            </li>
          </ul>
        </section>

        <section id="water">
          <h2>Water</h2>
          <p>
            Our catalogue range for bettas is 24–28 °C and pH 6.0–7.5. Stable water inside that
            range matters more than hitting an exact number, so avoid chasing pH with chemicals.
            Cycle the tank before the fish goes in: our{" "}
            <Link to="/guides/$slug" params={{ slug: "cycling" }}>
              cycling guide
            </Link>{" "}
            explains how, and the <Link to="/tracker">tank tracker</Link> tells you when ammonia and
            nitrite readings say the tank is ready.
          </p>
        </section>

        <section id="scape">
          <h2>Plants and décor</h2>
          <p>
            Use plenty of plants, especially broad leaves near the surface where the betta can rest.
            Floating plants give shade and calm the surface. Choose smooth décor without sharp edges
            that could tear long fins, and keep an open route to the surface.
          </p>
        </section>

        <section id="tank-mates">
          <h2>Tank mates</h2>
          <p>
            Plan for one betta and no other fish. Bettas are aggressive towards their own kind, and
            their long fins attract fin-nippers, so many community fish are a poor match. Our betta
            plan is deliberately single-species. If you want to check a particular fish, add both to
            the <Link to="/calculator">calculator</Link>, which flags conflicts such as fin nipping
            and aggression.
          </p>
        </section>

        <section id="steps">
          <h2>Setting up, step by step</h2>
          <ol>
            <li>Place the tank on a level, strong stand away from direct sun and draughts.</li>
            <li>Add substrate, décor and plants, leaving open water near the surface.</li>
            <li>Fill with dechlorinated water, then fit the filter, heater and lid.</li>
            <li>Cycle the tank until ammonia and nitrite read zero on repeated tests.</li>
            <li>Set the heater within 24–28 °C and check it holds steady for a few days.</li>
            <li>Acclimate the betta slowly, then keep testing through the first weeks.</li>
          </ol>
          <p>
            Want the numbers filled in for you?{" "}
            <Link to="/calculator" search={{ idea: "betta-shaded-garden" }}>
              Open the betta plan in the calculator
            </Link>
            , then change the size to match your tank.
          </p>
        </section>
      </>
    ),
  },
};

export const Route = createFileRoute("/guides/$slug")({
  // Return only the slug: loader data is serialised into the page, and a guide's
  // body is a render function, which cannot be serialised (it made SSR return 500).
  loader: ({ params }) => {
    if (!guides[params.slug]) throw notFound();
    return { slug: params.slug };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Guide not found | FishTankr" }, { name: "robots", content: "noindex" }],
      };
    }
    const g = guides[loaderData.slug];
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
  const guide = guides[Route.useLoaderData().slug];
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
              Add your fish to the builder to score compatibility, space and water.{" "}
              {TWO_CHECKS.summary}
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
