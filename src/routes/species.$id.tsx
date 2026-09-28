import {
  createFileRoute,
  Link,
  useRouter,
  useNavigate,
  notFound,
  redirect,
} from "@tanstack/react-router";
import { isUuid, speciesParam, speciesPath } from "@/lib/species-url";
import { slugify } from "@/lib/tank-idea-collections";
import { TWO_CHECKS } from "@/lib/two-checks";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Fish,
  Ruler,
  Droplet,
  Thermometer,
  Users,
  Waves,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Info,
  Leaf,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SpeciesPortrait } from "@/components/SpeciesPortrait";
import { WhereToBuy } from "@/components/WhereToBuy";
import type { Species } from "@/lib/types";
import { BIOTOPE_LABEL } from "@/lib/types";
import { absoluteUrl, ogImage } from "@/lib/site";
import { alsoKnownAs, lookAlikesOf, telltale, varietiesOf } from "@/lib/species-names";
import { requiredSwimLengthCm } from "@/lib/scoring";
import { formatLength, formatVolume, useUnitSystem } from "@/lib/units";
import { useTankDraft } from "@/components/TankDraftProvider";
import {
  FIT_LABEL,
  SWIM_ZONE_LABEL,
  habitatLabel,
  likelyConflicts,
  planFit,
  type FitVerdict,
} from "@/lib/species-fit";
import { regionalEvidence, speciesEvidence, type EvidenceItem } from "@/lib/species-evidence";

/** Looks a species up by its readable slug, or by the UUID older links used. */
const speciesByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["species", id],
    queryFn: async () => {
      if (!/^[a-z0-9-]+$/i.test(id)) throw notFound();
      const { data, error } = await supabase
        .from("species")
        .select("*")
        .eq(isUuid(id) ? "id" : "slug", isUuid(id) ? id : id.toLowerCase())
        .maybeSingle();
      if (error && !isUuid(id)) {
        // Before the slug column exists, match the slug against common names instead.
        const all = await supabase.from("species").select("*");
        if (all.error) throw all.error;
        const match = (all.data as unknown as Species[]).find(
          (s) => slugify(s.common_name) === id.toLowerCase(),
        );
        if (!match) throw notFound();
        return match;
      }
      if (error) throw error;
      if (!data) throw notFound();
      return data as unknown as Species;
    },
    staleTime: 5 * 60 * 1000,
  });

const allSpeciesQuery = queryOptions({
  queryKey: ["species", "all"],
  queryFn: async () => {
    const { data, error } = await supabase.from("species").select("*");
    if (error) throw error;
    return (data ?? []) as unknown as Species[];
  },
  staleTime: 5 * 60 * 1000,
});

