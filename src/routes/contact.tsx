import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { z } from "zod";
import { toast } from "sonner";

import { PageHeader, SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, sendContactMessage } from "@/lib/api/contact.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact LocalRankLens" },
      {
        name: "description",
        content:
          "Questions about audits, plans or reselling reports? Send a message and the site owner will reply by email.",
      },
      { property: "og:title", content: "Contact — LocalRankLens" },
      { property: "og:description", content: "Send a question to the site owner." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

type ContactValues = z.infer<typeof contactSchema>;

function ContactPage() {
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const send = useMutation({
    mutationFn: (values: ContactValues) => sendContactMessage({ data: values }),
    onSuccess: () => {
      toast.success("Message sent — thanks, we'll be in touch.");
      form.reset();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "The message could not be sent"),
  });

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        description="Messages land in the site owner's inbox inside the admin area. Please allow a couple of working days for a reply."
      />
      <section className="container-page max-w-2xl py-14">
        <Card>
          <CardContent className="pt-6">
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => send.mutate(values))}
              noValidate
            >
              <div>
                <Label htmlFor="name">Your name</Label>
                <Input id="name" className="mt-2" {...form.register("name")} />
                {form.formState.errors.name ? (
                  <p className="mt-1 text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" className="mt-2" {...form.register("email")} />
                {form.formState.errors.email ? (
                  <p className="mt-1 text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" className="mt-2" {...form.register("subject")} />
                {form.formState.errors.subject ? (
                  <p className="mt-1 text-sm text-destructive">
                    {form.formState.errors.subject.message}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" rows={6} className="mt-2" {...form.register("message")} />
                {form.formState.errors.message ? (
                  <p className="mt-1 text-sm text-destructive">
                    {form.formState.errors.message.message}
                  </p>
                ) : null}
              </div>
              <Button type="submit" disabled={send.isPending}>
                {send.isPending ? "Sending…" : "Send message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
