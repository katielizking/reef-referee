import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GUEST_ID_KEY = "fishtankr:guest-id";
const GUEST_TOKEN_KEY = "fishtankr:guest-token";

export function rememberGuest(user: User | null, accessToken?: string | null) {
  if (typeof window === "undefined" || !user?.is_anonymous) return;
  try {
    window.sessionStorage.setItem(GUEST_ID_KEY, user.id);
    if (accessToken) window.sessionStorage.setItem(GUEST_TOKEN_KEY, accessToken);
  } catch {
    // Browsing and email upgrades still work when session storage is unavailable.
  }
}

export function readGuestClaim(): { guestId: string; guestToken: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const guestId = window.sessionStorage.getItem(GUEST_ID_KEY);
    const guestToken = window.sessionStorage.getItem(GUEST_TOKEN_KEY);
    return guestId && guestToken ? { guestId, guestToken } : null;
  } catch {
    return null;
  }
}

export function forgetGuestClaim() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(GUEST_ID_KEY);
    window.sessionStorage.removeItem(GUEST_TOKEN_KEY);
  } catch {
    // Storage may be blocked by the browser.
  }
}

let initialSession: ReturnType<typeof initialiseSession> | undefined;
async function initialiseSession() {
  const result = await supabase.auth.getSession();
  if (result.error) throw result.error;
  if (result.data.session) return result.data.session;
  const guest = await supabase.auth.signInAnonymously();
  if (guest.error) throw guest.error;
  return guest.data.session;
}

export type Account = {
  user: User | null;
  ready: boolean;
  isSignedIn: boolean;
  isGuest: boolean;
  isMember: boolean;
  handle: string | null;
  profileReady: boolean;
  profileError: boolean;
  isRecovery: boolean;
};

const AccountContext = createContext<Account | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  useEffect(() => {
    let active = true;
    let revision = 0;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      revision++;
      setUser(session?.user ?? null);
      rememberGuest(session?.user ?? null, session?.access_token);
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
      if (event === "SIGNED_OUT") setIsRecovery(false);
      if (session) setReady(true);
    });
    const startedAt = revision;
    initialSession ??= initialiseSession();
    void initialSession
      .then((session) => {
        if (!active) return;
        if (revision === startedAt) {
          setUser(session?.user ?? null);
          rememberGuest(session?.user ?? null, session?.access_token);
        }
        setReady(true);
      })
      .catch(() => {
        if (active) {
          setReady(true);
          toast.error("Your session could not start. Refresh the page to try again.");
        }
      })
      .finally(() => {
        initialSession = undefined;
      });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const isGuest = !!user?.is_anonymous;
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
      return data as { handle: string } | null;
    },
  });
  const value = useMemo(
    () => ({
      user,
      ready,
      isSignedIn,
      isGuest,
      isMember,
      handle: profile.data?.handle ?? null,
      profileReady: !isSignedIn || !profile.isPending,
      profileError: profile.isError,
      isRecovery,
    }),
    [
      user,
      ready,
      isSignedIn,
      isGuest,
      isMember,
      profile.data?.handle,
      profile.isPending,
      profile.isError,
      isRecovery,
    ],
  );
  return createElement(AccountContext.Provider, { value }, children);
}

export function useAccount(): Account {
  const account = useContext(AccountContext);
  if (!account) throw new Error("useAccount must be used inside AccountProvider");
  return account;
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Could not sign out. Please try again.");
      return;
    }
    forgetGuestClaim();
    window.location.assign("/");
  };
}
