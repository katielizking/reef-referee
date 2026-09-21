import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const GUEST_KEY = "fishtankr:guest-id";

/** Remember the guest session id so its tanks can be claimed after sign-in. */
export function rememberGuestId(user: User | null) {
  if (typeof window === "undefined") return;
  if (user?.is_anonymous) window.localStorage.setItem(GUEST_KEY, user.id);
}

export function readGuestId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(GUEST_KEY);
}

export function forgetGuestId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_KEY);
}

export type Account = {
  user: User | null;
  ready: boolean;
  /** Signed in with a real email address. */
  isSignedIn: boolean;
  /** Browser-only session with no email attached. */
  isGuest: boolean;
  /** Email confirmed, so community posting is allowed. */
  isMember: boolean;
  handle: string | null;
};

export function useSession(): { user: User | null; ready: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, ready };
}

export function useAccount(): Account {
  const { user, ready } = useSession();
  const isGuest = !!user && !!user.is_anonymous;
  const isSignedIn = !!user && !user.is_anonymous;
  const isMember = isSignedIn && !!user.email_confirmed_at;
  const profile = useQuery({
    queryKey: ["community", "profile", user?.id],
    enabled: isSignedIn,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_profiles")
        .select("handle")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as { handle: string } | null) ?? null;
    },
  });
  return {
    user,
    ready,
    isSignedIn,
    isGuest,
    isMember,
    handle: profile.data?.handle ?? null,
  };
}

/** Sign out cleanly: stop queries, drop cached data, clear the session. */
export function useSignOut() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    forgetGuestId();
    await supabase.auth.signOut();
    window.location.assign("/");
  };
}
