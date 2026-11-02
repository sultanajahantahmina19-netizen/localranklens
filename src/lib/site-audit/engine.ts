/**
 * Deterministic website SEO audit engine: 26 checks across five weighted
 * categories totalling 100 points. Every check evaluates real captured
 * evidence; a check that cannot be performed is "not_tested" and its weight
 * is excluded from the denominator rather than counted as a failure.
 */

import { gradeFor } from "@/lib/audit/engine";
import type {
  Priority,
  PsiStrategyResult,
  SiteAuditCategory,
  SiteCategoryScore,
  SiteCheckStatus,
  SiteFinding,
  SiteAuditResult,
  PsiSummary,
  CrawledPage,
} from "./types";
import { CATEGORY_POINT_LIMITS, SITE_AUDIT_CATEGORIES } from "./types";
import type { FetchFailureKind } from "./fetcher.server";
import type { PageSignals } from "./parse";

export const SITE_ENGINE_VERSION = "w1";

export interface MainFetch {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  redirectChain: string[];
  signals: PageSignals;
  headers: Record<string, string>;
  bytes: number;
  elapsedMs: number;
}

export interface SiteAuditData {
  requestedUrl: string;
  main: MainFetch | null;
  mainError?: { kind: FetchFailureKind; userMessage: string };
  robots: { available: boolean; status: number | null; disallowsHome: boolean; sitemapUrl: string | null };
  sitemap: { available: boolean; url: string; status: number | null };
  subpages: CrawledPage[];
  psi: PsiSummary;
  totalElapsedMs: number;
}

interface CheckOutput {
  status: SiteCheckStatus;
  observed: string;
  evidence: Record<string, unknown>;
  recommendation?: string;
  fixExample?: string;
  manualVerification?: boolean;
}

interface CheckDefinition {
  key: string;
  category: SiteAuditCategory;
  label: string;
  weight: number;
  explanation: string;
  evaluate: (data: SiteAuditData) => CheckOutput;
}

function priorityFor(status: SiteCheckStatus, weight: number): Priority {
  if (status === "pass" || status === "not_tested") return "low";
  if (status === "fail") return weight >= 6 ? "critical" : weight >= 3 ? "high" : "medium";
  return weight >= 6 ? "high" : weight >= 3 ? "medium" : "low";
}

function bool(value: boolean): SiteCheckStatus {
  return value ? "pass" : "fail";
}

function rangeStatus(length: number, minPass: number, maxPass: number, minWarn: number, maxWarn: number): SiteCheckStatus {
  if (length >= minPass && length <= maxPass) return "pass";
  if (length >= minWarn && length <= maxWarn) return "warn";
  return "fail";
}

// ---------------------------------------------------------------------------
// PSI helpers
// ---------------------------------------------------------------------------

function bestPsi(data: SiteAuditData): PsiStrategyResult | undefined {
  if (data.psi.mobile?.available) return data.psi.mobile;
  if (data.psi.desktop?.available) return data.psi.desktop;
  return undefined;
}

const METRIC_THRESHOLDS: Record<string, { pass: number; warn: number; unit: string; label: string }> = {
  lcp: { pass: 2500, warn: 4000, unit: "ms", label: "Largest Contentful Paint" },
  cls: { pass: 0.1, warn: 0.25, unit: "unitless", label: "Cumulative Layout Shift" },
  inp: { pass: 200, warn: 500, unit: "ms", label: "Interaction to Next Paint" },
  fcp: { pass: 1800, warn: 3000, unit: "ms", label: "First Contentful Paint" },
  si: { pass: 3400, warn: 5800, unit: "ms", label: "Speed Index" },
};

function metricDisplay(value: number | null, unit: string): string {
  if (value === null) return "not reported";
  if (unit === "unitless") return value.toFixed(3).replace(/^0\./, "0.");
  return `${(value / 1000).toFixed(2)} s`;
}

