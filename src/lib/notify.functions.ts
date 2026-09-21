import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const NOTIFY_TO = "katielizking@gmail.com";
const FROM = "FishTankr <onboarding@resend.dev>";

const payloadSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("waitlist"), email: z.string().email().max(320) }),
  z.object({
    type: z.literal("post"),
    title: z.string().min(1).max(200),
    flair: z.string().max(40).optional(),
  }),
]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Owner-only notifications. Fire-and-forget from the client after the real
 * action succeeds; a notification failure must never break the user flow.
 */
export const notifyOwner = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const resendKey = process.env["RESEND_API_KEY"];
    if (!lovableKey || !resendKey) return { sent: false as const };

    const subject =
      data.type === "waitlist"
        ? "FishTankr: new waitlist signup"
        : "FishTankr: new community post";
    const html =
      data.type === "waitlist"
        ? `<p><strong>${escapeHtml(data.email)}</strong> joined the account-backup waitlist.</p>`
        : `<p>A new community post was published:</p><p><strong>${escapeHtml(data.title)}</strong>${
            data.flair ? ` <em>(${escapeHtml(data.flair)})</em>` : ""
          }</p>`;

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({ from: FROM, to: [NOTIFY_TO], subject, html }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Resend notify failed [${response.status}]: ${errorBody}`);
      return { sent: false as const };
    }
    return { sent: true as const };
  });
