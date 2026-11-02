/**
 * Local Visibility Readiness — a separate readiness score for how well the
 * website supports local search. It is deliberately independent of the
 * website SEO score and of the Google Business Profile audit score, and it
 * never claims to be a Google ranking.
 */

import type { LocalFinding, LocalReadinessResult, SiteCheckStatus, SiteAuditData } from "./types";
import { LOCAL_READINESS_DISCLAIMER } from "./types";

export interface LocalAuditInput {
  businessName?: string;
  phone?: string;
  city?: string;
  country?: string;
}

const LOCAL_BUSINESS_TYPES = new Set([
  "localbusiness",
  "dentist",
  "physician",
  "medicalclinic",
  "restaurant",
  "cafe",
  "bar",
  "bakery",
  "store",
  "grocerystore",
  "hotelmotel",
  "hotel",
  "autorepair",
  "legalservice",
  "professionalservice",
  "realestateagent",
  "homeandconstructionbusiness",
  "electrician",
  "plumber",
  "hvacbusiness",
  "locksmith",
  "movingcompany",
  "petstore",
  "veterinarycare",
  "beautysalon",
  "hairsalon",
  "school",
  "childcare",
  "financialservice",
  "insuranceagency",
  "travelagency",
]);

function normalisePhone(value: string): string {
  return value.replace(/\D/g, "").slice(-9);
}

interface LocalCheck {
  key: string;
  label: string;
  weight: number;
  explanation: string;
  evaluate: (data: SiteAuditData, provided: LocalAuditInput) => Omit<LocalFinding, "key" | "label" | "weight" | "explanation">;
}

