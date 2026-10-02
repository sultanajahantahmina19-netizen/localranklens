import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader, SiteShell } from "@/components/site/SiteShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ReportView } from "@/components/audit/ReportView";
import { runAudit } from "@/lib/audit/engine";
import { SAMPLE_AUDIT_INPUT } from "@/lib/audit/samples";

export const Route = createFileRoute("/sample-report")({
  head: () => ({
    meta: [
      { title: "Sample audit report — LocalRankLens" },
      {
        name: "description",
        content:
          "A complete example LocalRankLens report: overall score, category breakdown, prioritised actions and all 26 checks, generated from demo data.",
      },
      { property: "og:title", content: "Sample Google Business Profile audit report" },
      {
        property: "og:description",
        content: "See exactly what a LocalRankLens report contains before signing up.",
      },
      { property: "og:url", content: "/sample-report" },
    ],
    links: [{ rel: "canonical", href: "/sample-report" }],
  }),
  component: SampleReportPage,
});

function SampleReportPage() {
  const result = runAudit(SAMPLE_AUDIT_INPUT);

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Sample report"
        title="What you get after an audit"
        description="This report is generated live by the same scoring engine the app uses — from demo inputs, for a business that does not exist."
      >
        <Button asChild>
          <Link to="/auth" search={{ mode: "signup" }}>
            Run one on a real profile
          </Link>
        </Button>
      </PageHeader>

      <section className="container-page space-y-6 py-14">
        <Alert>
          <AlertTitle>Demo data</AlertTitle>
          <AlertDescription>
            “Northgate Dental Practice (demo)” is fictional sample data used to illustrate the
            report. It is not a customer and the numbers are not real performance data.
          </AlertDescription>
        </Alert>

        <ReportView
          data={{
            businessName: SAMPLE_AUDIT_INPUT.businessName,
            primaryCategory: SAMPLE_AUDIT_INPUT.primaryCategory,
            city: SAMPLE_AUDIT_INPUT.city,
            overallScore: result.overallScore,
            grade: result.grade,
            categoryScores: result.categoryScores,
            findings: result.findings,
          }}
        />
      </section>
    </SiteShell>
  );
}
