import { Link, createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
import { useMemo, useState } from "react";
import { useSpecies } from "@/lib/data";
import type { Species } from "@/lib/types";
import { Info } from "lucide-react";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "What fish should I get? A 7-question quiz | FishTankr" },
      {
        name: "description",
        content:
          "Answer 7 quick questions and get 3–5 freshwater fish species matched to your tank size, experience and preferences. care needs and compatibility in mind.",
      },
      { property: "og:title", content: "What fish should I get? | FishTankr" },
      {
        property: "og:description",
        content:
          "A 7-question quiz that recommends freshwater fish species for your tank. care and compatibility focused.",
      },
      { property: "og:url", content: absoluteUrl("/quiz") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/quiz") }],
  }),
  component: QuizPage,
});

type Answers = {
  litres: number; // bucketed
  experience: "beginner" | "some" | "experienced";
  vibe: "peaceful" | "showpiece" | "biotope" | "oddballs";
  hardness: "soft" | "neutral" | "hard";
  maintenance: "low" | "medium" | "high";
  solo: "solo" | "either";
  style: "schooling" | "centrepiece" | "mixed";
};

const questions: Array<{
  key: keyof Answers;
  q: string;
  options: { value: string; label: string; hint?: string }[];
}> = [
  {
    key: "litres",
    q: "Roughly how big is your tank?",
    options: [
      { value: "40", label: "Nano (up to 40L)" },
      { value: "80", label: "Small (40–80L)" },
      { value: "150", label: "Medium (80–150L)" },
      { value: "300", label: "Large (150L+)" },
    ],
  },
  {
    key: "experience",
    q: "How much fishkeeping experience do you have?",
    options: [
      { value: "beginner", label: "This is my first tank" },
      { value: "some", label: "I've kept a tank or two" },
      { value: "experienced", label: "I know what I'm doing" },
    ],
  },
  {
    key: "vibe",
    q: "What kind of tank do you want?",
    options: [
      { value: "peaceful", label: "Peaceful community — lots of small fish" },
      { value: "showpiece", label: "One or two colourful showpieces" },
      { value: "biotope", label: "Biotope — one region done properly" },
      { value: "oddballs", label: "Something unusual" },
    ],
  },
  {
    key: "hardness",
    q: "What's your tap water like? (or what would you like to match)",
    options: [
      {
        value: "soft",
        label: "Soft & slightly acidic (rainwater / tank water)",
      },
      { value: "neutral", label: "Neutral" },
      { value: "hard", label: "Hard & alkaline (bore / limestone areas)" },
    ],
  },
  {
    key: "maintenance",
    q: "How much weekly maintenance are you up for?",
    options: [
      { value: "low", label: "Low — a bit every fortnight" },
      { value: "medium", label: "Medium — weekly 20% water change" },
      { value: "high", label: "High — I enjoy it" },
    ],
  },
  {
    key: "solo",
    q: "Want a fish that can be kept alone?",
    options: [
      { value: "solo", label: "Yes — a fish with solo potential" },
      { value: "either", label: "No preference" },
    ],
  },
  {
    key: "style",
    q: "How do you want the tank to feel?",
    options: [
      { value: "schooling", label: "Movement — schools of small fish" },
      {
        value: "centrepiece",
        label: "Presence — a couple of larger characters",
      },
      { value: "mixed", label: "A bit of both" },
    ],
  },
];

const HARDNESS_PH: Record<Answers["hardness"], [number, number]> = {
  soft: [5.5, 6.8],
  neutral: [6.8, 7.5],
  hard: [7.5, 8.6],
};

function scoreSpecies(sp: Species, a: Answers): number {
  let score = 50;

  // Tank size — must fit
  if (Number(sp.min_tank_litres) > a.litres) return -1;
  const headroom = a.litres - Number(sp.min_tank_litres);
  score += Math.min(20, headroom / 5);

  // Experience — small, peaceful, hardy → beginner-friendly
  const beginnerFriendly =
    sp.temperament === "peaceful" && Number(sp.adult_size_cm) < 8 && !sp.predatory;
  if (a.experience === "beginner") {
    if (beginnerFriendly) score += 12;
    else score -= 15;
  }
  if (a.experience === "experienced" && !beginnerFriendly) score += 4;

  // Vibe
  if (a.vibe === "peaceful" && sp.temperament === "peaceful") score += 10;
  if (a.vibe === "peaceful" && sp.temperament === "aggressive") score -= 25;
  if (a.vibe === "showpiece" && Number(sp.adult_size_cm) >= 8) score += 12;
  if (a.vibe === "showpiece" && Number(sp.adult_size_cm) < 4) score -= 6;
  if (a.vibe === "oddballs" && (sp.predatory || Number(sp.adult_size_cm) >= 15)) score += 10;

  // Biome / hardness match via native pH
  const [phLo, phHi] = HARDNESS_PH[a.hardness];
  const spLo = Number(sp.native_ph_min);
  const spHi = Number(sp.native_ph_max);
  const overlap = Math.min(phHi, spHi) - Math.max(phLo, spLo);
  if (overlap > 0.2) score += 8;
  else score -= 8;

  // Biotope preference
  if (a.vibe === "biotope") {
    // Biotope purists reward regional coherence — we boost every species, ranking happens on group later
    score += 4;
  }

  // Maintenance — high bioload species need more work
  const load = Number(sp.bioload_factor);
  if (a.maintenance === "low" && load > 1.2) score -= 10;
  if (a.maintenance === "high" && load > 1.0) score += 3;

  // Style
  if (a.style === "schooling" && sp.is_schooling) score += 12;
  if (a.style === "schooling" && !sp.is_schooling) score -= 6;
  if (a.style === "centrepiece" && !sp.is_schooling && Number(sp.adult_size_cm) >= 7) score += 12;

  return score;
}

