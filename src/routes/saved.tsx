import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, FishSymbol, Sparkles } from "lucide-react";
import { useSessionTanks } from "@/lib/data";
import { PRESET_KEY, TANK_PRESETS } from "@/lib/presets";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "My tanks — FishTankr" },
      { name: "description", content: "Tanks you've saved in this browser." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SavedTanks,
});

function SavedTanks() {
  const { data, isLoading } = useSessionTanks();
  const navigate = useNavigate();

  function loadPreset(id: string) {
    sessionStorage.setItem(PRESET_KEY, id);
    navigate({ to: "/" });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        My tanks
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Reopen, edit or share the tanks saved in this browser.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-3xl border bg-card p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FishSymbol className="h-6 w-6" aria-hidden />
            </div>
            <p className="font-display text-base font-semibold text-foreground">
              No saved tanks yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Build a tank and hit Save — it'll appear here.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-95"
            >
              Open the builder
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {data.map((t) => {
              const litres = Math.round((t.length_cm * t.width_cm * t.height_cm) / 1000);
              return (
                <li
                  key={t.id}
                  className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-display font-semibold text-foreground">
                      {t.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.length_cm}×{t.width_cm}×{t.height_cm} cm · {litres} L ·{" "}
                      {new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to="/t/$slug"
                      params={{ slug: t.share_slug }}
                      className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      View
                    </Link>
                    <Link
                      to="/"
                      search={{ tank: t.share_slug }}
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:brightness-95"
                    >
                      Edit tank
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="font-display text-lg font-semibold text-foreground">Start from a template</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            One-click starters. They open the builder pre-filled — tweak as you go.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {TANK_PRESETS.map((p) => {
              const l = (p.base.length_cm ?? 0) * (p.base.width_cm ?? 0) * (p.base.height_cm ?? 0) / 1000;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => loadPreset(p.id)}
                    className="group flex h-full w-full flex-col rounded-2xl border bg-card p-4 text-left transition-colors hover:border-primary/50"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display font-semibold text-foreground group-hover:text-primary">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {p.region}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {p.base.length_cm}×{p.base.width_cm}×{p.base.height_cm} cm · ~{Math.round(l)} L
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}
