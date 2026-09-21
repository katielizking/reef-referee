import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { finishGuestSignIn } from "@/lib/account-actions";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Finishing sign in | FishTankr" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await finishGuestSignIn();
        if (!cancelled) {
          await queryClient.invalidateQueries();
          if (result.claimed > 0)
            toast.success("Your guest tanks and water tests have been added to your account.");
          if (result.status === "account_has_data")
            toast.info(
              "This account already has tanks, so guest tanks were not moved. Nothing has been overwritten.",
              { duration: 10000 },
            );
          await navigate({ to: "/auth" });
        }
      } catch (reason) {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : "Sign-in could not be completed.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, queryClient]);
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      {error ? (
        <div role="alert" className="rounded-2xl border bg-card p-6">
          <h1 className="font-display text-xl font-semibold">Sign-in needs another try</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            No guest data has been deleted. You can retry the transfer or continue to your account.
          </p>
          <button onClick={() => window.location.reload()} className="mt-4 block w-full underline">
            Retry
          </button>
          <a
            href="/auth"
            className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground"
          >
            Back to sign in
          </a>
        </div>
      ) : (
        <div role="status" className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Finishing your sign-in…
        </div>
      )}
    </main>
  );
}
