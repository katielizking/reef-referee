import { supabase } from "@/integrations/supabase/client";
import { forgetGuestClaim, readGuestClaim, rememberGuest } from "./account";
import { claimGuestData } from "./claim.functions";

/** Capture proof immediately before changing identities, not just at page load. */
export async function prepareGuestSignIn() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const session = data.session;
  if (!session?.user.is_anonymous) return;
  rememberGuest(session.user, session.access_token);
  const claim = readGuestClaim();
  if (claim?.guestId !== session.user.id || claim.guestToken !== session.access_token) {
    throw new Error(
      "Enable browser session storage to carry guest tanks across, or create an account with email instead.",
    );
  }
}

export async function createEmailAccount(email: string, password: string, origin: string) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session?.user.is_anonymous) {
    // Supabase requires verification BEFORE adding a password to an anonymous user.
    // Never persist a password while waiting for the email link.
    const result = await supabase.auth.updateUser(
      { email: email.trim() },
      { emailRedirectTo: `${origin}/auth?setup=password` },
    );
    if (result.error) throw result.error;
    return { needsVerification: true, guestUpgrade: true };
  }
  const result = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: `${origin}/auth` },
  });
  if (result.error) throw result.error;
  return { needsVerification: !result.data.session, guestUpgrade: false };
}

let pendingClaim: Promise<{ claimed: number; status?: string }> | undefined;
export function finishGuestSignIn() {
  // Callback remounts (including Strict Mode) must share one transfer request.
  pendingClaim ??= (async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session || data.session.user.is_anonymous) {
      throw new Error("Sign-in did not finish. Please try again.");
    }
    const claim = readGuestClaim();
    if (!claim || claim.guestId === data.session.user.id) {
      forgetGuestClaim();
      return { claimed: 0 };
    }
    const result = await claimGuestData({ data: claim });
    if (result.status !== "account_has_data") forgetGuestClaim();
    return result;
  })().finally(() => {
    pendingClaim = undefined;
  });
  return pendingClaim;
}
