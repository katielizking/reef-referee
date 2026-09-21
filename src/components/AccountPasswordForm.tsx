import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function AccountPasswordForm({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirm("");
      toast.success("Password saved. Your tanks are still here.");
      onComplete();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Password could not be saved. Request a fresh email link and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">Use at least eight characters.</p>
      <label className="block text-sm font-medium">
        New password
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border bg-background px-3"
        />
      </label>
      <label className="block text-sm font-medium">
        Confirm password
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border bg-background px-3"
        />
      </label>
      <button
        disabled={busy}
        className="min-h-11 w-full rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
