import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";

import { AppShell, EmptyState } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportView, type ReportData } from "@/components/audit/ReportView";
import { getAudit } from "@/lib/api/audits.functions";
import type { AuditCategory, CategoryScore, CheckStatus, Finding } from "@/lib/audit/types";

export const Route = createFileRoute("/_authenticated/audits/$auditId")({
  head: () => ({
    meta: [{ title: "Audit report — LocalRankLens" }, { name: "robots", content: "noindex" }],
  }),
  component: AuditDetailPage,
});

function AuditDetailPage() {
  const { auditId } = Route.useParams();
  const query = useQuery({
    queryKey: ["audit", auditId],
    queryFn: () => getAudit({ data: { auditId } }),
  });

  const report: ReportData | null = query.data
    ? {
        businessName: query.data.audit.business_name,
        primaryCategory: query.data.audit.primary_category,
        city: query.data.audit.city,
        overallScore: query.data.audit.overall_score,
        grade: query.data.audit.grade,
        createdAt: query.data.audit.created_at,
        categoryScores: (query.data.audit.category_scores as unknown as CategoryScore[]) ?? [],
        findings: query.data.findings.map<Finding>((f) => ({
          checkKey: f.check_key,
          category: f.category as AuditCategory,
          label: f.label,
          status: f.status as CheckStatus,
          weight: f.weight,
          pointsEarned: f.points_earned,
          impact: f.impact as Finding["impact"],
          recommendation: f.recommendation,
          observed: "",
        })),
      }
    : null;

  return (
    <AppShell
      title={report?.businessName ?? "Audit report"}
      description={report ? `${report.primaryCategory} · ${report.city}` : undefined}
      actions={
        report ? (
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print / PDF
          </Button>
        ) : null
      }
    >
      {query.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">We couldn't load this report.</p>
      ) : !report ? (
        <EmptyState
          title="Report not found"
          description="This audit no longer exists, or it belongs to another account."
          action={
            <Button asChild>
              <Link to="/audits">Back to history</Link>
            </Button>
          }
        />
      ) : (
        <ReportView data={report} />
      )}
    </AppShell>
  );
}
