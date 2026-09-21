import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const claimSchema = z.object({
  guestId: z.string().uuid(),
  guestToken: z.string().min(20).max(4096),
});

export const claimGuestData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => claimSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.guestId === context.userId) return { claimed: 0, status: "same_account" };
    const [{ data: oldAuth }, { data: memberAuth }] = await Promise.all([
      supabaseAdmin.auth.getUser(data.guestToken),
      supabaseAdmin.auth.admin.getUserById(context.userId),
    ]);
    const oldUser = oldAuth.user;
    const member = memberAuth.user;
    if (!oldUser || oldUser.id !== data.guestId || !oldUser.is_anonymous || oldUser.email) {
      throw new Error("The guest session could not be verified.");
    }
    if (!member || member.is_anonymous) throw new Error("Sign in before moving guest tanks.");

    const { data: result, error } = await supabaseAdmin.rpc("claim_guest_data", {
      p_guest_id: data.guestId,
      p_member_id: context.userId,
    });
    if (error) throw error;
    return result as { claimed: number; status: string };
  });
