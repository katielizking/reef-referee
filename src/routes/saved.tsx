import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useSessionTanks } from "@/lib/data";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved tanks — Fishtankr" },
      { name: "description", content: "Tanks you have saved in this browser session." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SavedTanks,
});

function SavedTanks() {
  const { data, isLoading } = useSessionTanks();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Saved tanks</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Stored against your anonymous session on this device.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-3xl border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No saved tanks yet. Build one and hit Save.
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open builder
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
                    className="flex items-center justify-between rounded-2xl border bg-card p-4 hover:bg-muted"
                  >
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.length_cm}×{t.width_cm}×{t.height_cm} cm · {litres} L ·{" "}
                        {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-xs text-primary">View →</span>
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
