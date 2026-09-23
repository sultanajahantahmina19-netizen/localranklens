import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);

    return {
      profile,
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        fullName: z.string().trim().max(120).optional().or(z.literal("")),
        companyName: z.string().trim().max(120).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.fullName || null,
        company_name: data.companyName || null,
      })
      .eq("id", context.userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Development/self-serve plan switch. In production a payment provider webhook
 * owns this column — see docs/OWNER_GUIDE.md. Guarded so it can be turned off
 * with one environment variable once real billing is connected.
 */
export const changeMyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ plan: z.enum(["free", "pro", "agency"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (process.env["BILLING_MODE"] === "live") {
      throw new Error(
        "Billing is in live mode: plans are set by the payment provider, not from the app.",
      );
    }

    const { error } = await context.supabase
      .from("profiles")
      .update({ plan: data.plan })
      .eq("id", context.userId);

    if (error) throw new Error(error.message);

    await context.supabase.from("activity_events").insert({
      user_id: context.userId,
      event_type: "plan_changed",
      metadata: { plan: data.plan, mode: "sandbox" },
    });

    return { ok: true, plan: data.plan };
  });

/**
 * One-time bootstrap: the first signed-in user can grant themselves the admin
 * role. Once any admin exists this is refused, so it cannot be used to escalate.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (error) throw new Error(error.message);
    if ((count ?? 0) > 0) {
      throw new Error("An administrator already exists. Ask them to grant you access.");
    }

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });

    if (insertError) throw new Error(insertError.message);
    return { ok: true };
  });