const LOCAL_CHECKS: LocalCheck[] = [
  {
    key: "phone",
    label: "Phone number is present and clickable",
    weight: 12,
    explanation:
      "A click-to-call phone number in the page content is one of the strongest local conversion and consistency signals.",
    evaluate: (data, provided) => {
      const signals = data.main?.signals;
      const text = signals?.textSample ?? "";
      const phoneOnPage = signals?.telLinkFound || /\+?\d[\d\s().-]{7,}\d/.test(text);
      const matches =
        provided.phone && phoneOnPage
          ? text.replace(/\D/g, "").includes(normalisePhone(provided.phone))
          : null;
      const status: SiteCheckStatus = phoneOnPage ? (matches === false ? "warn" : "pass") : "fail";
      return {
        status,
        observed: signals?.telLinkFound
          ? "Found a tel: click-to-call link"
          : phoneOnPage
            ? "Found a phone-like number in the page text"
            : "No phone number or click-to-call link found",
        recommendation:
          status === "pass"
            ? undefined
            : matches === false
              ? "The phone number on the page looks different from the one you supplied. Keep the same number everywhere — website, profile and directories."
              : "Add your phone number as a click-to-call link in the header, footer or contact section.",
        manualVerification: matches === null && phoneOnPage,
      };
    },
  },
  {
    key: "address",
    label: "A postal address appears on the page",
    weight: 12,
    explanation:
      "Consistent name-address-phone details on the website reinforce the business's identity for local search.",
    evaluate: (data, provided) => {
      const signals = data.main?.signals;
      const detected = signals?.addressLikeText || signals?.addressTagFound;
      const cityMatches = provided.city && signals ? signals.textSample.toLowerCase().includes(provided.city.toLowerCase()) : null;
      const status: SiteCheckStatus = detected ? "pass" : cityMatches === true ? "warn" : "fail";
      return {
        status,
        observed: detected
          ? "Found an address tag or address-like text (street/postcode pattern)"
          : "No address-like text detected",
        recommendation:
          status === "pass"
            ? undefined
            : "Show your full business address (or, for service-area businesses, the areas served) on the homepage and contact page.",
        manualVerification: true,
      };
    },
  },
  {
    key: "contact_email",
    label: "A contact email is linked",
    weight: 8,
    explanation: "A reachable contact route builds trust and completes the business's verifiable contact details.",
    evaluate: (data) => {
      const found = data.main?.signals.mailtoLinkFound ?? false;
      return {
        status: found ? "pass" : "warn",
        observed: found ? "Found a mailto: contact link" : "No mailto: contact link found",
        recommendation: found ? undefined : "Add an email link (or a contact form with a visible address) on the contact page and footer.",
      };
    },
  },
  {
    key: "structured_data",
    label: "Local business structured data (schema.org)",
    weight: 15,
    explanation:
      "LocalBusiness structured data states your name, address, phone and opening hours in a format search engines parse directly.",
    evaluate: (data) => {
      const types = data.main?.signals.jsonLdTypes ?? [];
      const match = types.find((type) => LOCAL_BUSINESS_TYPES.has(type.toLowerCase())) ??
        types.find((type) => type.toLowerCase().endsWith("business"));
      return {
        status: match ? "pass" : "fail",
        observed: match ? `Found LocalBusiness-type structured data (${match})` : types.length ? `Structured data present, but none is LocalBusiness-type (found: ${types.slice(0, 4).join(", ")})` : "No JSON-LD structured data found",
        recommendation: match ? undefined : "Add LocalBusiness JSON-LD with name, address, phone, opening hours and geo coordinates.",
        manualVerification: !match && types.length > 0,
      };
    },
  },
  {
    key: "location_content",
    label: "Location-specific content on the page",
    weight: 10,
    explanation: "Pages that name the towns and areas served give Google relevance signals for those local queries.",
    evaluate: (data, provided) => {
      if (!provided.city) {
        return {
          status: "not_tested",
          observed: "No city or service area was supplied, so this could not be measured",
          manualVerification: true,
          recommendation: "Re-run the audit and enter your town/city to measure how prominently it appears.",
        };
      }
      const count = (data.main?.signals.textSample.toLowerCase().match(new RegExp(provided.city.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length;
      const status: SiteCheckStatus = count >= 3 ? "pass" : count >= 1 ? "warn" : "fail";
      return {
        status,
        observed: `"${provided.city}" appears ${count} time${count === 1 ? "" : "s"} in the page text`,
        recommendation:
          status === "pass"
            ? undefined
            : count === 0
              ? `Mention the areas you serve (${provided.city}) in the page content — an intro line and a services list are enough.`
              : "Mention the areas served a little more prominently, e.g. in the intro paragraph and an 'Areas we cover' section.",
      };
    },
  },
  {
    key: "service_area_pages",
    label: "Service, location or contact pages are linked",
    weight: 10,
    explanation: "Dedicated pages per service or area are how local relevance is built site-wide.",
    evaluate: (data) => {
      const links = data.main?.signals.internalLinks ?? [];
      const matches = links.filter((link) =>
        /(location|area|service|contact|about|branch|town|city|clinic|practice)/i.test(link),
      );
      const status: SiteCheckStatus = matches.length >= 3 ? "pass" : matches.length >= 1 ? "warn" : "fail";
      return {
        status,
        observed: `${matches.length} internal link(s) look like service/location/contact pages`,
        recommendation:
          status === "pass"
            ? undefined
            : "Create or link dedicated pages for each main service and each area served, and link them from the homepage.",
      };
    },
  },
  {
    key: "geo_signals",
    label: "Geo signals (geo meta tags or map embed/link)",
    weight: 6,
    explanation: "Embedded maps or geo meta tags tie the page to a physical place for both users and crawlers.",
    evaluate: (data) => {
      const signals = data.main?.signals;
      const found = signals?.geoMetaFound || signals?.mapsEmbedFound;
      return {
        status: found ? "pass" : "warn",
        observed: found
          ? signals?.mapsEmbedFound
            ? "Found a Google Maps embed or link"
            : "Found geo meta tags"
          : "No map embed or geo meta tags found",
        recommendation: found ? undefined : "Embed a Google Map of the business location (or link to your Maps listing) on the contact page.",
      };
    },
  },
  {
    key: "hours_signal",
    label: "Opening hours are stated on the page",
    weight: 2,
    explanation: "Hours on the website should match the Google Business Profile; mismatches cause complaints and lost trust.",
    evaluate: (data) => {
      const text = data.main?.signals.textSample ?? "";
      const found = /(opening hours|opening times|business hours|hours of operation|mon\s*[–-]\s*fri|monday\s*[–-]\s*(friday|saturday))/i.test(text);
      return {
        status: found ? "pass" : "warn",
        observed: found ? "Opening-hours text found" : "No opening-hours text detected",
        recommendation: found ? undefined : "State your opening hours on the site (and keep them identical to your Google Business Profile).",
        manualVerification: true,
      };
    },
  },
  {
    key: "nap_consistency",
    label: "Supplied business details match the page",
    weight: 10,
    explanation: "Consistent name, address and phone details across the web are a core local ranking input.",
    evaluate: (data, provided) => {
      if (!provided.businessName && !provided.phone) {
        return {
          status: "not_tested",
          observed: "No business name or phone supplied to compare",
          manualVerification: true,
          recommendation: "Re-run the audit and enter your business name and phone to enable the consistency check.",
        };
      }
      const text = (data.main?.signals.textSample ?? "").toLowerCase();
      const title = (data.main?.signals.title ?? "").toLowerCase();
      const nameMatch = provided.businessName ? title.includes(provided.businessName.toLowerCase()) || text.includes(provided.businessName.toLowerCase()) : null;
      const phoneMatch = provided.phone ? text.replace(/\D/g, "").includes(normalisePhone(provided.phone)) : null;
      const results = [nameMatch, phoneMatch].filter((value): value is boolean => value !== null);
      const allMatch = results.every(Boolean);
      const status: SiteCheckStatus = allMatch ? "pass" : results.some(Boolean) ? "warn" : "fail";
      const parts: string[] = [];
      if (nameMatch !== null) parts.push(nameMatch ? "name matches" : "name not found on page");
      if (phoneMatch !== null) parts.push(phoneMatch ? "phone matches" : "phone not found on page");
      return {
        status,
        observed: `${parts.join("; ")}`,
        recommendation:
          status === "pass"
            ? undefined
            : "Make the name, address and phone on the website identical to your Google Business Profile and directory listings.",
        manualVerification: true,
      };
    },
  },
  {
    key: "gbp_readiness",
    label: "Google Business Profile completeness and reviews",
    weight: 15,
    explanation:
      "Profile completeness, review volume and review velocity are major local ranking inputs, but only the profile owner's verified data can measure them.",
    evaluate: () => ({
      status: "not_tested" as SiteCheckStatus,
      observed: "Not tested — requires authorized Google Business Profile data",
      manualVerification: true,
      recommendation:
        "Run the separate Google Business Profile audit, which scores profile completeness, reviews and activity, to cover this part of local readiness.",
    }),
  },
];

export function runLocalReadiness(data: SiteAuditData, provided: LocalAuditInput): LocalReadinessResult {
  const findings: LocalFinding[] = LOCAL_CHECKS.map((check) => {
    const output = check.evaluate(data, provided);
    return {
      key: check.key,
      label: check.label,
      weight: check.weight,
      explanation: check.explanation,
      status: output.status,
      pointsEarned: output.status === "pass" ? check.weight : output.status === "warn" ? Math.round(check.weight * 0.55) : 0,
      observed: output.observed,
      recommendation: output.recommendation,
      manualVerification: output.manualVerification,
    };
  });

  const tested = findings.filter((f) => f.status !== "not_tested");
  const possible = tested.reduce((sum, f) => sum + f.weight, 0);
  const earned = tested.reduce((sum, f) => sum + f.pointsEarned, 0);

  return {
    score: possible === 0 ? 0 : Math.round((earned / possible) * 100),
    earned,
    possible,
    findings,
    disclaimer: LOCAL_READINESS_DISCLAIMER,
  };
}
