import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminTrends } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — LocalRankLens admin" }] }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const trends = useQuery({ queryKey: ["admin", "trends"], queryFn: () => getAdminTrends() });

  return (
    <AppShell
      title="Analytics"
      description="First-party product data only. Page-view traffic comes from your hosting analytics."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signups and audits, last 30 days</CardTitle>
          <CardDescription>Counted directly from the database, per day (UTC).</CardDescription>
        </CardHeader>
        <CardContent>
          {trends.isLoading ? (
            <Skeleton className="h-72 rounded-lg" />
          ) : trends.isError ? (
            <p className="text-sm text-destructive">Trends could not be loaded.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="signups" name="Signups" fill="var(--color-chart-2)" />
                  <Bar dataKey="audits" name="Audits" fill="var(--color-chart-1)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">What to track before listing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Registrations per week, share of new users who run a first audit, users active in the last 30 days, repeat audits per location, and — once billing is live — paid conversions and churn from the payment provider.</p>
          <p>Traffic, top landing pages and referrers come from the hosting platform's analytics, which keeps visitor tracking out of this app.</p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
