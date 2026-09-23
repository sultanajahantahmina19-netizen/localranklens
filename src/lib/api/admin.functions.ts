import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Every admin function verifies the role through RLS-respecting has_role first. */
async function assertAdmin(supabase: {
  rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" | "user" }) => Promise<{ data: unknown }>;
}, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Forbidden: administrator access required");
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [users, audits, locations, newUsers, auditsThisMonth, messages, events, plansBreakdown] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("audits").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("locations").select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo),
        supabaseAdmin
          .from("audits")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString()),
        supabaseAdmin
          .from("contact_messages")
          .select("id", { count: "exact", head: true })
          .eq("status", "new"),
        supabaseAdmin
          .from("activity_events")
          .select("event_type, created_at")
          .gte("created_at", thirtyDaysAgo)
          .limit(1000),
        supabaseAdmin.from("profiles").select("plan"),
      ]);

    const planCounts = (plansBreakdown.data ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.plan] = (acc[row.plan] ?? 0) + 1;
      return acc;
    }, {});

    const featureUse = (events.data ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.event_type] = (acc[row.event_type] ?? 0) + 1;
      return acc;
    }, {});

    // Active = ran at least one audit in the last 30 days.
    const { data: activeRows } = await supabaseAdmin
      .from("audits")
      .select("user_id")
      .gte("created_at", thirtyDaysAgo)
      .limit(5000);
    const activeUsers = new Set((activeRows ?? []).map((r) => r.user_id)).size;

    const totalUsers = users.count ?? 0;
    const paidUsers = (planCounts["pro"] ?? 0) + (planCounts["agency"] ?? 0);

    return {
      totalUsers,
      newUsersLast30Days: newUsers.count ?? 0,
      activeUsersLast30Days: activeUsers,
      totalAudits: audits.count ?? 0,
      auditsThisMonth: auditsThisMonth.count ?? 0,
      totalLocations: locations.count ?? 0,
      unreadMessages: messages.count ?? 0,
      planCounts,
      featureUse,
      paidUsers,
      freeToPaidRate: totalUsers === 0 ? 0 : Math.round((paidUsers / totalUsers) * 1000) / 10,
    };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(5).max(100).default(20),
        search: z.string().trim().max(120).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const from = (data.page - 1) * data.pageSize;
    let query = supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, company_name, plan, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + data.pageSize - 1);

    if (data.search) {
      query = query.or(`email.ilike.%${data.search}%,full_name.ilike.%${data.search}%`);
    }

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r) => r.id);
    const { data: roles } = ids.length
      ? await supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids)
      : { data: [] as { user_id: string; role: string }[] };
    const { data: auditCounts } = ids.length
      ? await supabaseAdmin.from("audits").select("user_id").in("user_id", ids)
      : { data: [] as { user_id: string }[] };

    const auditsByUser = (auditCounts ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.user_id] = (acc[row.user_id] ?? 0) + 1;
      return acc;
    }, {});

    return {
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
      users: (rows ?? []).map((row) => ({
        ...row,
        roles: (roles ?? []).filter((r) => r.user_id === row.id).map((r) => r.role),
        auditCount: auditsByUser[row.id] ?? 0,
      })),
    };
  });

export const setUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ userId: z.string().uuid(), plan: z.enum(["free", "pro", "agency"]) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ plan: data.plan })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "user"]),
        grant: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId && data.role === "admin" && !data.grant) {
      throw new Error("You cannot remove your own administrator access.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setMessageStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(["new", "read", "archived"]) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("contact_messages")
      .update({ status: data.status })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Daily counts for the admin analytics chart. */
export const getAdminTrends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - 29 * 86400000);
    since.setUTCHours(0, 0, 0, 0);

    const [{ data: signups }, { data: audits }] = await Promise.all([
      supabaseAdmin.from("profiles").select("created_at").gte("created_at", since.toISOString()),
      supabaseAdmin.from("audits").select("created_at").gte("created_at", since.toISOString()),
    ]);

    const days: { date: string; signups: number; audits: number }[] = [];
    for (let i = 0; i < 30; i += 1) {
      const day = new Date(since.getTime() + i * 86400000);
      days.push({ date: day.toISOString().slice(0, 10), signups: 0, audits: 0 });
    }
    const index = new Map(days.map((d) => [d.date, d]));

    for (const row of signups ?? []) {
      const key = row.created_at.slice(0, 10);
      const bucket = index.get(key);
      if (bucket) bucket.signups += 1;
    }
    for (const row of audits ?? []) {
      const key = row.created_at.slice(0, 10);
      const bucket = index.get(key);
      if (bucket) bucket.audits += 1;
    }

    return days;
  });