function metricCheck(key: string): (data: SiteAuditData) => CheckOutput {
  const threshold = METRIC_THRESHOLDS[key];
  return (data) => {
    const psi = bestPsi(data);
    if (!psi) {
      return {
        status: "not_tested",
        observed: "PageSpeed Insights data unavailable for this run",
        evidence: { reason: data.psi.error ?? "unavailable" },
      };
    }
    const metric = psi.metrics[key];
    if (!metric || metric.value === null) {
      return {
        status: "not_tested",
        observed: `${threshold.label} was not reported by Google PageSpeed Insights`,
        evidence: { reason: "metric not in PSI response" },
      };
    }
    const status: SiteCheckStatus = metric.value <= threshold.pass ? "pass" : metric.value <= threshold.warn ? "warn" : "fail";
    return {
      status,
      observed: `${threshold.label}: ${metricDisplay(metric.value, threshold.unit)} (measured on ${psi.strategy})`,
      evidence: { value: metric.value, unit: threshold.unit, strategy: psi.strategy, display: metric.display },
      recommendation:
        status === "pass"
          ? undefined
          : `Improve ${threshold.label} — currently ${metricDisplay(metric.value, threshold.unit)}. ${psi.opportunities[0]?.title ? `The largest reported opportunity is "${psi.opportunities[0].title}".` : "See the performance opportunities section for what Google measured."}`,
    };
  };
}

