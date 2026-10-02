import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { PageHeader, SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listPlans } from "@/lib/api/plans.functions";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — LocalRankLens plans and limits" },
      {
        name: "description",
        content:
          "Start free with three Google Business Profile audits a month. Paid plans add higher audit limits, more saved locations and white-label reports.",
      },
      { property: "og:title", content: "Pricing — LocalRankLens" },
      {
        property: "og:description",
        content: "Free, Solo and Agency plans for Google Business Profile audits.",
      },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: PricingPage,
});

function PricingPage() {
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => listPlans() });

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Pricing"
        title="Simple plans, enforced limits"
        description="Every plan runs the same 26-check audit. Paid plans raise the monthly audit quota, saved locations and reporting options."
      />

      <section className="container-page py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.isLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)
            : (plans.data ?? []).map((plan) => {
                const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
                return (
                  <Card key={plan.key} className={plan.key === "pro" ? "border-primary" : undefined}>
                    <CardHeader>
                      <CardTitle className="capitalize">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <p className="mt-2 font-display text-4xl font-semibold">
                        ${(plan.price_monthly_cents / 100).toFixed(0)}
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      </p>
                      {plan.price_yearly_cents > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          or ${(plan.price_yearly_cents / 100).toFixed(0)} a year
                        </p>
                      ) : null}
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-pass" aria-hidden />
                          {plan.audits_per_month === null
                            ? "Unlimited audits"
                            : `${plan.audits_per_month} audits per month`}
                        </li>
                        <li className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-pass" aria-hidden />
                          {plan.location_limit === null
                            ? "Unlimited saved locations"
                            : `${plan.location_limit} saved ${plan.location_limit === 1 ? "location" : "locations"}`}
                        </li>
                        {features.map((feature) => (
                          <li key={feature} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-pass" aria-hidden />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button asChild className="w-full" variant={plan.key === "pro" ? "default" : "outline"}>
                        <Link to="/auth" search={{ mode: "signup" }}>
                          {plan.key === "free" ? "Start free" : `Choose ${plan.name}`}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-surface-subtle p-6">
          <h2 className="font-display text-lg font-semibold">About paid plans</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Checkout is not connected to a payment account yet, so paid plans cannot be purchased
            today. Plan limits are fully built and enforced; connecting a payment provider is a
            configuration step for the site owner. See the{" "}
            <Link to="/business" className="underline">
              business overview
            </Link>{" "}
            for details.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
