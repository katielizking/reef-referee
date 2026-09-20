import { createFileRoute, Link } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
import { ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "How FishTankr scores a tank | FishTankr" },
      {
        name: "description",
        content:
          "How FishTankr checks tank mates, space, water and cycle status, plus what the score cannot prove.",
      },
      { property: "og:title", content: "How FishTankr scores a tank" },
      {
        property: "og:description",
        content:
          "How FishTankr checks tank mates, space, water and cycle status, plus what the score cannot prove.",
      },
      { property: "og:url", content: absoluteUrl("/methodology") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/methodology") }],
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
        <p className="science-label text-primary">Methodology · version 2026.08</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-[-.04em] text-foreground sm:text-5xl">
          What the FishTankr score means
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          The score helps you spot problems in a stocking plan. It cannot prove a tank is safe. It
          uses checks we can explain clearly. Early estimates stay separate until the evidence is
          stronger.
        </p>
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Headline score weights">
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
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              The cycle can limit the score
            </h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              A fast pump does not automatically mean strong biological filtration. We check the
              filter, biological media, tank age, cycling method and recent water tests. If the
              cycle is unfinished or unverified, the score is limited. If ammonia or nitrite is
              present, do not add fish.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We ask for zero-ammonia and zero-nitrite results from the past seven days. That keeps
              the plan tied to reasonably recent information; it does not mean one test can predict
              what happens next. No single reading or fixed number of weeks proves that a tank is
              ready.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[1.75rem] border border-primary/25 bg-primary/5 p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              One big problem outweighs a good average
            </h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Great water can't make up for a fish that gets eaten. Any critical problem, like
              predation or a tank that's far too small, caps the score at 40. Any serious problem
              caps it at 70, so the plan can't show as looking good until it's fixed.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[1.75rem] border border-warn/35 bg-warn/10 p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-1 h-5 w-5 shrink-0 text-warn" aria-hidden />
          <div>
            <p className="science-label text-foreground/60">Current beta limitation</p>
            <h2 className="mt-2 font-display text-xl font-bold text-foreground">
              The waste-load screen is not a stocking-capacity calculator
            </h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              This estimate uses an older species-load formula that has not been tested against
              enough real aquariums. It only shows a broad band. It does not affect the main score.
              Extra flow, plants or maintenance cannot make the number look better. It never tells
              you how many more fish to add.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              It will stay in beta until we have a sourced model for fish waste and biological
              filtration, tested against independently reviewed tank examples.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-foreground">Evidence policy</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <PolicyCard
            title="What counts"
            items={[
              "Care information linked to a named source and review date",
              "Clear confidence labels when sources are incomplete or disagree",
              "Safety rules we can explain in plain language",
              "Test tanks reviewed independently from the code",
            ]}
          />
          <PolicyCard
            title="What FishTankr does not claim"
            items={[
              "A universal number of fish per litre",
              "That a faster pump means better biological filtration",
              "That plants or water changes can make incompatible fish safe together",
              "That a score can replace watching the fish, testing the water or getting expert help",
            ]}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Research behind the approach
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          These studies support looking at biofilter maturity, water quality and several parts of
          fish welfare separately. They do not prove that the beta waste-load estimate is accurate.
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
                  <span className="block font-semibold text-foreground">{source.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {source.journal}
                  </span>
                </span>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
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

function WeightCard({ label, weight, detail }: { label: string; weight: string; detail: string }) {
  return (
    <article className="rounded-[1.5rem] border bg-card p-4">
      <p className="science-label text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-foreground">{weight}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
    </article>
  );
}

function PolicyCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-[1.5rem] border bg-card p-5">
      <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
