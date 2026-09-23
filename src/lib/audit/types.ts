/**
 * Shared types for the audit engine. Kept free of server/browser specifics so
 * the engine can run in a server function, in a test, or in the browser.
 */

export type CheckStatus = "pass" | "warn" | "fail";
export type Impact = "high" | "medium" | "low";

export const AUDIT_CATEGORIES = [
  "Profile completeness",
  "Categories & services",
  "Reviews & reputation",
  "Photos & media",
  "Activity & engagement",
  "Website & citations",
] as const;

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

/** Raw observations a person (or agency) records about a Google Business Profile. */
export interface AuditInput {
  businessName: string;
  primaryCategory: string;
  city: string;
  websiteUrl?: string;

  // Profile completeness
  isVerified: boolean;
  nameFreeOfKeywordStuffing: boolean;
  descriptionLength: number;
  regularHoursSet: boolean;
  holidayHoursSet: boolean;
  localPhoneNumber: boolean;
  websiteLinked: boolean;

  // Categories & services
  primaryCategoryMatchesSearchTerm: boolean;
  secondaryCategoryCount: number;
  servicesOrProductsListed: number;
  attributesCompleted: boolean;

  // Reviews & reputation
  reviewCount: number;
  averageRating: number;
  reviewsLast30Days: number;
  ownerResponseRatePercent: number;
  reviewsMentioningServices: number;

  // Photos & media
  photoCount: number;
  photosLast30Days: number;
  logoAndCoverSet: boolean;
  videoUploaded: boolean;

  // Activity & engagement
  postsLast30Days: number;
  answeredQuestions: number;
  messagingEnabled: boolean;

  // Website & citations
  napConsistentAcrossDirectories: boolean;
  locationPageWithMap: boolean;
  directoryCitationCount: number;
}

export interface Finding {
  checkKey: string;
  category: AuditCategory;
  label: string;
  status: CheckStatus;
  weight: number;
  pointsEarned: number;
  impact: Impact;
  recommendation: string;
  observed: string;
}

export interface CategoryScore {
  category: AuditCategory;
  score: number;
  earned: number;
  possible: number;
}

export interface AuditResult {
  overallScore: number;
  grade: string;
  findings: Finding[];
  categoryScores: CategoryScore[];
  engineVersion: string;
}