function QuizPage() {
  const { data: species } = useSpecies();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQ = questions[step];
  const total = questions.length;
  const progress = showResults ? 100 : Math.round((step / total) * 100);

  const results = useMemo(() => {
    if (!showResults || !species) return [];
    const a = answers as Answers;
    const scored = species
      .map((sp) => ({ sp, score: scoreSpecies(sp, a) }))
      .filter((r) => r.score > 0)
      .sort((x, y) => y.score - x.score);

    // If biotope vibe, boost top species from the most-represented biome
    if (a.vibe === "biotope" && scored.length > 0) {
      const counts: Record<string, number> = {};
      scored.slice(0, 12).forEach((r) => {
        counts[r.sp.biotope_region] = (counts[r.sp.biotope_region] ?? 0) + 1;
      });
      const topBiome = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (topBiome) {
        scored.forEach((r) => {
          if (r.sp.biotope_region === topBiome) r.score += 15;
        });
        scored.sort((x, y) => y.score - x.score);
      }
    }

    return scored.slice(0, 5);
  }, [showResults, answers, species]);

  const choose = (value: string) => {
    const next = {
      ...answers,
      [currentQ.key]: currentQ.key === "litres" ? Number(value) : value,
    };
    setAnswers(next as Partial<Answers>);
    if (step + 1 === total) setShowResults(true);
    else setStep(step + 1);
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setShowResults(false);
  };

  const startBuilderWithPicks = () => {
    if (results.length === 0) return;
    const ids = results.slice(0, 3).map((r) => r.sp.id);
    sessionStorage.setItem("fishtankr:pending-add", JSON.stringify(ids));
    window.location.href = "/";
  };

  return (
    <main className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-10">
      <h1 className="font-display text-3xl font-bold tracking-[-.035em] sm:text-4xl text-foreground">
        What fish should I get?
      </h1>
      <p className="mt-2 text-muted-foreground">
        Seven quick questions. We'll match you against 40+ freshwater species.
      </p>

      <div className="mt-6 h-2 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!showResults && (
        <div className="mt-6 rounded-[1.5rem] border bg-card p-4 sm:mt-8 sm:rounded-2xl sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Question {step + 1} of {total}
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-foreground">{currentQ.q}</h2>
          <div className="mt-4 grid gap-2">
            {currentQ.options.map((o) => (
              <button
                key={o.value}
                onClick={() => choose(o.value)}
                className="min-h-14 rounded-xl border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-muted"
              >
                {o.label}
                {o.hint && <span className="ml-1 text-xs text-muted-foreground">— {o.hint}</span>}
              </button>
            ))}
          </div>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="mt-4 inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
          )}
        </div>
      )}

      {showResults && (
        <div className="mt-8">
          <h2 className="font-display text-2xl font-semibold">Your matches</h2>
          {results.length === 0 && (
            <p className="mt-2 text-muted-foreground">
              No good matches — your tank might be too small for anything in our list. Try a bigger
              size.
            </p>
          )}
          <div className="mt-4 grid gap-3">
            {results.map(({ sp, score }) => (
              <Link
                key={sp.id}
                to="/species/$id"
                params={{ id: sp.id }}
                className="group flex items-start justify-between gap-3 rounded-[1.25rem] border bg-card p-4 sm:rounded-2xl sm:p-5 transition-colors hover:border-primary/50"
              >
                <div>
                  <p className="font-display text-lg font-semibold text-foreground group-hover:text-primary">
                    {sp.common_name}
                  </p>
                  <p className="text-sm italic text-muted-foreground">{sp.scientific_name}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {sp.biotope_region} · {sp.temperament} · min {sp.min_tank_litres}L
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {Math.min(99, Math.round(score))}
                </span>
              </Link>
            ))}
          </div>

          {results.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={startBuilderWithPicks}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-95"
              >
                Start a tank with the top 3
              </button>
              <button
                onClick={restart}
                className="rounded-xl border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Retake the quiz
              </button>
            </div>
          )}

          <p className="mt-6 flex items-start gap-2 rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              These are starting points, not a stocking plan. Add them in the builder to see if your
              filter, plants and other choices actually work together.
            </span>
          </p>
        </div>
      )}
    </main>
  );
}
