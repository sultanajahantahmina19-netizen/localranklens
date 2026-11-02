/**
 * Shared types for the website SEO audit engine. Kept free of server/browser
 * specifics so the engine can run in a server function or in a test.
 */

export type SiteCheckStatus = "pass" | "warn" | "fail" | "not_tested";
export type Priority = "critical" | "high" | "medium" | "low";

export const SITE_AUDIT_CATEGORIES = [
  "Technical SEO",
  "On-page SEO",
  "Performance",
  "Mobile readiness",
  "Basic accessibility",
] as const;

export type SiteAuditCategory = (typeof SITE_AUDIT_CATEGORIES)[number];

/** Maximum points each category can contribute to the overall 0-100 score. */
export const CATEGORY_POINT_LIMITS: Record<SiteAuditCategory, number> = {
  "Technical SEO": 25,
  "On-page SEO": 25,
  Performance: 25,
  "Mobile readiness": 15,
  "Basic accessibility": 10,
};

export interface SiteFinding {
  checkKey: string;
  category: SiteAuditCategory;
  label: string;
  status: SiteCheckStatus;
  /** Points this check can contribute when it passes. */
  weight: number;
  pointsEarned: number;
  priority: Priority;
  /** Human-readable evidence summary, e.g. "Title is 84 characters". */
  observed: string;
  /** Structured evidence captured from the real response (status codes, counts…). */
  evidence: Record<string, unknown>;
  /** Why the check matters, in plain language. */
  explanation: string;
  /** What to do when the check is not a pass. Empty for passes. */
  recommendation: string;
  /** Optional concrete snippet showing how to fix it. */
  fixExample?: string;
  /** True when automated evidence is incomplete and a human should confirm. */
  manualVerification?: boolean;
}

export interface SiteCategoryScore {
  category: SiteAuditCategory;
  earned: number;
  possible: number;
  score: number;
}

export interface SiteAuditResult {
  overallScore: number;
  grade: string;
  findings: SiteFinding[];
  categoryScores: SiteCategoryScore[];
  testedCount: number;
  notTestedCount: number;
  criticalCount: number;
  warningCount: number;
  engineVersion: string;
}

export interface PsiMetricValue {
  value: number | null;
  display: string | null;
  score: number | null;
  unit: string;
}

export interface PsiOpportunity {
  id: string;
  title: string;
  displayValue: string | null;
}

export interface PsiStrategyResult {
  strategy: "mobile" | "desktop";
  available: boolean;
  error?: string;
  performanceScore: number | null;
  metrics: Record<string, PsiMetricValue>;
  opportunities: PsiOpportunity[];
}

export interface PsiSummary {
  available: boolean;
  error?: string;
  mobile?: PsiStrategyResult;
  desktop?: PsiStrategyResult;
}

export interface CrawledPage {
  url: string;
  status: number | null;
  title: string | null;
  metaDescription: string | null;
  bytes: number | null;
  error?: string;
}

/** What the local visibility section of the report shows. */
export interface LocalFinding {
  key: string;
  label: string;
  status: SiteCheckStatus;
  weight: number;
  pointsEarned: number;
  observed: string;
  explanation: string;
  recommendation?: string;
  manualVerification?: boolean;
}

export interface LocalReadinessResult {
  score: number;
  earned: number;
  possible: number;
  findings: LocalFinding[];
  disclaimer: string;
}

/**
 * Google ranks local results on relevance, distance and prominence. This
 * score only measures how ready the website itself is to support local
 * search — it is not a Google ranking and never promises positions.
 */
export const LOCAL_READINESS_DISCLAIMER =
  "This Local Visibility Readiness score measures how ready your website is to support local search. It is not Google's ranking score. Google ranks local results using relevance, distance and prominence, along with many other signals — a high readiness score does not guarantee a position in Google Search or Maps.";
