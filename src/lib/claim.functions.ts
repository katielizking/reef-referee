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
    if (data.guestId === context.userId) return { claimed: 0 };
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

    const existing = await Promise.all([
      supabaseAdmin
        .from("tanks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId),
      supabaseAdmin
        .from("tracked_tanks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId),
    ]);
    for (const result of existing) if (result.error) throw result.error;
    if (existing.some((result) => (result.count ?? 0) > 0)) return { claimed: 0 };

    const guestCounts = await Promise.all([
      supabaseAdmin
        .from("tanks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.guestId),
      supabaseAdmin
        .from("tracked_tanks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.guestId),
      supabaseAdmin
        .from("water_tests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.guestId),
    ]);
    for (const result of guestCounts) if (result.error) throw result.error;
    for (const table of ["tanks", "tracked_tanks", "water_tests"] as const) {
      const { error } = await supabaseAdmin
        .from(table)
        .update({ user_id: context.userId })
        .eq("user_id", data.guestId);
      if (error) throw error;
    }
    return { claimed: guestCounts.reduce((sum, result) => sum + (result.count ?? 0), 0) };
  });