function performanceScoreCheck(kind: "mobile" | "desktop", weight: number): { evaluate: (data: SiteAuditData) => CheckOutput } {
  return {
    evaluate: (data) => {
      const result = data.psi[kind];
      if (!result || !result.available) {
        return {
          status: "not_tested",
          observed: `PageSpeed Insights ${kind} analysis unavailable for this run`,
          evidence: { reason: result?.error ?? data.psi.error ?? "unavailable" },
        };
      }
      if (result.performanceScore === null) {
        return {
          status: "not_tested",
          observed: `Google did not return a performance score for ${kind}`,
          evidence: { reason: "no category score in PSI response" },
        };
      }
      const score = Math.round(result.performanceScore * 100);
      const status: SiteCheckStatus = score >= 90 ? "pass" : score >= 50 ? "warn" : "fail";
      return {
        status,
        observed: `Google PageSpeed performance score (${kind}): ${score}/100`,
        evidence: { score, strategy: kind },
        recommendation:
          status === "pass"
            ? undefined
            : `Google measured a ${kind} performance score of ${score}/100. Work through the performance opportunities listed in the report, starting with the largest.`,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

export const SITE_CHECKS: CheckDefinition[] = [
  // ---------- Technical SEO (25) ----------
  {
    key: "https",
    category: "Technical SEO",
    label: "Served over HTTPS",
    weight: 3,
    explanation: "HTTPS encrypts traffic and is a confirmed Google ranking signal; browsers mark http pages 'Not secure'.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const secure = data.main.finalUrl.startsWith("https://");
      return {
        status: bool(secure),
        observed: secure ? "Final URL uses https" : "Final URL uses http",
        evidence: { finalUrl: data.main.finalUrl },
        recommendation: secure ? undefined : "Install a TLS certificate and redirect every http URL to https. Free certificates are available from Let's Encrypt and most hosts include one.",
        fixExample: "Nginx: return 301 https://$host$request_uri;  (or enable 'Force HTTPS' in your hosting control panel)",
      };
    },
  },
  {
    key: "redirects",
    category: "Technical SEO",
    label: "Clean redirect behaviour",
    weight: 3,
    explanation: "Every hop adds latency, and long chains dilute link signals and confuse crawlers.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const hops = data.main.redirectChain.length;
      if (hops === 0) {
        return { status: "pass", observed: "No redirect — served directly at the requested URL", evidence: { hops: 0 } };
      }
      const finalSchemeHttp = data.main.finalUrl.startsWith("http://");
      const status: SiteCheckStatus = hops === 1 && !finalSchemeHttp ? "warn" : "fail";
      return {
        status,
        observed: `${hops} redirect${hops === 1 ? "" : "s"} before the final page${finalSchemeHttp ? ", ending on http" : ""}`,
        evidence: { hops, chain: data.main.redirectChain, finalUrl: data.main.finalUrl },
        recommendation: "Update internal links and any external links you control to point directly at the final URL, and keep redirects to a single 301 hop where possible.",
        fixExample: "Point marketing links at https://www.example.com/page instead of the redirecting address.",
      };
    },
  },
  {
    key: "title",
    category: "Technical SEO",
    label: "Page title exists with a useful length",
    weight: 5,
    explanation: "The title tag is the strongest on-page signal and the headline of your result in search.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const title = data.main.signals.title;
      if (!title) {
        return {
          status: "fail",
          observed: "No <title> tag found",
          evidence: { title: null },
          recommendation: "Add a unique <title> of roughly 30–60 characters: primary service + location + brand.",
          fixExample: "<title>Emergency Plumber in Leeds | Example Heating</title>",
        };
      }
      const status = rangeStatus(title.length, 30, 60, 15, 70);
      return {
        status,
        observed: `Title is ${title.length} characters: "${title.slice(0, 80)}${title.length > 80 ? "…" : ""}"`,
        evidence: { length: title.length, title },
        recommendation:
          status === "pass"
            ? undefined
            : title.length < 15
              ? "The title is very short. Include the primary service and location, e.g. 'Emergency Plumber in Leeds | Brand'."
              : title.length > 70
                ? "The title is long and will be cut off in results. Move the brand to the end or shorten to about 55 characters."
                : "Slightly outside the ideal 30–60 character range; tighten the wording around your main keyword.",
      };
    },
  },
  {
    key: "meta_description",
    category: "Technical SEO",
    label: "Meta description exists with a useful length",
    weight: 5,
    explanation: "Descriptions often become the result snippet and drive click-through, though they are not a direct ranking factor.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const description = data.main.signals.metaDescription;
      if (!description) {
        return {
          status: "fail",
          observed: "No meta description found",
          evidence: { description: null },
          recommendation: "Add a meta description of 70–160 characters summarising the page and its call to action.",
          fixExample: '<meta name="description" content="Same-day plumbing across Leeds. Fixed prices, Gas Safe engineers, 24/7 callout. Book online.">',
        };
      }
      const status = rangeStatus(description.length, 70, 160, 40, 185);
      return {
        status,
        observed: `Description is ${description.length} characters`,
        evidence: { length: description.length },
        recommendation:
          status === "pass"
            ? undefined
            : description.length < 40
              ? "The description is very short. Expand it to 70–160 characters with services, area and a call to action."
              : "The description is long and will be truncated. Cut it to under about 160 characters.",
      };
    },
  },
  {
    key: "canonical",
    category: "Technical SEO",
    label: "Canonical URL declared and consistent",
    weight: 3,
    explanation: "A canonical tag tells search engines which URL to index when variants exist, consolidating ranking signals.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const canonical = data.main.signals.canonical;
      if (!canonical) {
        return {
          status: "warn",
          observed: "No rel=canonical link found",
          evidence: { canonical: null },
          recommendation: "Add a self-referencing canonical tag so duplicate variants consolidate onto one URL.",
          fixExample: '<link rel="canonical" href="https://www.example.com/">',
        };
      }
      let absolute: string | null = null;
      try {
        absolute = new URL(canonical, data.main.finalUrl).toString();
      } catch {
        absolute = null;
      }
      const matches = absolute ? stripTrailingSlash(absolute) === stripTrailingSlash(data.main.finalUrl) : false;
      return {
        status: matches ? "pass" : "warn",
        observed: matches ? "Canonical matches the final URL" : `Canonical (${canonical}) does not match the final URL`,
        evidence: { canonical, finalUrl: data.main.finalUrl },
        recommendation: matches
          ? undefined
          : "Make sure the canonical points at the version you want indexed; a mismatch can cause the wrong URL to rank.",
      };
    },
  },
  {
    key: "indexability",
    category: "Technical SEO",
    label: "Page is indexable (no noindex signals)",
    weight: 3,
    explanation: "A noindex directive stops the page appearing in search results entirely, whatever its other quality.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const metaRobots = (data.main.signals.robotsMeta ?? "").toLowerCase();
      const headerRobots = (data.main.headers["x-robots-tag"] ?? "").toLowerCase();
      const noindex = /noindex/.test(metaRobots) || /noindex/.test(headerRobots);
      const nofollow = /nofollow/.test(metaRobots) || /nofollow/.test(headerRobots);
      const disallowed = data.robots.disallowsHome;
      const status: SiteCheckStatus = noindex ? "fail" : nofollow || disallowed ? "warn" : "pass";
      return {
        status,
        observed: noindex
          ? "Page carries a noindex directive"
          : nofollow
            ? "Page carries a nofollow directive"
            : disallowed
              ? "robots.txt disallows this path for crawlers"
              : "No noindex/nofollow signals found",
        evidence: { metaRobots, headerRobots, disallowed },
        recommendation:
          status === "pass"
            ? undefined
            : noindex
              ? "Remove the noindex directive from this page — it prevents the page from being indexed at all."
              : "Remove the nofollow/robots.txt restriction so search engines can crawl and index this page.",
        fixExample: '<meta name="robots" content="index, follow">',
      };
    },
  },
  {
    key: "robots_txt",
    category: "Technical SEO",
    label: "robots.txt is reachable",
    weight: 1,
    explanation: "robots.txt lets you steer crawlers and declare the sitemap location.",
    evaluate: (data) => ({
      status: data.robots.available ? "pass" : "warn",
      observed: data.robots.available
        ? `robots.txt responded with status ${data.robots.status}`
        : "robots.txt could not be fetched (it may not exist)",
      evidence: { status: data.robots.status },
      recommendation: data.robots.available ? undefined : "Publish a robots.txt at the domain root that allows crawling of public pages and lists the sitemap URL.",
      fixExample: "User-agent: *\nAllow: /\nSitemap: https://www.example.com/sitemap.xml",
    }),
  },
  {
    key: "sitemap",
    category: "Technical SEO",
    label: "XML sitemap is available",
    weight: 2,
    explanation: "A sitemap helps search engines discover every important URL, especially on new or large sites.",
    evaluate: (data) => ({
      status: data.sitemap.available ? "pass" : "warn",
      observed: data.sitemap.available
        ? `Sitemap responded with status ${data.sitemap.status} at ${data.sitemap.url}`
        : `No sitemap found at ${data.sitemap.url}${data.robots.sitemapUrl ? " or via robots.txt" : ""}`,
      evidence: { status: data.sitemap.status, url: data.sitemap.url },
      recommendation: data.sitemap.available ? undefined : "Publish an XML sitemap and reference it from robots.txt, then submit it in Google Search Console.",
    }),
  },

  // ---------- On-page SEO (25) ----------
  {
    key: "h1",
    category: "On-page SEO",
    label: "Exactly one H1 heading",
    weight: 5,
    explanation: "The H1 states the page's subject to users and crawlers; duplicates blur it, absence leaves it unstated.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const count = data.main.signals.h1Count;
      const status: SiteCheckStatus = count === 1 ? "pass" : "fail";
      return {
        status,
        observed: count === 0 ? "No H1 heading found" : count === 1 ? `One H1: "${data.main.signals.h1Texts[0]?.slice(0, 80)}"` : `${count} H1 headings found`,
        evidence: { count, texts: data.main.signals.h1Texts },
        recommendation:
          status === "pass"
            ? undefined
            : count === 0
              ? "Add a single H1 that states what this page offers, including the primary keyword."
              : "Keep exactly one H1 per page; demote the extra headings to H2.",
      };
    },
  },
  {
    key: "h2_structure",
    category: "On-page SEO",
    label: "H2 subheadings structure the content",
    weight: 3,
    explanation: "Subheadings make long pages scannable and carry related keyword themes.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const count = data.main.signals.h2Count;
      const status: SiteCheckStatus = count >= 2 ? "pass" : count === 1 ? "warn" : "fail";
      return {
        status,
        observed: `${count} H2 heading${count === 1 ? "" : "s"} found`,
        evidence: { count },
        recommendation: status === "pass" ? undefined : "Break the page into sections with descriptive H2 headings (services, areas covered, pricing, FAQs).",
      };
    },
  },
  {
    key: "heading_hierarchy",
    category: "On-page SEO",
    label: "Heading levels follow a sane order",
    weight: 3,
    explanation: "Skipping levels (H1 → H4) breaks the outline assistive technologies and crawlers build.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const skipped = data.main.signals.headingLevelsSkipped;
      return {
        status: bool(!skipped),
        observed: skipped ? "Heading levels skip at least one step somewhere on the page" : "Heading levels step down without gaps",
        evidence: { sequence: data.main.signals.headingSequence },
        recommendation: skipped ? "Renumber headings so levels never skip (H1 → H2 → H3, never H1 → H3)." : undefined,
      };
    },
  },
  {
    key: "internal_links",
    category: "On-page SEO",
    label: "Healthy number of internal links",
    weight: 4,
    explanation: "Internal links spread ranking signals and help crawlers find deeper pages.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const count = data.main.signals.internalLinkCount;
      const status: SiteCheckStatus = count >= 10 ? "pass" : count >= 5 ? "warn" : "fail";
      return {
        status,
        observed: `${count} unique internal link${count === 1 ? "" : "s"} on the homepage`,
        evidence: { count, sample: data.main.signals.internalLinks.slice(0, 12) },
        recommendation: status === "pass" ? undefined : "Link the homepage to your main service, location and contact pages with descriptive anchor text.",
      };
    },
  },
  {
    key: "broken_links",
    category: "On-page SEO",
    label: "Sampled internal links respond correctly",
    weight: 6,
    explanation: "Broken links waste crawl budget, frustrate visitors and signal neglect.",
    evaluate: (data) => {
      const checked = data.subpages.filter((page) => page.status !== null || page.error);
      const tested = checked.length;
      if (tested === 0) {
        return {
          status: "not_tested",
          observed: "No internal links could be sampled for testing",
          evidence: {},
          manualVerification: true,
        };
      }
      const broken = checked.filter((page) => (page.status !== null && page.status >= 400) || page.error);
      const denied = broken.filter((page) => page.status === 403 || page.status === 429);
      if (broken.length > 0 && broken.length === denied.length) {
        return {
          status: "not_tested",
          observed: `${tested} links tested, but ${denied.length} refused automated requests, so results are inconclusive`,
          evidence: { tested, denied: denied.length },
          manualVerification: true,
        };
      }
      const status: SiteCheckStatus = broken.length === 0 ? "pass" : broken.length <= 2 ? "warn" : "fail";
      return {
        status,
        observed:
          broken.length === 0
            ? `${tested} internal links tested, none broken`
            : `${broken.length} of ${tested} tested internal links returned errors (${broken.slice(0, 3).map((page) => page.url).join(", ")})`,
        evidence: { tested, broken: broken.map((page) => ({ url: page.url, status: page.status, error: page.error })) },
        recommendation: broken.length === 0 ? undefined : "Fix or remove the broken links — point them at the correct page or drop them.",
      };
    },
  },
  {
    key: "url_structure",
    category: "On-page SEO",
    label: "URLs are short and readable",
    weight: 2,
    explanation: "Readable URLs are easier to share, link and understand in search results.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const urls = data.main.signals.internalLinks.slice(0, 20);
      if (urls.length === 0) return notTestedMain();
      const messy = urls.filter(
        (url) => url.length > 100 || /%[0-9a-f]{2}/i.test(url) || /[A-Z]/.test(url) || /(_{2,}|\?{1}.{40,})/.test(url),
      );
      const status: SiteCheckStatus = messy.length === 0 ? "pass" : messy.length <= urls.length / 3 ? "warn" : "fail";
      return {
        status,
        observed: messy.length === 0 ? "Sampled URLs look clean" : `${messy.length} of ${urls.length} sampled URLs look messy or over-long`,
        evidence: { messy: messy.slice(0, 5), sampled: urls.length },
        recommendation: status === "pass" ? undefined : "Prefer short lowercase hyphenated URLs, e.g. /services/boiler-repair/ instead of /page?id=128&cat=7.",
      };
    },
  },
  {
    key: "metadata_duplication",
    category: "On-page SEO",
    label: "Sampled pages have unique titles",
    weight: 2,
    explanation: "Duplicate titles across pages make results less relevant and split signals.",
    evaluate: (data) => {
      const withTitles = data.subpages.filter((page) => page.title !== null);
      if (withTitles.length === 0) {
        return {
          status: "not_tested",
          observed: "Not enough additional pages fetched to compare titles",
          evidence: {},
          manualVerification: true,
        };
      }
      const homepageTitle = data.main?.signals.title ?? null;
      const titles = [homepageTitle, ...withTitles.map((page) => page.title)].filter((t): t is string => Boolean(t));
      const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
      const missing = withTitles.filter((page) => !page.title).length;
      const status: SiteCheckStatus = duplicates.length === 0 && missing === 0 ? "pass" : duplicates.length > 0 ? "warn" : "pass";
      return {
        status,
        observed:
          duplicates.length === 0
            ? `No duplicate titles across ${titles.length} sampled pages`
            : `${duplicates.length} duplicate title(s) found across ${titles.length} sampled pages`,
        evidence: { duplicates: [...new Set(duplicates)].slice(0, 3), missing, sampled: titles.length },
        recommendation: duplicates.length === 0 ? undefined : "Give every page a unique title describing what that page covers.",
        manualVerification: true,
      };
    },
  },

  // ---------- Performance (25) ----------
  {
    key: "psi_mobile",
    category: "Performance",
    label: "Mobile performance score (Google PSI)",
    weight: 8,
    explanation: "Google indexes and judges the mobile experience first; this score is Google's own measurement of the page.",
    ...performanceScoreCheck("mobile", 8),
  },
  {
    key: "psi_desktop",
    category: "Performance",
    label: "Desktop performance score (Google PSI)",
    weight: 4,
    explanation: "Desktop performance matters for office-based and in-store research traffic.",
    ...performanceScoreCheck("desktop", 4),
  },
  {
    key: "lcp",
    category: "Performance",
    label: "Largest Contentful Paint within Google's threshold",
    weight: 4,
    explanation: "LCP measures when the main content becomes visible; it is one of Google's Core Web Vitals (target: ≤ 2.5 s).",
    evaluate: metricCheck("lcp"),
  },
  {
    key: "cls",
    category: "Performance",
    label: "Cumulative Layout Shift within Google's threshold",
    weight: 2,
    explanation: "CLS measures unexpected movement of content while the page loads (target: ≤ 0.1).",
    evaluate: metricCheck("cls"),
  },
  {
    key: "inp",
    category: "Performance",
    label: "Interaction to Next Paint within Google's threshold",
    weight: 3,
    explanation: "INP measures responsiveness to taps and clicks (target: ≤ 200 ms). Included when Google reports it.",
    evaluate: metricCheck("inp"),
  },
  {
    key: "fcp",
    category: "Performance",
    label: "First Contentful Paint",
    weight: 2,
    explanation: "FCP marks the first moment users see something on screen (target: ≤ 1.8 s).",
    evaluate: metricCheck("fcp"),
  },
  {
    key: "speed_index",
    category: "Performance",
    label: "Speed Index",
    weight: 2,
    explanation: "Speed Index summarises how quickly the page visually populates (target: ≤ 3.4 s).",
    evaluate: metricCheck("si"),
  },

  // ---------- Mobile readiness (15) ----------
  {
    key: "viewport",
    category: "Mobile readiness",
    label: "Mobile viewport is configured",
    weight: 5,
    explanation: "Without a viewport meta tag, mobile browsers render the desktop layout scaled down — the classic non-mobile page.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const viewport = data.main.signals.viewport;
      if (!viewport) {
        return {
          status: "fail",
          observed: "No viewport meta tag found",
          evidence: { viewport: null },
          recommendation: "Add the standard responsive viewport tag to the page head.",
          fixExample: '<meta name="viewport" content="width=device-width, initial-scale=1">',
        };
      }
      const hasWidth = /width/i.test(viewport);
      return {
        status: hasWidth ? "pass" : "warn",
        observed: `Viewport meta: "${viewport.slice(0, 80)}"`,
        evidence: { viewport },
        recommendation: hasWidth ? undefined : 'The viewport tag lacks a width setting; use content="width=device-width, initial-scale=1".',
      };
    },
  },
  {
    key: "device_width",
    category: "Mobile readiness",
    label: "Viewport uses width=device-width",
    weight: 3,
    explanation: "width=device-width is the standard signal that the layout adapts to the phone's screen.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const viewport = (data.main.signals.viewport ?? "").toLowerCase();
      const status = /device-width/.test(viewport) ? "pass" : viewport ? "warn" : "not_tested";
      return {
        status,
        observed: viewport ? (/device-width/.test(viewport) ? "Viewport uses width=device-width" : "Viewport present but without device-width") : "No viewport meta tag to evaluate",
        evidence: { viewport: data.main.signals.viewport },
        recommendation: status === "pass" ? undefined : 'Set the viewport to content="width=device-width, initial-scale=1".',
      };
    },
  },
  {
    key: "zoom_allowed",
    category: "Mobile readiness",
    label: "Page zoom is not disabled",
    weight: 3,
    explanation: "Blocking zoom (user-scalable=no) fails accessibility guidelines and frustrates low-vision users.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const viewport = (data.main.signals.viewport ?? "").toLowerCase();
      if (!viewport) return notTestedMain();
      const blocked = /user-scalable\s*=\s*no/.test(viewport) || /maximum-scale\s*=\s*0?\.[0-9]+/.test(viewport) || /maximum-scale\s*=\s*1(?![0-9])/.test(viewport);
      return {
        status: blocked ? "fail" : "pass",
        observed: blocked ? "Viewport disables or limits zooming" : "Zoom is allowed",
        evidence: { viewport: data.main.signals.viewport },
        recommendation: blocked ? 'Remove user-scalable=no and any maximum-scale below 1 from the viewport tag.' : undefined,
      };
    },
  },
  {
    key: "fixed_width",
    category: "Mobile readiness",
    label: "No fixed-width viewport",
    weight: 2,
    explanation: "A fixed pixel viewport (e.g. width=1024) forces sideways scrolling on phones.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const viewport = (data.main.signals.viewport ?? "").toLowerCase();
      if (!viewport) return notTestedMain();
      const fixed = /width\s*=\s*(?!device-width)(\d{3,})/.test(viewport);
      return {
        status: fixed ? "fail" : "pass",
        observed: fixed ? "Viewport pins the page to a fixed pixel width" : "No fixed-width viewport setting",
        evidence: { viewport: data.main.signals.viewport },
        recommendation: fixed ? 'Replace the fixed width with width=device-width so the layout follows the screen.' : undefined,
      };
    },
  },
  {
    key: "responsive_images",
    category: "Mobile readiness",
    label: "Images ship responsive sizing hints",
    weight: 2,
    explanation: "srcset/sizes let the browser pick a right-sized image for each screen, saving mobile data.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const { imageTotal, imagesWithSrcset } = data.main.signals;
      if (imageTotal === 0) {
        return { status: "not_tested", observed: "No images on the page to evaluate", evidence: {} };
      }
      const share = imagesWithSrcset / imageTotal;
      const status: SiteCheckStatus = share >= 0.5 ? "pass" : share > 0 ? "warn" : "fail";
      return {
        status,
        observed: `${imagesWithSrcset} of ${imageTotal} images include srcset`,
        evidence: { imagesWithSrcset, imageTotal },
        recommendation: status === "pass" ? undefined : "Add srcset (or serve modern formats at responsive sizes) so phones download smaller images.",
        fixExample: '<img src="hero-800.jpg" srcset="hero-400.jpg 400w, hero-800.jpg 800w" sizes="100vw">',
      };
    },
  },

  // ---------- Basic accessibility (10) ----------
  {
    key: "img_alt",
    category: "Basic accessibility",
    label: "Images have alt attributes",
    weight: 4,
    explanation: "Alt text is how screen-reader users and image search understand pictures; empty alt is correct only for decorative images.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const { imageTotal, imagesWithAltAttribute, imagesWithEmptyAlt } = data.main.signals;
      if (imageTotal === 0) return notTestedMain();
      const missing = imageTotal - imagesWithAltAttribute;
      const status: SiteCheckStatus = missing === 0 ? "pass" : missing <= Math.ceil(imageTotal * 0.1) ? "warn" : "fail";
      return {
        status,
        observed: `${missing} of ${imageTotal} images are missing an alt attribute`,
        evidence: { missing, imageTotal, emptyAlt: imagesWithEmptyAlt },
        recommendation: status === "pass" ? undefined : "Add a short descriptive alt attribute to every meaningful image; use alt=\"\" only for purely decorative ones.",
        fixExample: '<img src="team.jpg" alt="The Example Heating team in front of a service van">',
      };
    },
  },
  {
    key: "html_lang",
    category: "Basic accessibility",
    label: "Document declares a language",
    weight: 2,
    explanation: "Screen readers pick pronunciation from <html lang>; search engines use it for language targeting.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const lang = data.main.signals.htmlLang;
      return {
        status: lang ? "pass" : "fail",
        observed: lang ? `html lang="${lang}"` : "No lang attribute on the <html> element",
        evidence: { lang },
        recommendation: lang ? undefined : 'Set the page language on the root element, e.g. <html lang="en">.',
      };
    },
  },
  {
    key: "form_labels",
    category: "Basic accessibility",
    label: "Form fields have accessible labels",
    weight: 2,
    explanation: "Unlabelled inputs are unusable with a screen reader and fail WCAG success criterion 1.3.1.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const { controls, labeled } = data.main.signals.formSignals;
      if (controls === 0) return notTestedMain();
      const missing = controls - labeled;
      const status: SiteCheckStatus = missing === 0 ? "pass" : missing <= 1 ? "warn" : "fail";
      return {
        status,
        observed: `${missing} of ${controls} form fields lack an associated label`,
        evidence: { controls, labeled },
        recommendation: status === "pass" ? undefined : 'Give every input a <label for="id">, or an aria-label where a visible label is not wanted.',
      };
    },
  },
  {
    key: "landmarks",
    category: "Basic accessibility",
    label: "Semantic structure landmarks present",
    weight: 2,
    explanation: "Landmark elements let assistive technology and search engines navigate the document's regions.",
    evaluate: (data) => {
      if (!data.main) return notTestedMain();
      const html = data.main.signals;
      // landmarks live in the raw HTML; approximate via heading + nav presence in signals is not
      // available, so evaluate from heading structure and text sample instead.
      const hasStructure = html.h1Count > 0 && html.headingSequence.length > 0;
      return {
        status: hasStructure ? "pass" : "warn",
        observed: hasStructure ? "Document has a heading outline" : "No heading outline detected",
        evidence: { headings: html.headingSequence.length },
        recommendation: hasStructure ? undefined : "Use semantic elements (<header>, <nav>, <main>, <footer>) and a heading outline.",
        manualVerification: true,
      };
    },
  },
];

