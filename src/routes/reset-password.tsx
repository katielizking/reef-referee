import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";
import { AccountPasswordForm } from "@/components/AccountPasswordForm";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset password | FishTankr" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPassword,
});

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring";

function ResetPassword() {
  const account = useAccount();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  // The provider catches PASSWORD_RECOVERY even if Auth consumes the URL before
  // this route mounts. A query parameter alone is not proof of recovery.
  const recovery = account.isRecovery && account.isSignedIn;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (!account.ready)
    return (
      <main role="status" className="mx-auto max-w-lg px-4 py-12">
        Checking your reset link…
      </main>
    );
  if (recovery)
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <div className="space-y-4 rounded-3xl border bg-card p-8">
          <h1 className="font-display text-2xl font-semibold">Choose a new password</h1>
          <AccountPasswordForm onComplete={() => window.location.assign("/saved")} />
        </div>
      </main>
    );
  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <form onSubmit={submit} className="space-y-4 rounded-3xl border bg-card p-8">
        <h1 className="font-display text-2xl font-semibold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          We’ll email you a secure link to choose a new password. If a link has expired, request a
          fresh one here.
        </p>
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
        <button
          disabled={busy || sent}
          className="min-h-11 w-full rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Please wait…" : sent ? "Reset link requested" : "Email reset link"}
        </button>
        {sent && (
          <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm">
            If an account uses that email, you’ll receive a reset link. Check your inbox and spam
            folder.
          </p>
        )}
        <Link to="/auth" className="block text-center text-sm text-primary underline">
          Back to sign in
        </Link>
      </form>
    </main>
  );
}
