import {
  type AuditCategory,
  type AuditInput,
  type AuditResult,
  type CategoryScore,
  type CheckStatus,
  type Finding,
  type Impact,
  AUDIT_CATEGORIES,
} from "./types";

export const ENGINE_VERSION = "v1";

interface CheckDefinition {
  key: string;
  category: AuditCategory;
  label: string;
  weight: number;
  /** Short human description of what was observed, used in the report. */
  observed: (input: AuditInput) => string;
  evaluate: (input: AuditInput) => CheckStatus;
  /** Advice shown when the check is not a pass. */
  recommendation: (input: AuditInput, status: CheckStatus) => string;
}

/** Partial credit: a warning earns 55% of the weight, a fail earns nothing. */
const WARN_CREDIT = 0.55;

function threshold(value: number, passAt: number, warnAt: number): CheckStatus {
  if (value >= passAt) return "pass";
  if (value >= warnAt) return "warn";
  return "fail";
}

function bool(value: boolean): CheckStatus {
  return value ? "pass" : "fail";
}

function impactFromWeight(weight: number): Impact {
  if (weight >= 7) return "high";
  if (weight >= 4) return "medium";
  return "low";
}

export const CHECKS: CheckDefinition[] = [
  // ---------- Profile completeness ----------
  {
    key: "verified",
    category: "Profile completeness",
    label: "Profile is claimed and verified",
    weight: 8,
    observed: (i) => (i.isVerified ? "Verified" : "Not verified"),
    evaluate: (i) => bool(i.isVerified),
    recommendation: () =>
      "Claim and verify the profile in Google Business Profile Manager. Unverified profiles are ranked lower and can be edited by the public.",
  },
  {
    key: "name_clean",
    category: "Profile completeness",
    label: "Business name matches real-world signage",
    weight: 4,
    observed: (i) => (i.nameFreeOfKeywordStuffing ? "Clean name" : "Keywords in name"),
    evaluate: (i) => bool(i.nameFreeOfKeywordStuffing),
    recommendation: () =>
      "Remove keywords and locations from the business name. Keyword stuffing is a guideline violation and a common cause of suspensions or competitor edits.",
  },
  {
    key: "description",
    category: "Profile completeness",
    label: "Business description is substantial",
    weight: 4,
    observed: (i) => `${i.descriptionLength} characters`,
    evaluate: (i) => threshold(i.descriptionLength, 600, 250),
    recommendation: (_i, status) =>
      status === "warn"
        ? "Extend the description toward the 750-character limit, covering services, service area and what makes the business different."
        : "Write a 600-750 character description covering the main services, the areas served and the buying reasons customers care about.",
  },
  {
    key: "hours",
    category: "Profile completeness",
    label: "Regular opening hours are set",
    weight: 5,
    observed: (i) => (i.regularHoursSet ? "Hours set" : "Hours missing"),
    evaluate: (i) => bool(i.regularHoursSet),
    recommendation: () =>
      "Add accurate opening hours for every day. Profiles without hours lose the 'Open now' filter, which removes them from a large share of mobile searches.",
  },
  {
    key: "holiday_hours",
    category: "Profile completeness",
    label: "Holiday and special hours are maintained",
    weight: 3,
    observed: (i) => (i.holidayHoursSet ? "Special hours set" : "No special hours"),
    evaluate: (i) => bool(i.holidayHoursSet),
    recommendation: () =>
      "Set special hours for upcoming public holidays. Google prompts customers to confirm hours it cannot verify, which can show wrong information.",
  },
  {
    key: "local_phone",
    category: "Profile completeness",
    label: "Primary phone is a local number",
    weight: 3,
    observed: (i) => (i.localPhoneNumber ? "Local number" : "Non-local or missing"),
    evaluate: (i) => bool(i.localPhoneNumber),
    recommendation: () =>
      "Use a local area-code number as the primary phone and keep call-tracking numbers as the secondary number.",
  },
  {
    key: "website_linked",
    category: "Profile completeness",
    label: "Website is linked from the profile",
    weight: 5,
    observed: (i) => (i.websiteLinked ? "Website linked" : "No website link"),
    evaluate: (i) => bool(i.websiteLinked),
    recommendation: () =>
      "Link the website, ideally the specific location page rather than the homepage, so profile visits turn into tracked sessions.",
  },

  // ---------- Categories & services ----------
  {
    key: "primary_category",
    category: "Categories & services",
    label: "Primary category matches how customers search",
    weight: 8,
    observed: (i) => i.primaryCategory || "Not recorded",
    evaluate: (i) => bool(i.primaryCategoryMatchesSearchTerm),
    recommendation: () =>
      "The primary category is the single strongest ranking factor in Maps. Compare the top three ranking competitors for your main search term and match the category they use.",
  },
  {
    key: "secondary_categories",
    category: "Categories & services",
    label: "Relevant secondary categories are added",
    weight: 4,
    observed: (i) => `${i.secondaryCategoryCount} secondary categories`,
    evaluate: (i) => threshold(i.secondaryCategoryCount, 2, 1),
    recommendation: (_i, status) =>
      status === "warn"
        ? "Add one or two more genuinely relevant secondary categories to widen the queries the profile can appear for."
        : "Add two to four secondary categories that describe real services. Do not add categories for services the business does not offer.",
  },
  {
    key: "services_listed",
    category: "Categories & services",
    label: "Services or products are listed",
    weight: 4,
    observed: (i) => `${i.servicesOrProductsListed} items`,
    evaluate: (i) => threshold(i.servicesOrProductsListed, 8, 3),
    recommendation: (_i, status) =>
      status === "warn"
        ? "Expand the services list toward eight or more entries, each with its own short description."
        : "Add the main services or products with descriptions. These populate the profile's service menu and help Google match longer queries.",
  },
  {
    key: "attributes",
    category: "Categories & services",
    label: "Attributes are completed",
    weight: 3,
    observed: (i) => (i.attributesCompleted ? "Attributes filled" : "Attributes incomplete"),
    evaluate: (i) => bool(i.attributesCompleted),
    recommendation: () =>
      "Fill in the attributes Google offers for the category (accessibility, payments, amenities). Several attributes power search filters.",
  },

  // ---------- Reviews & reputation ----------
  {
    key: "review_count",
    category: "Reviews & reputation",
    label: "Review volume is competitive",
    weight: 8,
    observed: (i) => `${i.reviewCount} reviews`,
    evaluate: (i) => threshold(i.reviewCount, 50, 20),
    recommendation: (_i, status) =>
      status === "warn"
        ? "Keep asking. Reaching roughly the median review count of the top three local competitors usually moves the profile up the local pack."
        : "Set up a repeatable review request: a short link sent after every completed job, in person or by SMS. Never buy or incentivise reviews.",
  },
  {
    key: "average_rating",
    category: "Reviews & reputation",
    label: "Average rating is strong",
    weight: 7,
    observed: (i) => `${i.averageRating.toFixed(1)} stars`,
    evaluate: (i) => (i.averageRating >= 4.5 ? "pass" : i.averageRating >= 4.0 ? "warn" : "fail"),
    recommendation: (_i, status) =>
      status === "warn"
        ? "Work the gap between 4.0 and 4.5: read recent 3-star reviews for repeated operational complaints and fix the cause, then request reviews from satisfied regulars."
        : "Below 4.0 stars, ranking and click-through both suffer. Address the recurring complaints in the negative reviews before running acquisition.",
  },
  {
    key: "review_velocity",
    category: "Reviews & reputation",
    label: "New reviews arrive steadily",
    weight: 7,
    observed: (i) => `${i.reviewsLast30Days} in last 30 days`,
    evaluate: (i) => threshold(i.reviewsLast30Days, 4, 1),
    recommendation: (_i, status) =>
      status === "warn"
        ? "Aim for at least one review a week. Steady velocity matters more than a single burst, which can look inorganic."
        : "No recent reviews is a freshness problem. Add a review request step to the end of the normal customer process.",
  },
  {
    key: "response_rate",
    category: "Reviews & reputation",
    label: "Owner responds to reviews",
    weight: 6,
    observed: (i) => `${i.ownerResponseRatePercent}% responded`,
    evaluate: (i) => threshold(i.ownerResponseRatePercent, 90, 50),
    recommendation: (_i, status) =>
      status === "warn"
        ? "Reply to the remaining reviews, starting with anything below four stars. Replies are public and are read by prospects."
        : "Reply to every review within a few days. Responses are indexed text and visibly signal an active business.",
  },
  {
    key: "review_keywords",
    category: "Reviews & reputation",
    label: "Reviews mention specific services",
    weight: 3,
    observed: (i) => `${i.reviewsMentioningServices} mention services`,
    evaluate: (i) => threshold(i.reviewsMentioningServices, 10, 3),
    recommendation: () =>
      "When asking for a review, remind the customer what the job was ('the boiler service'). Service words in reviews help Google connect the profile to those queries. Never dictate wording.",
  },

  // ---------- Photos & media ----------
  {
    key: "photo_count",
    category: "Photos & media",
    label: "Enough photos on the profile",
    weight: 6,
    observed: (i) => `${i.photoCount} photos`,
    evaluate: (i) => threshold(i.photoCount, 50, 15),
    recommendation: (_i, status) =>
      status === "warn"
        ? "Keep adding real photos toward 50: team, premises, work in progress and finished results."
        : "Upload at least 15 genuine photos. Profiles with few photos get noticeably fewer direction requests and calls.",
  },
  {
    key: "photo_freshness",
    category: "Photos & media",
    label: "Photos added recently",
    weight: 5,
    observed: (i) => `${i.photosLast30Days} in last 30 days`,
    evaluate: (i) => threshold(i.photosLast30Days, 5, 1),
    recommendation: (_i, status) =>
      status === "warn"
        ? "Target roughly one photo a week; a recurring calendar reminder is usually enough."
        : "Add photos monthly. Freshness is a visible activity signal for both Google and customers comparing profiles.",
  },
  {
    key: "logo_cover",
    category: "Photos & media",
    label: "Logo and cover photo are set",
    weight: 3,
    observed: (i) => (i.logoAndCoverSet ? "Logo and cover set" : "Missing logo or cover"),
    evaluate: (i) => bool(i.logoAndCoverSet),
    recommendation: () =>
      "Upload a square logo and a wide cover photo. Without them Google picks an arbitrary user photo as the headline image.",
  },
  {
    key: "video",
    category: "Photos & media",
    label: "At least one video uploaded",
    weight: 2,
    observed: (i) => (i.videoUploaded ? "Video present" : "No video"),
    evaluate: (i) => bool(i.videoUploaded),
    recommendation: () =>
      "Add a short 30-second video of the premises or a typical job. Very few local competitors do this, so it is cheap differentiation.",
  },

  // ---------- Activity & engagement ----------
  {
    key: "posts",
    category: "Activity & engagement",
    label: "Profile posts published recently",
    weight: 5,
    observed: (i) => `${i.postsLast30Days} posts in last 30 days`,
    evaluate: (i) => threshold(i.postsLast30Days, 4, 1),
    recommendation: (_i, status) =>
      status === "warn"
        ? "Move to weekly posts. An offer, an update and a recent job rotate well."
        : "Publish a weekly post. Posts appear in the profile panel and are one of the few surfaces the business fully controls.",
  },
  {
    key: "qa",
    category: "Activity & engagement",
    label: "Questions and answers are seeded",
    weight: 3,
    observed: (i) => `${i.answeredQuestions} answered questions`,
    evaluate: (i) => threshold(i.answeredQuestions, 5, 2),
    recommendation: () =>
      "Post the questions customers actually ask (parking, pricing, appointments) and answer them from the business account.",
  },
  {
    key: "messaging",
    category: "Activity & engagement",
    label: "Messaging is enabled and monitored",
    weight: 2,
    observed: (i) => (i.messagingEnabled ? "Messaging on" : "Messaging off"),
    evaluate: (i) => bool(i.messagingEnabled),
    recommendation: () =>
      "Turn messaging on only if someone will answer within a day; slow replies can get the feature disabled. Otherwise leave it off deliberately.",
  },

  // ---------- Website & citations ----------
  {
    key: "nap_consistency",
    category: "Website & citations",
    label: "Name, address and phone are consistent elsewhere",
    weight: 6,
    observed: (i) => (i.napConsistentAcrossDirectories ? "Consistent" : "Inconsistencies found"),
    evaluate: (i) => bool(i.napConsistentAcrossDirectories),
    recommendation: () =>
      "Fix mismatched addresses and old phone numbers on the main directories. Conflicting data weakens Google's confidence in the listing.",
  },
  {
    key: "location_page",
    category: "Website & citations",
    label: "Website has a location page with an embedded map",
    weight: 5,
    observed: (i) => (i.locationPageWithMap ? "Location page present" : "No location page"),
    evaluate: (i) => bool(i.locationPageWithMap),
    recommendation: () =>
      "Create a page per location containing the exact NAP, opening hours, an embedded map and LocalBusiness structured data, then link the profile to it.",
  },
  {
    key: "citations",
    category: "Website & citations",
    label: "Listed on the main directories",
    weight: 4,
    observed: (i) => `${i.directoryCitationCount} citations`,
    evaluate: (i) => threshold(i.directoryCitationCount, 8, 4),
    recommendation: (_i, status) =>
      status === "warn"
        ? "Add the remaining major directories for the country and industry, keeping details identical to the profile."
        : "Claim listings on the main national directories plus two or three industry-specific ones, using identical business details.",
  },
];

