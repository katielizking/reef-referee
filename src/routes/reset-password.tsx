import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset password | FishTankr" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPassword,
});

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [recovery, setRecovery] = useState(
    typeof window !== "undefined" &&
      (window.location.hash.includes("type=recovery") ||
        new URLSearchParams(window.location.search).get("type") === "recovery"),
  );
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (recovery) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Password updated.");
        window.location.assign("/saved");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(true);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <form onSubmit={submit} className="space-y-4 rounded-3xl border bg-card p-8">
        <h1 className="font-display text-2xl font-semibold">
          {recovery ? "Choose a new password" : "Reset your password"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {recovery
            ? "Use at least eight characters."
            : "We’ll email you a secure link to choose a new password."}
        </p>
        {recovery ? (
          <label className="block text-sm font-medium">
            New password
            <input
              className={fieldClass}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        ) : (
          <label className="block text-sm font-medium">
            Email
            <input
              className={fieldClass}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        )}
        <button
          disabled={busy}
          className="min-h-11 w-full rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Please wait…" : recovery ? "Set new password" : "Email reset link"}
        </button>
        {sent && (
          <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm">
            Check your inbox for the reset link.
          </p>
        )}
        <Link to="/auth" className="block text-center text-sm text-primary underline">
          Back to sign in
        </Link>
      </form>
    </main>
  );
}
