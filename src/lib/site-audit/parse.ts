/**
 * Pure HTML → structured signals extraction using node-html-parser.
 * Runs in the server runtime and in tests.
 */

import { parse, type HTMLElement } from "node-html-parser";

export interface HeadingEntry {
  level: number;
  text: string;
}

export interface FormLabelSignals {
  controls: number;
  labeled: number;
}

export interface PageSignals {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robotsMeta: string | null;
  viewport: string | null;
  htmlLang: string | null;
  h1Count: number;
  h1Texts: string[];
  h2Count: number;
  headingSequence: number[];
  headingLevelsSkipped: boolean;
  imageTotal: number;
  imagesWithAltAttribute: number;
  imagesWithEmptyAlt: number;
  imagesWithSrcset: number;
  internalLinks: string[];
  internalLinkCount: number;
  externalLinkCount: number;
  telLinkFound: boolean;
  mailtoLinkFound: boolean;
  formSignals: FormLabelSignals;
  jsonLdTypes: string[];
  geoMetaFound: boolean;
  mapsEmbedFound: boolean;
  addressTagFound: boolean;
  addressLikeText: boolean;
  cityMentionCount: number;
  textSample: string;
  byteLength: number;
}

const ADDRESS_PATTERN =
  /\b\d{1,5}[A-Za-z]?\s+[A-Za-z0-9 .,'’\-]+(?:street|st\.?|road|rd\.?|avenue|ave\.?|lane|ln\.?|drive|dr\.?|boulevard|blvd\.?|way|terrace|tce\.?|close|court|ct\.?|place|pl\.?|highway|hwy|square|sq\.?)\b/i;

const UK_POSTCODE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/;
const US_ZIP = /\b\d{5}(?:-\d{4})?\b/;

function stripNoise(root: HTMLElement): string {
  const clone = root;
  for (const selector of ["script", "style", "noscript", "svg"]) {
    for (const node of clone.querySelectorAll(selector)) node.remove();
  }
  return clone.text;
}

function jsonLdTypes(root: HTMLElement): string[] {
  const types: string[] = [];
  const nodes = root.querySelectorAll('script[type="application/ld+json"]');
  for (const node of nodes) {
    const raw = (node.text ?? "").trim();
    if (!raw) continue;
    try {
      const data: unknown = JSON.parse(raw);
      collectTypes(data, types);
    } catch {
      // Malformed JSON-LD is ignored; the structured-data check reports absence.
    }
  }
  return types;
}

function collectTypes(data: unknown, out: string[]): void {
  if (Array.isArray(data)) {
    for (const item of data) collectTypes(item, out);
    return;
  }
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const type = record["@type"];
    if (typeof type === "string") out.push(type);
    else if (Array.isArray(type)) {
      for (const entry of type) if (typeof entry === "string") out.push(entry);
    }
    if (Array.isArray(record["@graph"])) collectTypes(record["@graph"], out);
  }
}

function formLabelSignals(root: HTMLElement): FormLabelSignals {
  const controls = root.querySelectorAll("input, select, textarea");
  let labeled = 0;
  let countable = 0;
  const labelFors = new Set(
    root
      .querySelectorAll("label")
      .map((label) => label.getAttribute("for"))
      .filter((value): value is string => Boolean(value)),
  );
  for (const control of controls) {
    const type = (control.getAttribute("type") ?? "text").toLowerCase();
    if (["hidden", "submit", "button", "reset", "image"].includes(type)) continue;
    countable++;
    const id = control.getAttribute("id");
    const hasLabel =
      (id && labelFors.has(id)) ||
      control.closest?.("label") !== null ||
      Boolean(control.getAttribute("aria-label")) ||
      Boolean(control.getAttribute("aria-labelledby")) ||
      Boolean(control.getAttribute("title"));
    if (hasLabel) labeled++;
  }
  return { controls: countable, labeled };
}

function isInternal(href: string, baseUrl: URL): string | null {
  try {
    const resolved = new URL(href, baseUrl);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    return resolved.hostname.replace(/^www\./i, "") === baseUrl.hostname.replace(/^www\./i, "")
      ? `${resolved.origin}${resolved.pathname}${resolved.search}`
      : null;
  } catch {
    return null;
  }
}

