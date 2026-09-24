import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScoreDial } from "./ScoreDial";
import { AUDIT_CATEGORIES, type CategoryScore, type CheckStatus, type Finding } from "@/lib/audit/types";
import { cn } from "@/lib/utils";

export interface ReportData {
  businessName: string;
  primaryCategory: string;
  city: string;
  overallScore: number;
  grade: string;
  categoryScores: CategoryScore[];
  findings: Finding[];
  createdAt?: string;
}

const STATUS_META: Record<CheckStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pass: { label: "Pass", icon: CheckCircle2, className: "text-pass" },
  warn: { label: "Needs work", icon: AlertTriangle, className: "text-warn" },
  fail: { label: "Missing", icon: XCircle, className: "text-fail" },
};

function StatusIcon({ status }: { status: CheckStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return <Icon className={cn("h-4 w-4 shrink-0", meta.className)} aria-hidden />;
}

export function PriorityActions({ findings }: { findings: Finding[] }) {
  const actions = findings
    .filter((f) => f.status !== "pass")
    .sort((a, b) => (a.status === b.status ? b.weight - a.weight : a.status === "fail" ? -1 : 1))
    .slice(0, 5);

  if (actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nothing outstanding</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Every check passed. Re-run the audit next month to catch drift in reviews, photos and
          posting activity.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Do these first</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((finding, index) => (
          <div key={finding.checkKey} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium">{finding.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{finding.recommendation}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {finding.impact} impact
                </Badge>
                <span className="text-xs text-muted-foreground">
                  +{finding.weight - finding.pointsEarned} points available
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function CategoryBreakdown({ categoryScores }: { categoryScores: CategoryScore[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Score by area</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoryScores.map((category) => (
          <div key={category.category}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{category.category}</span>
              <span className="text-muted-foreground">{category.score}%</span>
            </div>
            <Progress value={category.score} className="mt-2 h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FindingsChecklist({ findings }: { findings: Finding[] }) {
  return (
    <div className="space-y-6">
      {AUDIT_CATEGORIES.map((category) => {
        const scoped = findings.filter((f) => f.category === category);
        if (scoped.length === 0) return null;
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-base">{category}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {scoped.map((finding) => (
                <div key={finding.checkKey} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <StatusIcon status={finding.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{finding.label}</p>
                      <span className="text-xs text-muted-foreground">{finding.observed}</span>
                    </div>
                    {finding.recommendation ? (
                      <p className="mt-1 text-sm text-muted-foreground">{finding.recommendation}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {finding.pointsEarned}/{finding.weight}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function ReportView({ data }: { data: ReportData }) {
  const counts = data.findings.reduce<Record<CheckStatus, number>>(
    (acc, f) => {
      acc[f.status] += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0 },
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-8 pt-6 md:flex-row md:items-start">
          <ScoreDial score={data.overallScore} grade={data.grade} />
          <div className="flex-1">
            <h2 className="font-display text-2xl font-semibold">{data.businessName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.primaryCategory} · {data.city}
              {data.createdAt ? ` · audited ${new Date(data.createdAt).toLocaleDateString()}` : ""}
            </p>
            <dl className="mt-6 grid grid-cols-3 gap-4">
              {(["pass", "warn", "fail"] as CheckStatus[]).map((status) => (
                <div key={status} className="rounded-lg border border-border p-3">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusIcon status={status} />
                    {STATUS_META[status].label}
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-semibold">{counts[status]}</dd>
                </div>
              ))}
            </dl>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <PriorityActions findings={data.findings} />
        <CategoryBreakdown categoryScores={data.categoryScores} />
      </div>

      <FindingsChecklist findings={data.findings} />
    </div>
  );
}
