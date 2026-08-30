import { supabase } from "@/integrations/supabase/client";
import type { Scorecard } from "./scoring";

export async function joinAccountWaitlist(email: string): Promise<void> {
  const { error } = await supabase.rpc("join_account_waitlist", {
    p_email: email,
  });
  if (error) throw error;
}

export function recordShopOutbound(
  shopId: string,
  destination: "website" | "affiliate" | "map" | "claim",
) {
  void supabase.rpc("record_shop_outbound", {
    p_shop_id: shopId,
    p_destination: destination,
  });
}

export function recordScoreEvent(scorecard: Scorecard) {
  if (scorecard.overall === null) return;
  const verdict =
    scorecard.overall < 45
      ? "do-not-stock"
      : scorecard.overall < 75 || scorecard.capReason
        ? "risky"
        : "safe";
  const issueCodes = [
    ...scorecard.readiness.issues,
    ...scorecard.compatibility.issues,
    ...(scorecard.space.issues ?? []),
    ...(scorecard.water.issues ?? []),
  ].map((issue) => issue.code);
  void supabase.rpc("record_score_event", {
    p_verdict: verdict,
    p_issue_codes: [...new Set(issueCodes)],
  });
}

export async function submitContactRequest(
  email: string,
  topic: string,
  message: string,
): Promise<void> {
  const { error } = await supabase.rpc("submit_contact_request", {
    p_email: email,
    p_topic: topic,
    p_message: message,
  });
  if (error) throw error;
}
