import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, FishSymbol } from "lucide-react";
import { useSessionTanks } from "@/lib/data";

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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        My tanks
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Saved to your browser, kept private to you.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-3xl border bg-card p-10 text-center">
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
                <li key={t.id}>
                  <Link
                    to="/t/$slug"
                    params={{ slug: t.share_slug }}
                    className="flex items-center justify-between rounded-2xl border bg-card p-4 transition-colors hover:bg-muted"
                  >
                    <div>
                      <div className="font-display font-semibold text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.length_cm}×{t.width_cm}×{t.height_cm} cm · {litres} L ·{" "}
                        {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary">View →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
