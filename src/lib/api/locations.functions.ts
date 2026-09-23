import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type LocationRow = Database["public"]["Tables"]["locations"]["Row"];

const PLAN_LOCATION_LIMITS: Record<string, number | null> = {
  free: 1,
  pro: 10,
  agency: null,
};

export const locationSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required").max(120),
  primaryCategory: z.string().trim().min(2, "Primary category is required").max(120),
  city: z.string().trim().min(2, "City is required").max(120),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  websiteUrl: z.string().trim().max(300).url("Enter a full URL").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const listLocations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("locations")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => locationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();
    const limit = PLAN_LOCATION_LIMITS[profile?.plan ?? "free"] ?? null;

    if (limit !== null) {
      const { count } = await supabase
        .from("locations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if ((count ?? 0) >= limit) {
        throw new Error(
          `Your plan includes ${limit} saved ${limit === 1 ? "location" : "locations"}. Upgrade to save more.`,
        );
      }
    }

    const { data: row, error } = await supabase
      .from("locations")
      .insert({
        user_id: userId,
        business_name: data.businessName,
        primary_category: data.primaryCategory,
        city: data.city,
        country: data.country || null,
        website_url: data.websiteUrl || null,
        phone: data.phone || null,
        notes: data.notes || null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { locationId: row.id };
  });

export const updateLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    locationSchema.extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("locations")
      .update({
        business_name: data.businessName,
        primary_category: data.primaryCategory,
        city: data.city,
        country: data.country || null,
        website_url: data.websiteUrl || null,
        phone: data.phone || null,
        notes: data.notes || null,
      })
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("locations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Score history for one location, used for the progress chart. */
export const getLocationHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ locationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("audits")
      .select("id, overall_score, grade, created_at")
      .eq("location_id", data.locationId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return rows ?? [];
  });