export const TOTAL_WEIGHT = CHECKS.reduce((sum, check) => sum + check.weight, 0);

export function gradeFor(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

function pointsFor(status: CheckStatus, weight: number): number {
  if (status === "pass") return weight;
  if (status === "warn") return Math.round(weight * WARN_CREDIT);
  return 0;
}

/**
 * Deterministic scoring: the same observations always produce the same report.
 * Weights and thresholds live in CHECKS above so the engine stays auditable.
 */
export function runAudit(input: AuditInput): AuditResult {
  const findings: Finding[] = CHECKS.map((check) => {
    const status = check.evaluate(input);
    return {
      checkKey: check.key,
      category: check.category,
      label: check.label,
      status,
      weight: check.weight,
      pointsEarned: pointsFor(status, check.weight),
      impact: impactFromWeight(check.weight),
      recommendation: status === "pass" ? "" : check.recommendation(input, status),
      observed: check.observed(input),
    };
  });

  const categoryScores: CategoryScore[] = AUDIT_CATEGORIES.map((category) => {
    const scoped = findings.filter((f) => f.category === category);
    const possible = scoped.reduce((sum, f) => sum + f.weight, 0);
    const earned = scoped.reduce((sum, f) => sum + f.pointsEarned, 0);
    return {
      category,
      possible,
      earned,
      score: possible === 0 ? 0 : Math.round((earned / possible) * 100),
    };
  });

  const earned = findings.reduce((sum, f) => sum + f.pointsEarned, 0);
  const overallScore = Math.round((earned / TOTAL_WEIGHT) * 100);

  return {
    overallScore,
    grade: gradeFor(overallScore),
    findings,
    categoryScores,
    engineVersion: ENGINE_VERSION,
  };
}

/** Findings worth acting on first: failures and warnings ordered by weight. */
export function prioritisedActions(findings: Finding[], limit?: number): Finding[] {
  const actionable = findings
    .filter((f) => f.status !== "pass")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "fail" ? -1 : 1;
      return b.weight - a.weight;
    });
  return typeof limit === "number" ? actionable.slice(0, limit) : actionable;
}
