import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell, StatCard } from "@/components/app/AppShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminOverview } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin overview — LocalRankLens" }] }),
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const overview = useQuery({ queryKey: ["admin", "overview"], queryFn: () => getAdminOverview() });
  const d = overview.data;

  return (
    <AppShell title="Admin overview" description="Live counts from the database. Nothing here is estimated.">
      {overview.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : overview.isError || !d ? (
        <p className="text-sm text-destructive">The overview could not be loaded.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Registered users" value={d.totalUsers} />
            <StatCard label="New users" value={d.newUsersLast30Days} hint="Last 30 days" />
            <StatCard label="Active users" value={d.activeUsersLast30Days} hint="Ran an audit in 30 days" />
            <StatCard label="Unread messages" value={d.unreadMessages} />
            <StatCard label="Audits" value={d.totalAudits} hint={`${d.auditsThisMonth} this month`} />
            <StatCard label="Saved locations" value={d.totalLocations} />
            <StatCard label="Users on paid plans" value={d.paidUsers} />
            <StatCard label="Free → paid" value={`${d.freeToPaidRate}%`} hint="Share of users on a paid plan" />
          </div>

          <Alert>
            <AlertTitle>Revenue</AlertTitle>
            <AlertDescription>
              No payment provider is connected, so there is no revenue to report. Users on paid plans
              here were set in sandbox mode or by an admin. Once billing is live, revenue should be
              read from the payment provider's dashboard, which is the source of truth.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Users by plan</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {["free", "pro", "agency"].map((plan) => (
                    <li key={plan} className="flex justify-between">
                      <span className="capitalize">{plan}</span>
                      <span className="font-medium">{d.planCounts[plan] ?? 0}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feature use, last 30 days</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(d.featureUse).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No product events recorded yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {Object.entries(d.featureUse)
                      .sort((a, b) => b[1] - a[1])
                      .map(([event, count]) => (
                        <li key={event} className="flex justify-between">
                          <span>{event.replace(/_/g, " ")}</span>
                          <span className="font-medium">{count}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
