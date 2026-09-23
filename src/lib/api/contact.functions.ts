import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  subject: z.string().trim().min(3, "Please add a subject").max(150),
  message: z.string().trim().min(20, "Please give us a little more detail").max(2000),
});

/**
 * Public endpoint. Validated server-side and rate limited per email address so
 * the inbox cannot be flooded from the marketing site.
 */
export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("email", data.email)
      .gte("created_at", since);

    if ((count ?? 0) >= 3) {
      throw new Error("You've already sent a few messages in the last hour. We'll reply shortly.");
    }

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    });

    if (error) throw new Error("We couldn't send your message. Please try again.");
    return { ok: true };
  });
