import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Scoring methodology — FishTankr" },
      {
        name: "description",
        content:
          "How FishTankr separates welfare scoring, nitrogen-cycle readiness and experimental stocking-demand screening.",
      },
    ],
    links: [{ rel: "canonical", href: "/methodology" }],
  }),
  component: MethodologyPage,
});

const SOURCES = [
  {
    title: "Microbial succession in home-aquarium biofilters",
    journal: "Applied and Environmental Microbiology, 2025",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12704419/",
  },
  {
    title: "Fish welfare in public aquariums and zoological collections",
    journal: "Animals, 2023",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10451808/",
  },
  {
    title: "How should we monitor welfare in the ornamental fish trade?",
    journal: "Reviews in Aquaculture, 2021",
    href: "https://onlinelibrary.wiley.com/doi/10.1111/raq.12624",
  },
];

function MethodologyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="max-w-3xl">
        <p className="science-label text-primary">
          Methodology · version 2026.08
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-[-.04em] text-foreground sm:text-5xl">
          What the FishTankr score means
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          FishTankr is decision support, not a promise that a tank is safe. The
          model deliberately separates welfare checks we can explain from
          experimental signals that are not yet validated well enough to drive
          the headline score.
        </p>
      </div>

      <section
        className="mt-10 grid gap-4 sm:grid-cols-3"
        aria-label="Headline score weights"
      >
        <WeightCard
          label="Compatibility"
          weight="45%"
          detail="Group needs, aggression, predation and species conflicts."
        />
        <WeightCard
          label="Swimming space"
          weight="35%"
          detail="Adult size, minimum tank volume and swimming length."
        />
        <WeightCard
          label="Water suitability"
          weight="20%"
          detail="The selected pH and temperature against each species."
        />
      </section>

      <section className="mt-8 rounded-[1.75rem] border border-primary/25 bg-primary/5 p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="mt-1 h-5 w-5 shrink-0 text-primary"
            aria-hidden
          />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Cycle readiness is a safety gate
            </h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Filter flow is not treated as biological capacity. The builder
              records filter type, biological-media amount, media maturity, tank
              age, cycling method, cycle status and dated water tests. A cycle
              that is unverified or still in progress caps the result.
              Detectable ammonia or nitrite triggers the strongest stop warning.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Zero-ammonia and zero-nitrite results must be dated within the
              previous seven days. That is a transparent operational freshness
              rule, not a claim that one test predicts the next seven days.
              FishTankr never treats one reading or a fixed number of elapsed
              weeks as a guarantee.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[1.75rem] border border-warn/35 bg-warn/10 p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <TriangleAlert
            className="mt-1 h-5 w-5 shrink-0 text-warn"
            aria-hidden
          />
          <div>
            <p className="science-label text-foreground/60">
              Current beta limitation
            </p>
            <h2 className="mt-2 font-display text-xl font-bold text-foreground">
              The waste-load screen is not a stocking-capacity calculator
            </h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              The inherited species-load proxy and litres/5 reference have not
              been calibrated against real aquariums. FishTankr now exposes only
              a broad low, moderate, high or very high screening band. It is
              excluded from the headline score, cannot be improved by pump
              turnover, plants or a maintenance multiplier, and never tells
              anyone how many more fish to add.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              It will remain labelled beta until a sourced species-demand model,
              biological-filter model and independently reviewed validation set
              are available.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Evidence policy
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <PolicyCard
            title="What counts"
            items={[
              "Species fields tied to a named source and review date",
              "Confidence shown when evidence is incomplete or conflicting",
              "Safety rules that can be explained in plain language",
              "Regression scenarios approved independently of the implementation",
            ]}
          />
          <PolicyCard
            title="What FishTankr does not claim"
            items={[
              "A universal number of fish per litre",
              "That high pump flow equals biological filtration",
              "That plants or water changes make incompatible stocking safe",
              "That a score replaces observation, testing or qualified advice",
            ]}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Starting evidence
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          These sources support the present separation of microbial biofilter
          maturity, water-quality evidence and multidimensional welfare checks.
          They do not validate the beta waste-load proxy.
        </p>
        <ul className="mt-4 space-y-3">
          {SOURCES.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-3 rounded-2xl border bg-card px-4 py-3 transition-colors hover:border-primary/40"
              >
                <span>
                  <span className="block font-semibold text-foreground">
                    {source.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {source.journal}
                  </span>
                </span>
                <ExternalLink
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 border-t pt-6">
        <div className="flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-95"
          >
            Back to the tank builder
          </Link>
          <Link
            to="/welfare-disclaimer"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border bg-card px-4 py-2 text-sm font-semibold text-foreground"
          >
            Read the welfare disclaimer
          </Link>
        </div>
      </div>
    </main>
  );
}

function WeightCard({
  label,
  weight,
  detail,
}: {
  label: string;
  weight: string;
  detail: string;
}) {
  return (
    <article className="rounded-[1.5rem] border bg-card p-4">
      <p className="science-label text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-foreground">
        {weight}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {detail}
      </p>
    </article>
  );
}

function PolicyCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-[1.5rem] border bg-card p-5">
      <h3 className="font-display text-lg font-bold text-foreground">
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