export function parsePage(html: string, baseUrl: string): PageSignals {
  const root = parse(html, { blockTextElements: { script: true, style: true, noscript: true, pre: true } });
  const base = new URL(baseUrl);
  const meta = (selector: string) => root.querySelector(selector)?.getAttribute("content")?.trim() ?? null;

  const headings = root
    .querySelectorAll("h1, h2, h3, h4, h5, h6")
    .map((node) => ({ level: Number(node.tagName.slice(1)), text: (node.text ?? "").trim() }));

  let previous = 0;
  let skipped = false;
  const sequence: number[] = [];
  for (const heading of headings) {
    sequence.push(heading.level);
    if (previous > 0 && heading.level > previous + 1) skipped = true;
    previous = heading.level;
  }

  const images = root.querySelectorAll("img");
  const anchors = root.querySelectorAll("a[href]");
  const internal = new Set<string>();
  let external = 0;
  for (const anchor of anchors) {
    const href = anchor.getAttribute("href") ?? "";
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) continue;
    const internalUrl = isInternal(href, base);
    if (internalUrl) internal.add(internalUrl.split("#")[0]);
    else external++;
  }

  const text = stripNoise(root).replace(/\s+/g, " ").trim();

  return {
    title: root.querySelector("title")?.text?.trim() ?? null,
    metaDescription: meta('meta[name="description" i]'),
    canonical: root.querySelector('link[rel="canonical" i]')?.getAttribute("href")?.trim() ?? null,
    robotsMeta: meta('meta[name="robots" i]'),
    viewport: meta('meta[name="viewport" i]'),
    htmlLang: root.querySelector("html")?.getAttribute("lang")?.trim() ?? null,
    h1Count: headings.filter((h) => h.level === 1).length,
    h1Texts: headings.filter((h) => h.level === 1).map((h) => h.text),
    h2Count: headings.filter((h) => h.level === 2).length,
    headingSequence: sequence,
    headingLevelsSkipped: skipped,
    imageTotal: images.length,
    imagesWithAltAttribute: images.filter((img) => img.getAttribute("alt") !== undefined).length,
    imagesWithEmptyAlt: images.filter((img) => (img.getAttribute("alt") ?? null) === "").length,
    imagesWithSrcset: root.querySelectorAll("img[srcset], source[srcset]").length,
    internalLinks: [...internal],
    internalLinkCount: internal.size,
    externalLinkCount: external,
    telLinkFound: anchors.some((a) => (a.getAttribute("href") ?? "").toLowerCase().startsWith("tel:")),
    mailtoLinkFound: anchors.some((a) => (a.getAttribute("href") ?? "").toLowerCase().startsWith("mailto:")),
    formSignals: formLabelSignals(root),
    jsonLdTypes: jsonLdTypes(root),
    geoMetaFound: Boolean(
      root.querySelector('meta[name="geo.position" i], meta[name="geo.region" i], meta[name="ICBM" i]'),
    ),
    mapsEmbedFound: Boolean(
      root.querySelector('iframe[src*="google.com/maps"], iframe[src*="maps.google"], iframe[src*="goo.gl/maps"]') ??
        anchors.some((a) => (a.getAttribute("href") ?? "").includes("google.com/maps")),
    ),
    addressTagFound: Boolean(root.querySelector("address")),
    addressLikeText: ADDRESS_PATTERN.test(text) || UK_POSTCODE.test(text),
    cityMentionCount: 0,
    textSample: text.slice(0, 4000),
    byteLength: html.length,
  };
}

/** True when robots.txt disallows crawling of the given path. */
export function robotsDisallows(robotsTxt: string, path: string): boolean {
  let activeAgent: "any" | "others" = "any";
  let disallowForActive: string[] = [];
  const rules: Array<{ agent: "any" | "others"; disallow: string[] }> = [];
  for (const rawLine of robotsTxt.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") {
      if (activeAgent !== "others" || disallowForActive.length) {
        rules.push({ agent: activeAgent, disallow: disallowForActive });
      }
      activeAgent = /(\*|googlebot|localrank)/i.test(value) && value !== "*" ? "any" : value === "*" ? "any" : "others";
      if (value === "*") activeAgent = "any";
      disallowForActive = [];
    } else if (key === "disallow" && value) {
      disallowForActive.push(value);
    }
  }
  rules.push({ agent: activeAgent, disallow: disallowForActive });
  return rules.some(
    (rule) => rule.agent === "any" && rule.disallow.some((prefix) => prefix === "/" || path.startsWith(prefix)),
  );
}

/** Extracts Sitemap: declarations from robots.txt. */
export function sitemapUrlsFromRobots(robotsTxt: string): string[] {
  return robotsTxt
    .split(/\r?\n/)
    .map((line) => line.split("#")[0].trim())
    .filter((line) => /^sitemap:\s*/i.test(line))
    .map((line) => line.replace(/^sitemap:\s*/i, "").trim());
}

export function looksLikeSitemapXml(body: string, contentType: string): boolean {
  return (
    contentType.includes("xml") ||
    /<urlset[\s>]/i.test(body.slice(0, 2000)) ||
    /<sitemapindex[\s>]/i.test(body.slice(0, 2000))
  );
}

export function detectAddressText(text: string): { ukPostcode: boolean; usZip: boolean; street: boolean } {
  return {
    ukPostcode: UK_POSTCODE.test(text),
    usZip: US_ZIP.test(text),
    street: ADDRESS_PATTERN.test(text),
  };
}
