import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, FilePlus2 } from "lucide-react";

import { AppShell, EmptyState, StatCard } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getUsage, listAudits } from "@/lib/api/audits.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LocalRankLens" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const audits = useQuery({ queryKey: ["audits"], queryFn: () => listAudits() });
  const usage = useQuery({ queryKey: ["usage"], queryFn: () => getUsage() });

  const rows = audits.data ?? [];
  const latest = rows[0];
  const averageScore = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + r.overall_score, 0) / rows.length)
    : null;

  return (
    <AppShell
      title="Dashboard"
      description="Your audit activity and remaining quota."
      actions={
        <Button asChild>
          <Link to="/audit/new">
            <FilePlus2 className="mr-2 h-4 w-4" />
            New audit
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {usage.isLoading || audits.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard label="Audits run" value={rows.length} hint="All time" />
            <StatCard
              label="Latest score"
              value={latest ? `${latest.overall_score}` : "—"}
              hint={latest ? `Grade ${latest.grade} · ${latest.business_name}` : "No audits yet"}
            />
            <StatCard
              label="Average score"
              value={averageScore ?? "—"}
              hint="Across your audits"
            />
            <StatCard
              label="This month"
              value={
                usage.data
                  ? usage.data.limit === null
                    ? `${usage.data.used} / ∞`
                    : `${usage.data.used} / ${usage.data.limit}`
                  : "—"
              }
              hint={usage.data ? `${usage.data.plan} plan` : undefined}
            />
          </>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent audits</CardTitle>
          <Link
            to="/audits"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            View all <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {audits.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : audits.isError ? (
            <p className="text-sm text-destructive">
              We couldn't load your audits. Refresh the page to try again.
            </p>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No audits yet"
              description="Run your first audit to see where a Google Business Profile is losing ground, and what to fix first."
              action={
                <Button asChild>
                  <Link to="/audit/new">Run your first audit</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {rows.slice(0, 6).map((row) => (
                <li key={row.id}>
                  <Link
                    to="/audits/$auditId"
                    params={{ auditId: row.id }}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-primary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{row.business_name}</span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {row.primary_category} · {row.city} ·{" "}
                        {new Date(row.created_at).toLocaleDateString()}
                      </span>
                    </span>
                    <Badge variant="secondary">
                      {row.overall_score} · {row.grade}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