function findRelated(target: Species, all: Species[]): Array<{ s: Species; reason: string }> {
  const zoneLabel = { top: "top", mid: "mid-water", bottom: "bottom" } as const;
  const scored = all
    .filter((s) => s.id !== target.id)

    .filter((s) => {
      // temperament / behavioural compatibility
      if (s.predatory || target.predatory) return false;
      if (s.temperament === "aggressive" && target.temperament === "peaceful") return false;
      if (target.temperament === "aggressive" && s.temperament === "peaceful") return false;
      if (s.fin_nipper && target.long_finned) return false;
      if (target.fin_nipper && s.long_finned) return false;
      // water params overlap
      if (s.native_ph_max < target.native_ph_min || s.native_ph_min > target.native_ph_max)
        return false;
      if (
        s.native_temp_max_c < target.native_temp_min_c ||
        s.native_temp_min_c > target.native_temp_max_c
      )
        return false;
      // similar size (within 3x either way)
      const ratio = s.adult_size_cm / target.adult_size_cm;
      if (ratio > 3 || ratio < 1 / 3) return false;
      return true;
    })
    .map((s) => {
      let score = 0;
      const reasons: string[] = [];
      if (s.biotope_region === target.biotope_region) {
        score += 3;
        reasons.push("same biotope");
      }
      if (s.swim_zone !== target.swim_zone) {
        score += 2;
        reasons.push(`fills the ${zoneLabel[s.swim_zone]} zone`);
      } else {
        reasons.push(`shares the ${zoneLabel[s.swim_zone]} zone`);
      }
      if (s.temperament === target.temperament) score += 1;
      return { s, score, reason: reasons.slice(0, 2).join(" · ") };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  return scored.map(({ s, reason }) => ({ s, reason }));
}

export const Route = createFileRoute("/species/$id")({
  loader: async ({ context, params }) => {
    const [s] = await Promise.all([
      context.queryClient.ensureQueryData(speciesByIdQuery(params.id)),
      context.queryClient.ensureQueryData(allSpeciesQuery),
    ]);
    // Old UUID links (and any other spelling) move permanently to the readable URL.
    if (s.slug && params.id !== s.slug) {
      throw redirect({ to: "/species/$id", params: { id: s.slug }, statusCode: 301 });
    }
    return s;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Species | FishTankr" }, { name: "robots", content: "noindex" }],
      };
    }
    const s = loaderData;
    const title = `${s.common_name} (${s.scientific_name}) | FishTankr`;
    const desc = `Care guide for ${s.common_name}: adult size ${s.adult_size_cm} cm, minimum ${s.min_tank_litres} L, ${BIOTOPE_LABEL[s.biotope_region]}. See care requirements, likely tank-mate conflicts and sources.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: absoluteUrl(speciesPath(s)) },
        ...ogImage("/og/species.png"),
      ],
      links: [{ rel: "canonical", href: absoluteUrl(speciesPath(s)) }],
    };
  },
  notFoundComponent: SpeciesNotFound,
  errorComponent: SpeciesError,
  component: SpeciesGuide,
});

function SpeciesNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">Species not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">It may no longer be in this guide.</p>
      <Link
        to="/calculator"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my tank
      </Link>
    </div>
  );
}

function SpeciesError({ error }: { error: unknown }) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "Please try again."}
      </p>
      <button
        onClick={() => router.invalidate()}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}

function LegalBadge({ s }: { s: Species }) {
  const regional = regionalEvidence(s);
  const style =
    regional.kind === "restricted"
      ? "bg-coral/20 text-foreground"
      : regional.kind === "native"
        ? "bg-lime/30 text-foreground"
        : "bg-muted text-muted-foreground";
  const Icon =
    regional.kind === "restricted" ? AlertTriangle : regional.kind === "native" ? Leaf : Info;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      <Icon className="h-3.5 w-3.5" /> {regional.badge}
    </span>
  );
}

function LegalityEvidence({ s }: { s: Species }) {
  const regional = regionalEvidence(s);

  return (
    <section className="mt-4 rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Australia reference notes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Import rules and the rules for keeping a fish are not always the same.
          </p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-muted/50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Federal import
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{regional.importLabel}</dd>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Keeping this species
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{regional.possessionLabel}</dd>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Evidence confidence
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{regional.confidenceLabel}</dd>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Last reviewed
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{regional.reviewedLabel}</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm text-foreground">{regional.summary}</p>
      {regional.note && <p className="mt-2 text-sm text-muted-foreground">{regional.note}</p>}
      {regional.source ? (
        <a
          href={regional.source.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {regional.source.label}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{regional.detail}</p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        These notes only cover Australia and may not apply where you live. Rules can also change, so
        check with your local fisheries or wildlife authority before buying, moving or collecting
        fish.
      </p>
    </section>
  );
}

function EvidenceSummary({ items }: { items: EvidenceItem[] }) {
  return (
    <section aria-labelledby="evidence-heading" className="mt-4 rounded-2xl border bg-card p-5">
      <h2 id="evidence-heading" className="font-display text-lg font-semibold text-foreground">
        What we have checked
      </h2>
      <dl className="mt-3 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.subject} data-evidence={item.state} className="rounded-xl bg-muted/50 p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {item.subject}
            </dt>
            <dd className="mt-1 flex items-start gap-1.5 text-sm font-medium text-foreground">
              {item.state === "checked" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-verdict-good" aria-hidden />
              ) : (
                <CircleDashed
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              )}
              {item.label}
            </dd>
            <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function NameNotes({ s, catalogue }: { s: Species; catalogue: Species[] }) {
  const lookAlikes = lookAlikesOf(s, catalogue);
  const varieties = varietiesOf(s, catalogue);
  if (lookAlikes.length === 0 && varieties.length === 0) return null;
  const species = s.scientific_name.split(/\s+/).slice(0, 2).join(" ");
  return (
    <section
      aria-label="Similar names"
      className="mt-6 rounded-2xl border border-dashed bg-card p-4 text-sm"
    >
      {varieties.length > 0 && (
        <p className="text-foreground">
          <span className="font-semibold">A bred variety of </span>
          <i>{species}</i>. Other varieties in our catalogue:{" "}
          {varieties.map((v, i) => (
            <span key={v.id}>
              {i > 0 && ", "}
              <Link
                to="/species/$id"
                params={{ id: speciesParam(v) }}
                className="text-primary underline"
              >
                {v.common_name}
              </Link>
            </span>
          ))}
          . Varieties of one species can differ in size, speed and fins, so check each page before
          keeping them together.
        </p>
      )}
      {lookAlikes.length > 0 && (
        <div className={varieties.length > 0 ? "mt-3" : ""}>
          <p className="font-semibold text-foreground">
            Not the same fish as{lookAlikes.length > 1 ? ":" : ""}
          </p>
          <ul className="mt-1 space-y-1">
            {lookAlikes.map((o) => (
              <li key={o.id} className="text-muted-foreground">
                <Link
                  to="/species/$id"
                  params={{ id: speciesParam(o) }}
                  className="text-primary underline"
                >
                  {o.common_name}
                </Link>{" "}
                (<i>{o.scientific_name}</i>): {telltale(o)}.
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted-foreground">
            This page: {s.common_name} ({s.scientific_name}), {telltale(s)}.
          </p>
        </div>
      )}
    </section>
  );
}

function CareRequirements({ s }: { s: Species }) {
  const [units] = useUnitSystem();
  const group =
    s.min_group_size > 1
      ? `At least ${s.min_group_size}. Smaller groups leave ${s.common_name} stressed and more likely to hide or nip.`
      : s.temperament === "aggressive"
        ? `Keep one on its own.`
        : "Can be kept singly.";
  const rows: Array<{ icon: typeof Ruler; label: string; value: string }> = [
    { icon: Droplet, label: "Minimum tank", value: formatVolume(s.min_tank_litres, units) },
    {
      icon: Ruler,
      label: "Tank length",
      value: `${formatLength(requiredSwimLengthCm(s), units)} or longer${s.active ? ", it is an active swimmer" : ""}`,
    },
    {
      icon: Thermometer,
      label: "Water",
      value: `${s.native_temp_min_c}–${s.native_temp_max_c} °C · pH ${s.native_ph_min}–${s.native_ph_max}`,
    },
    { icon: Users, label: "Group", value: group },
    { icon: Waves, label: "Swims", value: SWIM_ZONE_LABEL[s.swim_zone] },
    {
      icon: Fish,
      label: "Adult size",
      value: `${s.adult_size_cm} cm · ${s.temperament.replace("-", " ")}`,
    },
  ];
  return (
    <section aria-labelledby="care-heading" className="mt-8">
      <h2 id="care-heading" className="font-display text-xl font-semibold text-foreground">
        Care requirements
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Wild home: {habitatLabel(s.native_habitat_type)} in {BIOTOPE_LABEL[s.biotope_region]}.
      </p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border bg-card p-4">
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LikelyConflicts({ s, catalogue }: { s: Species; catalogue: Species[] }) {
  const conflicts = likelyConflicts(s, catalogue);
  return (
    <section aria-labelledby="conflicts-heading" className="mt-10">
      <h2 id="conflicts-heading" className="font-display text-xl font-semibold text-foreground">
        Likely conflicts
      </h2>
      {conflicts.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No known fin-nipping, predation or aggression risks for {s.common_name}. Still check the
          full group in the calculator.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {conflicts.map((c) => (
            <li key={c.title} className="rounded-xl border bg-card px-4 py-3 text-sm">
              <p className="font-semibold text-foreground">{c.title}</p>
              <p className="mt-0.5 text-muted-foreground">{c.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const FIT_ACCENT: Record<FitVerdict, string> = {
  fits: "var(--verdict-good)",
  caution: "var(--verdict-caution)",
  conflict: "var(--verdict-critical)",
  "in-plan": "var(--primary)",
};

function PlanFitPanel({ s }: { s: Species }) {
  const { state, hydrated } = useTankDraft();
  if (!hydrated) return null;
  const fit = planFit(state, s);
  return (
    <section
      aria-labelledby="fit-heading"
      className="fishtankr-panel mt-10 border-l-4 p-5"
      style={{ borderLeftColor: FIT_ACCENT[fit.verdict] }}
    >
      <p className="science-label text-muted-foreground">With your plan</p>
      <h2 id="fit-heading" className="mt-2 font-display text-lg font-semibold text-foreground">
        {FIT_LABEL[fit.verdict]}
      </h2>
      <ul className="mt-2 space-y-1 text-sm text-foreground">
        {fit.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <ul className="mt-3 space-y-0.5 text-xs text-muted-foreground">
        {fit.limitations.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      {fit.verdict !== "in-plan" && <AddToTankButton species={s} />}
    </section>
  );
}

function SpeciesGuide() {
  const { id } = Route.useParams();
  const { data: s } = useSuspenseQuery(speciesByIdQuery(id));
  const { data: allSpecies } = useSuspenseQuery(allSpeciesQuery);
  const related = findRelated(s, allSpecies);
  const evidence = speciesEvidence(s);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Link
        to="/calculator"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my tank
      </Link>

      <header className="fishtankr-panel mt-6 grid overflow-hidden rounded-[2rem] lg:grid-cols-[1.1fr_.9fr]">
        <SpeciesPortrait
          commonName={s.common_name}
          scientificName={s.scientific_name}
          eager
          className="min-h-[320px] lg:min-h-[470px]"
        />
        <div className="hero-grid flex flex-col justify-center p-6 sm:p-9">
          <span className="science-label text-primary">Species guide</span>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
              <Fish className="h-3.5 w-3.5" /> {BIOTOPE_LABEL[s.biotope_region]}
            </span>
            <LegalBadge s={s} />
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold leading-none tracking-[-.045em] text-foreground md:text-5xl">
            {s.common_name}
          </h1>
          <p className="mt-2 font-display text-sm italic text-muted-foreground">
            {s.scientific_name}
          </p>
          {alsoKnownAs(s).length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              Also sold as {alsoKnownAs(s).join(", ")}
            </p>
          )}
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Adult needs, habitat, social behaviour and care sources for this fish.
          </p>
          <AddToTankButton species={s} />
        </div>
      </header>

      <NameNotes s={s} catalogue={allSpecies} />
      <CareRequirements s={s} />
      <LikelyConflicts s={s} catalogue={allSpecies} />
      <PlanFitPanel s={s} />

      <section aria-labelledby="sources-heading" className="mt-10">
        <h2 id="sources-heading" className="font-display text-xl font-semibold text-foreground">
          Sources and checks
        </h2>
        <EvidenceSummary items={[evidence.photo, evidence.care, evidence.regional]} />
        <section className="mt-4 rounded-2xl border bg-card p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Where this care information comes from
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Care data:{" "}
                <span className="font-semibold text-foreground">{evidence.care.label}</span>
              </p>
              <p
                className={`mt-3 text-sm text-muted-foreground ${evidence.care.state === "not_verified" ? "rounded-xl bg-warn/10 p-3" : ""}`}
              >
                {evidence.care.detail}
              </p>
              {s.care_source_url && (
                <a
                  href={s.care_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline"
                >
                  {s.care_source_label ?? "View care source"}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              )}
              {s.conspecific_strategy && s.conspecific_strategy !== "unreviewed" && (
                <p className="mt-3 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Same-species strategy:</span>{" "}
                  {s.conspecific_strategy.replace("_", " ")}
                  {s.conspecific_sex_ratio_note ? ` · ${s.conspecific_sex_ratio_note}` : ""}
                </p>
              )}
              {s.conspecific_notes && (
                <p className="mt-2 text-sm text-muted-foreground">{s.conspecific_notes}</p>
              )}
            </div>
          </div>
        </section>

        <LegalityEvidence s={s} />
      </section>

      <details className="mt-10 rounded-2xl border bg-card p-5">
        <summary className="cursor-pointer font-display text-lg font-semibold text-foreground">
          How FishTankr scores this fish
        </summary>
        <p className="mt-2 text-sm text-muted-foreground">
          This fish affects tank mates, swimming room and water. Waste load and biotope match stay
          separate. {TWO_CHECKS.summary}
        </p>
        <div className="mt-4 space-y-3">
          <ScoreBlock title="Species compatibility" body={compatibilityCopy(s)} />
          <ScoreBlock title="Waste load (beta)" body={bioloadCopy(s)} />
          <ScoreBlock title="Space to swim" body={spaceCopy(s)} />
          <ScoreBlock title="Biotope match" body={biomeCopy(s)} />
          <ScoreBlock title="Regional reference" body={evidence.regional.summary} />
        </div>
      </details>

      <WhereToBuy commonName={s.common_name} scientificName={s.scientific_name} />

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-foreground">Related species</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            These fish have promising swim-zone, temperament and water matches. Add the full group
            to your tank plan before deciding whether they can live together.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map(({ s: r, reason }) => (
              <Link
                key={r.id}
                to="/species/$id"
                params={{ id: speciesParam(r) }}
                className="group flex flex-col gap-1 rounded-2xl border bg-card p-4 transition hover:border-primary hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-base font-semibold text-foreground group-hover:text-primary">
                      {r.common_name}
                    </div>
                    <div className="text-xs italic text-muted-foreground">{r.scientific_name}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {BIOTOPE_LABEL[r.biotope_region]}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{reason}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
        Individual fish vary. Check each species’ needs and local regulations before you buy.
      </p>
    </main>
  );
}

function AddToTankButton({ species }: { species: Species }) {
  const navigate = useNavigate();
  const warning = regionalEvidence(species).addWarning;
  function handleAdd() {
    sessionStorage.setItem("fishtankr:pending-add", species.id);
    navigate({ to: "/calculator", hash: "builder" });
  }
  return (
    <div className="mt-2">
      <button
        onClick={handleAdd}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" /> Add to my tank
      </button>
      {warning && <p className="mt-2 text-xs text-muted-foreground">{warning}</p>}
    </div>
  );
}

function ScoreBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function compatibilityCopy(s: Species): string {
  const flags: string[] = [];
  if (s.predatory)
    flags.push(
      "it may eat smaller tank mates, which creates a critical conflict and limits the overall score",
    );
  if (s.fin_nipper) flags.push("it may nip the fins of long-finned fish");
  if (s.long_finned) flags.push("known fin-nippers may damage its long fins");
  if (s.temperament === "aggressive")
    flags.push("its aggressive temperament can put peaceful community fish at risk");
  if (s.temperament === "semi-aggressive") flags.push("it may chase or intimidate peaceful fish");
  if (flags.length === 0)
    return "This is a peaceful fish with no known fin-nipping or predation risks. It may suit similarly sized community fish, but check the full group in the builder.";
  return `When FishTankr checks this fish against its tank mates, it considers that ${flags.join("; ")}.`;
}

function bioloadCopy(s: Species): string {
  return `Each ${s.common_name} adds about ${s.bioload_factor.toFixed(1)} to our early-stage waste estimate. We only use this to show a broad beta band. It does not set a safe fish limit, and a faster pump cannot improve it.`;
}

function spaceCopy(s: Species): string {
  return `This fish needs at least ${s.min_tank_litres} L for adult swimming and territory. ${s.active ? "It is an active swimmer, so tank length matters as much as volume." : "It is not especially active, but still needs the minimum tank volume."}`;
}

function biomeCopy(s: Species): string {
  return `This fish comes from ${BIOTOPE_LABEL[s.biotope_region]} (${habitatLabel(s.native_habitat_type)}), where the pH is typically ${s.native_ph_min}–${s.native_ph_max} and the temperature ${s.native_temp_min_c}–${s.native_temp_max_c} °C. The optional biotope match looks for fish, water and décor from the same region.`;
}
