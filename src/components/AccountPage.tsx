import { Link, Outlet, useMatchRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Fish, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";
import { createEmailAccount, prepareGuestSignIn } from "@/lib/account-actions";
import { AccountPasswordForm } from "@/components/AccountPasswordForm";
import { communityWrite } from "@/lib/community";

export function AccountPage() {
  const matchRoute = useMatchRoute();
  return matchRoute({ to: "/auth/callback" }) ? <Outlet /> : <AuthPage />;
}

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring";

function AuthPage() {
  const account = useAccount();
  const { setup } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  if (!account.ready || (account.isSignedIn && !account.profileReady))
    return (
      <main className="mx-auto max-w-lg px-4 py-12" role="status">
        Checking your account…
      </main>
    );
  if (account.isMember && setup === "password")
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <div className="space-y-4 rounded-3xl border bg-card p-8">
          <h1 className="font-display text-2xl font-semibold">Finish creating your account</h1>
          <p className="text-sm text-muted-foreground">
            Email confirmed. Choose a password to sign in next time. Your guest tanks stay attached
            to this account.
          </p>
          <AccountPasswordForm
            onComplete={() => {
              void navigate({ to: "/auth", search: {} });
            }}
          />
        </div>
      </main>
    );
  if (account.profileError)
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <p role="alert">
          Your profile could not load. Refresh to try again, or{" "}
          <Link to="/saved" className="underline">
            view your tanks
          </Link>
          .
        </p>
      </main>
    );
  if (account.isSignedIn && !account.isMember) return <AwaitingConfirmation />;
  if (account.isSignedIn && !account.handle) return <ChooseHandle />;
  if (account.isSignedIn) return <SignedIn />;
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-12">
      <div className="rounded-3xl border bg-card p-6 shadow-panel sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Fish aria-hidden />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold">Your FishTankr account</h1>
            <p className="text-sm text-muted-foreground">
              Keep your tanks with you across devices.
            </p>
          </div>
        </div>
        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create account</TabsTrigger>
            <TabsTrigger value="signin">Sign in</TabsTrigger>
          </TabsList>
          <TabsContent value="create">
            <CredentialsForm mode="create" />
          </TabsContent>
          <TabsContent value="signin">
            <CredentialsForm mode="signin" />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function CredentialsForm({ mode }: { mode: "create" | "signin" }) {
  const account = useAccount();
  const guestUpgrade = mode === "create" && account.isGuest;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "create" && !guestUpgrade && password !== confirm)
      return toast.error("Passwords do not match.");
    setBusy(true);
    setMessage("");
    try {
      if (mode === "create") {
        const result = await createEmailAccount(email, password, window.location.origin);
        setMessage(
          result.guestUpgrade
            ? "Check your email. Follow the link to confirm your address and choose a password. Your saved tanks and tracker stay with this account. You can keep using them while you wait."
            : "Check your email to confirm your account, then sign in.",
        );
        setPassword("");
        setConfirm("");
      } else {
        await prepareGuestSignIn();
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Welcome back.");
        await navigate({ to: "/auth/callback" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not complete that request.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      await prepareGuestSignIn();
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) throw result.error;
      if (!result.redirected) window.location.assign("/auth/callback");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in could not start.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 space-y-4">
      <button
        type="button"
        disabled={busy}
        onClick={google}
        className="min-h-11 w-full rounded-xl border bg-background px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60"
      >
        Continue with Google
      </button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or use email
        <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={submit} className="space-y-4">
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
        {!guestUpgrade && (
          <label className="block text-sm font-medium">
            Password
            <input
              className={fieldClass}
              type="password"
              autoComplete={mode === "create" ? "new-password" : "current-password"}
              minLength={mode === "create" ? 8 : undefined}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        {mode === "create" && !guestUpgrade && (
          <label className="block text-sm font-medium">
            Confirm password
            <input
              className={fieldClass}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
        )}
        {mode === "signin" && (
          <div className="text-right">
            <Link to="/reset-password" className="text-sm text-primary underline">
              Forgot password?
            </Link>
          </div>
        )}
        <button
          disabled={busy}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {mode === "create"
            ? guestUpgrade
              ? "Send confirmation email"
              : "Create account"
            : "Sign in"}
        </button>
        {message && (
          <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm">
            {message}
          </p>
        )}
      </form>
      {mode === "create" && (
        <p className="text-xs text-muted-foreground">
          {guestUpgrade
            ? "First confirm your email, then choose a password. This keeps your guest tanks and water tests attached to you."
            : "Confirm your email before posting in Community."}
        </p>
      )}
    </div>
  );
}

function ChooseHandle() {
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <form
        className="space-y-4 rounded-3xl border bg-card p-8"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          try {
            await communityWrite("profile", { handle });
            await queryClient.invalidateQueries({ queryKey: ["community", "profile"] });
            toast.success("Community name saved.");
            await navigate({ to: "/saved" });
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "That name is unavailable.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1 className="font-display text-2xl font-semibold">Choose your community name</h1>
        <p className="text-sm text-muted-foreground">
          This is the name people will see on your posts. Use 3–24 letters, numbers or underscores,
          starting with a letter.
        </p>
        <label className="block text-sm font-medium">
          Community name
          <input
            className={fieldClass}
            required
            minLength={3}
            maxLength={24}
            pattern="[A-Za-z][A-Za-z0-9_]*"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
        </label>
        <button
          disabled={busy}
          className="min-h-11 w-full rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
        >
          Save and continue
        </button>
      </form>
    </main>
  );
}

function AwaitingConfirmation() {
  const account = useAccount();
  return (
    <main className="mx-auto max-w-lg px-4 py-12 text-center">
      <div className="rounded-3xl border bg-card p-8">
        <h1 className="font-display text-2xl font-semibold">Confirm your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to {account.user?.email}. You can save tanks now. Confirm your
          email before choosing a community name or posting.
        </p>
        <Link
          to="/saved"
          className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground"
        >
          View my tanks
        </Link>
      </div>
    </main>
  );
}

function SignedIn() {
  return (
    <main className="mx-auto max-w-lg px-4 py-12 text-center">
      <div className="rounded-3xl border bg-card p-8">
        <h1 className="font-display text-2xl font-semibold">You’re signed in</h1>
        <p className="mt-2 text-muted-foreground">Your tanks can now follow you between devices.</p>
        <Link
          to="/saved"
          className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground"
        >
          View my tanks
        </Link>
      </div>
    </main>
  );
}
