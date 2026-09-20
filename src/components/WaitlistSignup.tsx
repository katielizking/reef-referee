import { useState, type FormEvent } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { joinAccountWaitlist } from "@/lib/commercial";

export function WaitlistSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await joinAccountWaitlist(email);
      setDone(true);
      setEmail("");
      toast.success("You're on the account-saving update list");
    } catch (error) {
      toast.error("Couldn't join the list", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={compact ? "" : "rounded-2xl border bg-card p-5"}>
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold text-foreground">
            Want to keep your tanks safe?
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Saved tanks currently live in this browser and can disappear if its data is cleared.
            Leave your email and we’ll tell you when account backup is ready.
          </p>
          {done ? (
            <p className="mt-3 text-sm font-semibold text-primary">
              You’re on the list. We’ll only email you about account backup.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="account-waitlist-email">
                Email address
              </label>
              <input
                id="account-waitlist-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="min-h-11 min-w-0 flex-1 rounded-xl border bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                disabled={busy}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                Notify me
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