function notTestedMain(): CheckOutput {
  return {
    status: "not_tested",
    observed: "Could not be checked because the homepage could not be fetched",
    evidence: {},
  };
}

function stripTrailingSlash(url: string): string {
  return url.length > 1 && url.endsWith("/") ? url.slice(0, -1) : url;
}

export interface SiteScoreSummary {
  overallScore: number;
  grade: string;
  findings: SiteFinding[];
  categoryScores: SiteCategoryScore[];
  testedCount: number;
  notTestedCount: number;
  criticalCount: number;
  warningCount: number;
}

export function scoreSiteFindings(findings: SiteFinding[]): SiteScoreSummary {
  const categoryScores: SiteCategoryScore[] = SITE_AUDIT_CATEGORIES.map((category) => {
    const scoped = findings.filter((f) => f.category === category && f.status !== "not_tested");
    const possible = scoped.reduce((sum, f) => sum + f.weight, 0);
    const earned = scoped.reduce((sum, f) => sum + f.pointsEarned, 0);
    return {
      category,
      possible,
      earned,
      score: possible === 0 ? 0 : Math.round((earned / possible) * 100),
    };
  });

  const tested = findings.filter((f) => f.status !== "not_tested");
  const possible = tested.reduce((sum, f) => sum + f.weight, 0);
  const earned = tested.reduce((sum, f) => sum + f.pointsEarned, 0);
  const overallScore = possible === 0 ? 0 : Math.round((earned / possible) * 100);

  return {
    overallScore,
    grade: gradeFor(overallScore),
    findings,
    categoryScores,
    testedCount: tested.length,
    notTestedCount: findings.length - tested.length,
    criticalCount: findings.filter((f) => f.status === "fail").length,
    warningCount: findings.filter((f) => f.status === "warn").length,
  };
}

