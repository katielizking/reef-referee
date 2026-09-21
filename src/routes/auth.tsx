import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Fish, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { forgetGuestClaim, useAccount } from "@/lib/account";
import { communityWrite } from "@/lib/community";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account | FishTankr" },
      { name: "description", content: "Create a FishTankr account or sign in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring";

function AuthPage() {
  const account = useAccount();
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "create" && password !== confirm) return toast.error("Passwords do not match.");
    setBusy(true);
    setMessage("");
    try {
      if (mode === "create") {
        const { data: sessionData } = await supabase.auth.getSession();
        const current = sessionData.session?.user;
        const result = current?.is_anonymous
          ? await supabase.auth.updateUser({ email, password })
          : await supabase.auth.signUp({ email, password });
        if (result.error) throw result.error;
        const { data: updatedSession } = await supabase.auth.getSession();
        forgetGuestClaim();
        if (updatedSession.session && !updatedSession.session.user.is_anonymous) {
          toast.success("Account created. Your saved tanks are still here.");
          await navigate({ to: "/auth" });
        } else {
          setMessage(
            "Check your email to confirm your account, then sign in. Your guest tanks remain safe in this browser.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        await navigate({ to: "/saved" });
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
        <label className="block text-sm font-medium">
          Password
          <input
            className={fieldClass}
            type="password"
            autoComplete={mode === "create" ? "new-password" : "current-password"}
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {mode === "create" && (
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
          {mode === "create" ? "Create account" : "Sign in"}
        </button>
        {message && (
          <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm">
            {message}
          </p>
        )}
      </form>
      {mode === "create" && (
        <p className="text-xs text-muted-foreground">
          You can save tanks straight away. Confirm your email before posting in Community.
        </p>
      )}
    </div>
  );
}

function ChooseHandle() {
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
