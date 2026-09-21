import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { claimGuestData } from "@/lib/claim.functions";
import { forgetGuestClaim, readGuestClaim } from "@/lib/account";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Finishing sign in | FishTankr" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session || data.session.user.is_anonymous)
          throw new Error("Sign-in did not finish. Please try again.");
        const claim = readGuestClaim();
        if (claim) await claimGuestData({ data: claim });
        forgetGuestClaim();
        if (!cancelled) await navigate({ to: "/auth" });
      } catch (reason) {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : "Sign-in could not be completed.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      {error ? (
        <div role="alert" className="rounded-2xl border bg-card p-6">
          <h1 className="font-display text-xl font-semibold">Sign-in needs another try</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
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
