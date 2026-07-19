import { createFileRoute, Link, useRouter, useNavigate, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Fish, Ruler, Droplet, Thermometer, Users, Waves, AlertTriangle, Info, Leaf, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Species } from "@/lib/types";
import { BIOTOPE_LABEL } from "@/lib/types";

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
    .filter((s) => s.legal_status !== "prohibited")
    .filter((s) => {
      // temperament / behavioural compatibility
      if (s.predatory || target.predatory) return false;
      if (s.temperament === "aggressive" && target.temperament === "peaceful") return false;
      if (target.temperament === "aggressive" && s.temperament === "peaceful") return false;
      if (s.fin_nipper && target.long_finned) return false;
      if (target.fin_nipper && s.long_finned) return false;
      // water params overlap
      if (s.native_ph_max < target.native_ph_min || s.native_ph_min > target.native_ph_max) return false;
      if (s.native_temp_max_c < target.native_temp_min_c || s.native_temp_min_c > target.native_temp_max_c) return false;
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
      return { meta: [{ title: "Species — FishTankr" }, { name: "robots", content: "noindex" }] };
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
      ],
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
      <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
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
        <AlertTriangle className="h-3.5 w-3.5" /> Prohibited in Australia
      </span>
    );
  }
  if (s.legal_status === "native") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-lime/30 px-2.5 py-1 text-xs font-semibold text-foreground">
        <Leaf className="h-3.5 w-3.5" /> Australian native
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      <Info className="h-3.5 w-3.5" /> Permitted in Australia
    </span>
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
    welfare.push(`This is a social species. Keep in groups of at least ${s.min_group_size}; smaller groups cause chronic stress.`);
  }
  if (s.fin_nipper) {
    welfare.push("Known to nip fins. Avoid keeping with long-finned tank mates such as bettas, angelfish or guppies.");
  }
  if (s.long_finned) {
    welfare.push("Has long, delicate fins. Vulnerable to fin-nippers and strong currents.");
  }
  if (s.predatory) {
    welfare.push("A predator. Will eat any tank mate small enough to fit in its mouth.");
  }
  if (s.temperament === "aggressive") {
    welfare.push("Territorial and aggressive. Needs careful tank-mate selection and often more space than the minimum suggests.");
  }
  welfare.push(`Native habitat: ${s.native_habitat_type}.`);
  if (s.legal_note) welfare.push(s.legal_note);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to the builder
      </Link>

      <header className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            <Fish className="h-3.5 w-3.5" /> {BIOTOPE_LABEL[s.biotope_region]}
          </span>
          <LegalBadge s={s} />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{s.common_name}</h1>
        <p className="italic text-muted-foreground">{s.scientific_name}</p>
        <AddToTankButton species={s} />
      </header>

      <section className="mt-8">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">At a glance</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat icon={Ruler} label="Adult size" value={`${s.adult_size_cm} cm`} />
          <Stat icon={Droplet} label="Minimum tank" value={`${s.min_tank_litres} L`} />
          <Stat icon={Waves} label="Swim zone" value={zoneLabel} />
          <Stat icon={Users} label="Temperament" value={temperament} />
          <Stat icon={Fish} label="Group size" value={groupText} />
          <Stat icon={Thermometer} label="Native pH / temp" value={`${s.native_ph_min}–${s.native_ph_max} · ${s.native_temp_min_c}–${s.native_temp_max_c} °C`} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">Welfare notes</h2>
        <ul className="mt-3 space-y-2">
          {welfare.map((w, i) => (
            <li key={i} className="flex gap-2 rounded-xl border bg-card px-4 py-3 text-sm text-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">How the calculator uses this species</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          FishTankr scores your tank on five things. Here's what this fish contributes to each.
        </p>
        <div className="mt-4 space-y-3">
          <ScoreBlock title="Species compatibility" body={compatibilityCopy(s)} />
          <ScoreBlock title="Bioload" body={bioloadCopy(s)} />
          <ScoreBlock title="Space to swim" body={spaceCopy(s)} />
          <ScoreBlock title="Biome replication" body={biomeCopy(s)} />
          <ScoreBlock title="Australian legality" body={legalityCopy(s)} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-foreground">Related species</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Peaceful matches based on swim zone, temperament and water parameters.
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
        This is a guide, not a guarantee. Individual fish vary — always check the needs of each species and your local regulations before you buy.
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
          Heads up — this species is prohibited in Australia and will cap your tank's overall score.
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
  if (s.predatory) flags.push("it's a predator, so smaller tank mates will be eaten — a critical conflict that caps your overall score");
  if (s.fin_nipper) flags.push("as a fin-nipper it dings compatibility when paired with long-finned fish");
  if (s.long_finned) flags.push("its long fins make it a target for known nippers");
  if (s.temperament === "aggressive") flags.push("its aggressive temperament clashes with peaceful community fish");
  if (s.temperament === "semi-aggressive") flags.push("its semi-aggressive temperament can push peaceful fish around");
  if (flags.length === 0) return "Peaceful temperament with no fin-nipping or predation flags — it plays well with most similarly-sized community fish.";
  return `We check every pair in your tank: ${flags.join("; ")}.`;
}

function bioloadCopy(s: Species): string {
  return `Each ${s.common_name} adds a bioload of ~${s.bioload_factor.toFixed(1)} to the tank. That's compared against your filter turnover, plant density and maintenance schedule to work out how heavily stocked you are.`;
}

function spaceCopy(s: Species): string {
  return `Needs at least ${s.min_tank_litres} L to have room for adult swimming and territory. ${s.active ? "This is an active swimmer, so tank length matters as much as volume." : "Not an especially active swimmer, but still needs the minimum volume."}`;
}

function biomeCopy(s: Species): string {
  return `Comes from ${BIOTOPE_LABEL[s.biotope_region]} (${s.native_habitat_type}), with a natural pH of ${s.native_ph_min}–${s.native_ph_max} and temperature of ${s.native_temp_min_c}–${s.native_temp_max_c} °C. Biome score rewards keeping species from the same region together at matching water parameters.`;
}

function legalityCopy(s: Species): string {
  if (s.legal_status === "prohibited") {
    return "Prohibited for private keeping in Australia. Adding this species caps the tank's overall score at 30 — swap for a legal alternative.";
  }
  if (s.legal_status === "native") {
    return "Australian native. Doesn't cost you legality points, but some states require permits to keep natives — check your state's fisheries rules before you buy.";
  }
  return "Permitted for the aquarium trade in Australia. No legality issues.";
}