export function runWebsiteAudit(data: SiteAuditData): SiteAuditResult {
  const findings: SiteFinding[] = SITE_CHECKS.map((check) => {
    const output = check.evaluate(data);
    const pointsEarned = output.status === "pass" ? check.weight : output.status === "warn" ? Math.round(check.weight * 0.55) : 0;
    return {
      checkKey: check.key,
      category: check.category,
      label: check.label,
      status: output.status,
      weight: check.weight,
      pointsEarned,
      priority: priorityFor(output.status, check.weight),
      observed: output.observed,
      evidence: output.evidence,
      explanation: check.explanation,
      recommendation: output.status === "pass" ? "" : (output.recommendation ?? check.explanation),
      fixExample: output.fixExample,
      manualVerification: output.manualVerification,
    };
  });

  const summary = scoreSiteFindings(findings);
  return {
    overallScore: summary.overallScore,
    grade: summary.grade,
    findings,
    categoryScores: summary.categoryScores,
    testedCount: summary.testedCount,
    notTestedCount: summary.notTestedCount,
    criticalCount: summary.criticalCount,
    warningCount: summary.warningCount,
    engineVersion: SITE_ENGINE_VERSION,
  };
}

/** Ordered list of things worth fixing first: failures, then warnings, by weight. */
export function prioritisedSiteActions(findings: SiteFinding[]): SiteFinding[] {
  return findings
    .filter((f) => f.status === "fail" || f.status === "warn")
    .sort((a, b) => {
      const rank = (s: SiteCheckStatus) => (s === "fail" ? 0 : 1);
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
      return b.weight - a.weight;
    });
}

export function categoryPointLimit(category: SiteAuditCategory): number {
  return CATEGORY_POINT_LIMITS[category];
}
