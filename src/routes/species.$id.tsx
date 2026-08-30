import { createFileRoute, Link, useRouter, useNavigate, notFound } from "@tanstack/react-router";
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
  ExternalLink,
  Info,
  Leaf,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SpeciesPortrait } from "@/components/SpeciesPortrait";
import type { Species } from "@/lib/types";
import { BIOTOPE_LABEL } from "@/lib/types";
import { absoluteUrl } from "@/lib/site";

const speciesByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["species", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("species").select("*").eq("id", id).maybeSingle();
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
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(speciesByIdQuery(params.id)),
      context.queryClient.ensureQueryData(allSpeciesQuery),
    ]).then(([s]) => s),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Species — FishTankr" }, { name: "robots", content: "noindex" }],
      };
    }
    const s = loaderData;
    const title = `${s.common_name} (${s.scientific_name}) — FishTankr`;
    const desc = `Care guide for ${s.common_name}: adult size ${s.adult_size_cm} cm, minimum ${s.min_tank_litres} L, ${BIOTOPE_LABEL[s.biotope_region]}. See welfare notes and how FishTankr scores this fish.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: absoluteUrl(`/species/${s.id}`) },
      ],
      links: [{ rel: "canonical", href: absoluteUrl(`/species/${s.id}`) }],
    };
  },
  notFoundComponent: SpeciesNotFound,
  errorComponent: SpeciesError,
  component: SpeciesGuide,
});

function SpeciesNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">We couldn't find that species</h1>
      <p className="mt-2 text-sm text-muted-foreground">It may have been removed from the guide.</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to the builder
      </Link>
    </div>
  );
}

function SpeciesError({ error }: { error: Error }) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
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
  if (s.legal_status === "prohibited") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-coral/20 px-2.5 py-1 text-xs font-semibold text-foreground">
        <AlertTriangle className="h-3.5 w-3.5" /> Australia: restricted
      </span>
    );
  }
  if (s.legal_status === "native") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-lime/30 px-2.5 py-1 text-xs font-semibold text-foreground">
        <Leaf className="h-3.5 w-3.5" /> Australia: native
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      <Info className="h-3.5 w-3.5" /> Australia: listed
    </span>
  );
}

function LegalityEvidence({ s }: { s: Species }) {
  const importLabel = {
    permitted_with_conditions: "Permitted for import with conditions",
    not_permitted: "Not on the permitted import pathway",
    not_applicable_native: "Not applicable — Australian native",
    unknown: "Import status not yet verified",
  }[s.legal_import_status ?? "unknown"];

  const possessionLabel = {
    generally_permitted_check_state: "Generally kept; check state and territory rules",
    check_state_permits: "State or territory permits may apply",
    prohibited_or_restricted: "Prohibited or restricted; check your jurisdiction",
    check_state_rules: "Check state or territory rules",
  }[s.legal_possession_status ?? "check_state_rules"];

  const confidence = s.legal_confidence ?? "incomplete";
  const confidenceLabel = {
    verified: "Verified",
    medium: "Government source, species detail needs review",
    incomplete: "Incomplete — verify before relying on this",
  }[confidence];

  return (
    <section className="mt-10 rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Australia reference notes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Federal import eligibility and state possession rules are separate checks.
          </p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-muted/50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Federal import
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{importLabel}</dd>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Keeping this species
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{possessionLabel}</dd>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Evidence confidence
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{confidenceLabel}</dd>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Last reviewed
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {s.legal_reviewed_on
              ? new Date(`${s.legal_reviewed_on}T00:00:00`).toLocaleDateString()
              : "Not recorded"}
          </dd>
        </div>
      </dl>

      {s.legal_source_url ? (
        <a
          href={s.legal_source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {s.legal_source_label ?? "View government source"}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {s.legal_source_label ?? "A jurisdiction-specific source still needs to be added."}
        </p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        FishTankr’s catalogue includes Australia-specific reference research; it is not a global
        availability verdict. Confirm current rules with your state or territory fisheries authority
        before buying, moving or collecting fish.
      </p>
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Ruler; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-display text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function SpeciesGuide() {
  const { id } = Route.useParams();
  const { data: s } = useSuspenseQuery(speciesByIdQuery(id));
  const { data: allSpecies } = useSuspenseQuery(allSpeciesQuery);
  const related = findRelated(s, allSpecies);

  const zoneLabel = { top: "Top", mid: "Mid-water", bottom: "Bottom" }[s.swim_zone];
  const temperament = s.temperament.charAt(0).toUpperCase() + s.temperament.slice(1);
  const groupText = s.is_schooling ? `Schools of ${s.min_group_size}+` : "Can be kept singly";

  const welfare: string[] = [];
  if (s.is_schooling) {
    welfare.push(
      `This is a social species. Keep in groups of at least ${s.min_group_size}; smaller groups cause chronic stress.`,
    );
  }
  if (s.fin_nipper) {
    welfare.push(
      "Known to nip fins. Avoid keeping with long-finned tank mates such as bettas, angelfish or guppies.",
    );
  }
  if (s.long_finned) {
    welfare.push("Has long, delicate fins. Vulnerable to fin-nippers and strong currents.");
  }
  if (s.predatory) {
    welfare.push("A predator. Will eat any tank mate small enough to fit in its mouth.");
  }
  if (s.temperament === "aggressive") {
    welfare.push(
      "Territorial and aggressive. Needs careful tank-mate selection and often more space than the minimum suggests.",
    );
  }
  welfare.push(`Native habitat: ${s.native_habitat_type}.`);
  if (s.legal_note) welfare.push(s.legal_note);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to the builder
      </Link>

      <header className="fishtankr-panel mt-6 grid overflow-hidden rounded-[2rem] lg:grid-cols-[1.1fr_.9fr]">
        <SpeciesPortrait
          commonName={s.common_name}
          scientificName={s.scientific_name}
          eager
          className="min-h-[320px] lg:min-h-[470px]"
        />
        <div className="hero-grid flex flex-col justify-center p-6 sm:p-9">
          <span className="science-label text-primary">Species dossier</span>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
              <Fish className="h-3.5 w-3.5" /> {BIOTOPE_LABEL[s.biotope_region]}
            </span>
            <LegalBadge s={s} />
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold leading-none tracking-[-.045em] text-ink md:text-5xl">
            {s.common_name}
          </h1>
          <p className="mt-2 font-display text-sm italic text-muted-foreground">
            {s.scientific_name}
          </p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            A welfare-first profile covering adult needs, natural habitat, social behaviour and the
            evidence used by FishTankr.
          </p>
          <AddToTankButton species={s} />
        </div>
      </header>

      <section className="mt-8">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          At a glance
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat icon={Ruler} label="Adult size" value={`${s.adult_size_cm} cm`} />
          <Stat icon={Droplet} label="Minimum tank" value={`${s.min_tank_litres} L`} />
          <Stat icon={Waves} label="Swim zone" value={zoneLabel} />
          <Stat icon={Users} label="Temperament" value={temperament} />
          <Stat icon={Fish} label="Group size" value={groupText} />
          <Stat
            icon={Thermometer}
            label="Native pH / temp"
            value={`${s.native_ph_min}–${s.native_ph_max} · ${s.native_temp_min_c}–${s.native_temp_max_c} °C`}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">Welfare notes</h2>
        <ul className="mt-3 space-y-2">
          {welfare.map((w, i) => (
            <li
              key={i}
              className="flex gap-2 rounded-xl border bg-card px-4 py-3 text-sm text-foreground"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border bg-card p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Care-data evidence
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Confidence:{" "}
              <span className="font-semibold capitalize text-foreground">
                {s.care_confidence ?? "unreviewed"}
              </span>
              {s.care_reviewed_on
                ? ` · reviewed ${new Date(`${s.care_reviewed_on}T00:00:00`).toLocaleDateString()}`
                : " · review date not recorded"}
            </p>
            {s.care_source_url ? (
              <a
                href={s.care_source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline"
              >
                {s.care_source_label ?? "View care source"}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : (
              <p className="mt-3 rounded-xl bg-warn/10 p-3 text-sm text-muted-foreground">
                A field-level care source has not yet been attached. Treat this profile as
                provisional and cross-check it before stocking.
              </p>
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

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">
          How the calculator uses this species
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The welfare score uses compatibility, swimming space and water suitability. Cycle
          readiness is a safety gate; waste load and biome are shown separately.
        </p>
        <div className="mt-4 space-y-3">
          <ScoreBlock title="Species compatibility" body={compatibilityCopy(s)} />
          <ScoreBlock title="Bioload" body={bioloadCopy(s)} />
          <ScoreBlock title="Space to swim" body={spaceCopy(s)} />
          <ScoreBlock title="Biome replication" body={biomeCopy(s)} />
          <ScoreBlock title="Regional reference" body={legalityCopy(s)} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-foreground">Related species</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Potential matches based on swim zone, temperament and water ranges. Always score the
            complete group in the builder.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map(({ s: r, reason }) => (
              <Link
                key={r.id}
                to="/species/$id"
                params={{ id: r.id }}
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
        This is a guide, not a guarantee. Individual fish vary — always check the needs of each
        species and your local regulations before you buy.
      </p>
    </div>
  );
}

function AddToTankButton({ species }: { species: Species }) {
  const navigate = useNavigate();
  const prohibited = species.legal_status === "prohibited";
  function handleAdd() {
    sessionStorage.setItem("fishtankr:pending-add", species.id);
    navigate({ to: "/", hash: "builder" });
  }
  return (
    <div className="mt-2">
      <button
        onClick={handleAdd}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" /> Add to my tank
      </button>
      {prohibited && (
        <p className="mt-2 text-xs text-muted-foreground">
          Heads up — this species is flagged as prohibited or restricted and does not affect your
          welfare score. Check current rules where you live before buying.
        </p>
      )}
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
      "it's a predator, so smaller tank mates will be eaten — a critical conflict that caps your overall score",
    );
  if (s.fin_nipper)
    flags.push("as a fin-nipper it dings compatibility when paired with long-finned fish");
  if (s.long_finned) flags.push("its long fins make it a target for known nippers");
  if (s.temperament === "aggressive")
    flags.push("its aggressive temperament clashes with peaceful community fish");
  if (s.temperament === "semi-aggressive")
    flags.push("its semi-aggressive temperament can push peaceful fish around");
  if (flags.length === 0)
    return "Peaceful temperament with no fin-nipping or predation flags — it plays well with most similarly-sized community fish.";
  return `We check every pair in your tank: ${flags.join("; ")}.`;
}

function bioloadCopy(s: Species): string {
  return `Each ${s.common_name} currently adds an experimental waste-demand value of ~${s.bioload_factor.toFixed(1)}. FishTankr uses that only for a beta screening band: it is not a validated capacity figure, pump turnover does not increase it, and it never tells you how many more fish to add.`;
}

function spaceCopy(s: Species): string {
  return `Needs at least ${s.min_tank_litres} L to have room for adult swimming and territory. ${s.active ? "This is an active swimmer, so tank length matters as much as volume." : "Not an especially active swimmer, but still needs the minimum volume."}`;
}

function biomeCopy(s: Species): string {
  return `Comes from ${BIOTOPE_LABEL[s.biotope_region]} (${s.native_habitat_type}), with a natural pH of ${s.native_ph_min}–${s.native_ph_max} and temperature of ${s.native_temp_min_c}–${s.native_temp_max_c} °C. Biome score rewards keeping species from the same region together at matching water parameters.`;
}

function legalityCopy(s: Species): string {
  if (s.legal_status === "prohibited") {
    return "Flagged as prohibited or restricted. This Australia-specific reference may not apply where you live. Check local import and keeping rules before buying.";
  }
  if (s.legal_status === "native") {
    return "This species is native to Australia. Collection, import and keeping rules vary by region; check local guidance before buying.";
  }
  return "Listed as permitted for federal import with conditions. State or territory possession rules can still apply, so review the evidence before buying.";
}
