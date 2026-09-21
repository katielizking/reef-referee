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

const GUEST_ID_KEY = "fishtankr:guest-id";
const GUEST_TOKEN_KEY = "fishtankr:guest-token";

export function rememberGuest(user: User | null, accessToken?: string | null) {
  if (typeof window === "undefined" || !user?.is_anonymous) return;
  window.sessionStorage.setItem(GUEST_ID_KEY, user.id);
  if (accessToken) window.sessionStorage.setItem(GUEST_TOKEN_KEY, accessToken);
}

export function readGuestClaim(): { guestId: string; guestToken: string } | null {
  if (typeof window === "undefined") return null;
  const guestId = window.sessionStorage.getItem(GUEST_ID_KEY);
  const guestToken = window.sessionStorage.getItem(GUEST_TOKEN_KEY);
  return guestId && guestToken ? { guestId, guestToken } : null;
}

export function forgetGuestClaim() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(GUEST_ID_KEY);
  window.sessionStorage.removeItem(GUEST_TOKEN_KEY);
}

export type Account = {
  user: User | null;
  ready: boolean;
  isSignedIn: boolean;
  isGuest: boolean;
  isMember: boolean;
  handle: string | null;
};

const AccountContext = createContext<Account | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      rememberGuest(data.session?.user ?? null, data.session?.access_token);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      rememberGuest(session?.user ?? null, session?.access_token);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
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
    () => ({ user, ready, isSignedIn, isGuest, isMember, handle: profile.data?.handle ?? null }),
    [user, ready, isSignedIn, isGuest, isMember, profile.data?.handle],
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
    forgetGuestClaim();
    await supabase.auth.signOut();
    window.location.assign("/");
  };
}
