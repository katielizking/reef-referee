import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Suspense } from "react";
import { Copy, Loader2, Share2, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import { loadTankBySlug } from "@/lib/data";
import { scoreTank, litresOf } from "@/lib/scoring";
import { displayLength, formatVolume, lengthLabel, useUnitSystem } from "@/lib/units";
import type { TankState } from "@/lib/types";
import { ClientOnlyTankScene } from "@/components/tank3d/ClientOnlyTankScene";
import { ScorecardPanel } from "@/components/Scorecard";

const tankQuery = (slug: string) =>
  queryOptions({
    queryKey: ["tank", "slug", slug],
    queryFn: async () => {
      const t = await loadTankBySlug(slug);
      if (!t) throw notFound();
      return t;
    },
  });

export const Route = createFileRoute("/t/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(tankQuery(params.slug)),
  head: ({ loaderData, params }) => {
    const name = loaderData?.tank.name ?? "Shared tank";
    return {
      meta: [
        { title: `${name} | FishTankr` },
        {
          name: "description",
          content: `${name}: a tank plan shared from FishTankr.`,
        },
        { property: "og:title", content: `${name} | FishTankr` },
        {
          property: "og:description",
          content: "A tank plan shared from FishTankr.",
        },
        { property: "og:type", content: "article" },
        { property: "og:url", content: absoluteUrl(`/t/${params.slug}`) },
      ],
      links: [{ rel: "canonical", href: absoluteUrl(`/t/${params.slug}`) }],
    };
  },
  component: SharedTank,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-3xl px-4 py-12 text-center">
      <h1 className="font-display text-xl font-semibold">Couldn't load this tank</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Link
        to="/calculator"
        className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-95"
      >
        Back to my tank
      </Link>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-12 text-center">
      <h1 className="font-display text-xl font-semibold">Tank not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The share link may be wrong or expired.</p>
      <Link
        to="/calculator"
        className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-95"
      >
        Back to my tank
      </Link>
    </main>
  ),
});

function SharedTank() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <SharedTankBody />
    </Suspense>
  );
}

function SharedTankBody() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(tankQuery(slug));

  const state: TankState = {
    name: data.tank.name,
    length_cm: data.tank.length_cm,
    width_cm: data.tank.width_cm,
    height_cm: data.tank.height_cm,
    filter: data.filter,
    extra_filters: data.filters,
    maintenance_frequency: data.tank.maintenance_frequency,
    biological_media_level:
      data.tank.biological_media_level ?? data.filter?.biological_media_level ?? "standard",
    filter_maturity: data.tank.filter_maturity ?? "unknown",
    cycle_status: data.tank.cycle_status ?? "unknown",
    cycle_method: data.tank.cycle_method ?? "unknown",
    tank_age_weeks: data.tank.tank_age_weeks ?? null,
    ammonia_mg_l: data.tank.ammonia_mg_l ?? null,
    nitrite_mg_l: data.tank.nitrite_mg_l ?? null,
    nitrate_mg_l: data.tank.nitrate_mg_l ?? null,
    water_tested_on: data.tank.water_tested_on ?? null,
    seeded_media: data.tank.seeded_media ?? false,
    target_ph: data.tank.target_ph,
    target_temp_c: data.tank.target_temp_c,
    plant_density: data.tank.plant_density,
    species: data.species,
    plants: data.plants,
    hardscape: data.hardscape,
  };
  const scorecard = scoreTank(state);
  const [units] = useUnitSystem();
  const litres = Math.round(litresOf(state));

  async function copyLink() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    toast.success("Tank link copied");
  }

  async function shareTank() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${state.name} | FishTankr`,
          text: `Check out ${state.name}, a ${formatVolume(litres, units)} tank plan from FishTankr.`,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Shared tank
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {state.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {displayLength(state.length_cm, units)}×{displayLength(state.width_cm, units)}×
          {displayLength(state.height_cm, units)} {lengthLabel(units)} · {formatVolume(litres, units)} ·{" "}
          {state.filter ? state.filter.name : "no filter set"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void shareTank()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-95"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Share tank
          </button>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <Copy className="h-4 w-4" aria-hidden />
            Copy link
          </button>
          <Link
            to="/calculator"
            search={{ remix: slug }}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <WandSparkles className="h-4 w-4" aria-hidden />
            Remix this tank
          </Link>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="space-y-4">
          <ClientOnlyTankScene state={state} interactive={false} />

          <ContentsList state={state} />
        </div>
        <div>
          <ScorecardPanel scorecard={scorecard} />
          <div className="mt-4">
            <Link
              to="/calculator"
              className="inline-flex rounded-xl border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Start a tank
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function ContentsList({ state }: { state: TankState }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <ListCard title="Fish">
        {state.species.length === 0 && <Empty />}
        {state.species.map((s) => (
          <li key={s.species.id} className="flex justify-between py-1 text-sm">
            <span>{s.species.common_name}</span>
            <span className="text-muted-foreground">×{s.quantity}</span>
          </li>
        ))}
      </ListCard>
      <ListCard title="Plants">
        {state.plants.length === 0 && <Empty />}
        {state.plants.map((p) => (
          <li key={p.plant.id} className="flex justify-between py-1 text-sm">
            <span>{p.plant.common_name}</span>
            <span className="text-muted-foreground">×{p.quantity}</span>
          </li>
        ))}
      </ListCard>
      <ListCard title="Hardscape">
        {state.hardscape.length === 0 && <Empty />}
        {state.hardscape.map((h) => (
          <li key={h.hardscape.id} className="flex justify-between py-1 text-sm">
            <span>{h.hardscape.name}</span>
            <span className="text-muted-foreground">×{h.quantity}</span>
          </li>
        ))}
      </ListCard>
    </div>
  );
}

function ListCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul>{children}</ul>
    </div>
  );
}

function Empty() {
  return <li className="py-1 text-sm text-muted-foreground">None</li>;
}
