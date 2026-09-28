import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";

import { AppShell, useProfile, profileQueryKey } from "@/components/app/AppShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listPlans } from "@/lib/api/plans.functions";
import { changeMyPlan } from "@/lib/api/profile.functions";
import { getUsage } from "@/lib/api/audits.functions";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [{ title: "Plan & billing — LocalRankLens" }, { name: "robots", content: "noindex" }],
  }),
  component: BillingPage,
});

function BillingPage() {
  const queryClient = useQueryClient();
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => listPlans() });
  const usage = useQuery({ queryKey: ["usage"], queryFn: () => getUsage() });
  const profile = useProfile();

  const switchPlan = useMutation({
    mutationFn: (plan: "free" | "pro" | "agency") => changeMyPlan({ data: { plan } }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      toast.success(`You're on the ${result.plan} plan`);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "The plan could not be changed"),
  });

  const currentPlan = profile.data?.profile?.plan ?? "free";

  return (
    <AppShell title="Plan & billing" description="Your current plan, limits and usage.">
      <div className="space-y-6">
        <Alert>
          <AlertTitle>No payment provider is connected yet</AlertTitle>
          <AlertDescription>
            Plans and limits are fully enforced, but checkout is not wired to a payment account. Plan
            switching here is a sandbox control for testing. Once the owner connects their own
            payment provider and sets BILLING_MODE=live, plans are set by the provider's webhook
            instead — see OWNER_GUIDE.md.
          </AlertDescription>
        </Alert>

        {usage.isLoading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">This month</CardTitle>
              <CardDescription>
                {usage.data?.limit === null
                  ? `${usage.data?.used} audits run — unlimited on your plan.`
                  : `${usage.data?.used} of ${usage.data?.limit} audits used. Resets on the 1st.`}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {plans.isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))
            : (plans.data ?? []).map((plan) => {
                const isCurrent = plan.key === currentPlan;
                const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
                return (
                  <Card key={plan.key} className={isCurrent ? "border-primary" : undefined}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base capitalize">{plan.name}</CardTitle>
                        {isCurrent ? <Badge>Current</Badge> : null}
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                      <p className="mt-2 font-display text-3xl font-semibold">
                        ${(plan.price_monthly_cents / 100).toFixed(0)}
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {features.map((feature) => (
                          <li key={feature} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-pass" aria-hidden />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={isCurrent ? "outline" : "default"}
                        disabled={isCurrent || switchPlan.isPending}
                        onClick={() => switchPlan.mutate(plan.key as "free" | "pro" | "agency")}
                      >
                        {isCurrent ? "Current plan" : `Switch to ${plan.name}`}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
        </div>
      </div>
    </AppShell>
  );
}
