import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, HeartPulse, Scale, Stethoscope } from "lucide-react";

const DESCRIPTION =
  "What the FishTankr welfare score is, what it is not, and when to get advice from an aquatic veterinarian instead.";

export const Route = createFileRoute("/welfare-disclaimer")({
  head: () => ({
    meta: [
      { title: "Welfare disclaimer — FishTankr" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Welfare disclaimer — FishTankr" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "/welfare-disclaimer" },
    ],
    links: [{ rel: "canonical", href: "/welfare-disclaimer" }],
  }),
  component: WelfareDisclaimerPage,
});

function WelfareDisclaimerPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <p className="science-label text-primary">Welfare disclaimer</p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-[-.04em] text-foreground sm:text-5xl">
        A planning tool, not a guarantee
      </h1>
      <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
        FishTankr helps you think through a stocking plan before animals are involved. It cannot see
        your tank, your water or your fish, so it can describe risk but never certify safety. Every
        decision about live animals remains yours.
      </p>

      <section className="mt-10 space-y-4">
        <Point
          icon={<Stethoscope className="h-5 w-5 text-primary" aria-hidden />}
          title="It is not veterinary advice"
        >
          Nothing here diagnoses illness or prescribes treatment. If a fish is sick, injured or
          behaving abnormally, contact an aquatic veterinarian or a qualified aquatic professional.
          Delaying care because a score looked acceptable is worse than not using the tool at all.
        </Point>

        <Point
          icon={<HeartPulse className="h-5 w-5 text-primary" aria-hidden />}
          title="A good score is not permission to stop looking"
        >
          The score reflects the plan you typed in. It knows nothing about a heater that has failed,
          an individual fish that turns out to be aggressive, a filter that was rinsed in tap water,
          or a species sold to you under the wrong name. Observation and testing are what keep fish
          alive; the score only helps you start from a defensible plan.
        </Point>

        <Point
          icon={<AlertTriangle className="h-5 w-5 text-warn" aria-hidden />}
          title="Some of the data is not yet audited"
        >
          Species requirements and compatibility rules are assembled from a mix of sources and are
          still being reviewed against named references. Fields carry a confidence indicator where
          the evidence is incomplete or conflicting, and the waste-load screen is labelled beta
          because it has not been calibrated against real aquariums. Treat a disagreement between
          FishTankr and a reputable species reference as a reason to check further, not as a settled
          answer.{" "}
          <Link to="/methodology" className="text-primary underline">
            The methodology page
          </Link>{" "}
          sets out exactly what is and is not claimed.
        </Point>

        <Point
          icon={<Scale className="h-5 w-5 text-primary" aria-hidden />}
          title="Local rules still apply"
        >
          Import restrictions, noxious-species lists, permit requirements and animal-welfare
          legislation vary by country, state and sometimes council. FishTankr does not check them
          for you. Confirm that a species is legal to keep and to move where you live before you buy
          it.
        </Point>
      </section>

      <section className="mt-10 rounded-[1.75rem] border border-warn/35 bg-warn/10 p-5 sm:p-7">
        <h2 className="font-display text-xl font-bold text-foreground">
          If the tool and an animal disagree, believe the animal
        </h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Gasping at the surface, clamped fins, hiding, refusing food, sudden aggression or any
          unexplained death is a reason to test the water and get help immediately, whatever the
          scorecard says. A stop warning is meant to be acted on. A clear result is not a reason to
          ignore what you can see.
        </p>
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
            to="/methodology"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border bg-card px-4 py-2 text-sm font-semibold text-foreground"
          >
            Read the methodology
          </Link>
        </div>
      </div>
    </main>
  );
}

function Point({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-[1.5rem] border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
        </div>
      </div>
    </article>
  );
}
