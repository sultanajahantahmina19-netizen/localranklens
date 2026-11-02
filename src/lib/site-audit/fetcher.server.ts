/**
 * Server-only guarded fetcher. Every outbound request made by the website
 * auditor goes through here so redirects and DNS are re-validated and
 * private/internal addresses are unreachable.
 */

import { isBlockedHostname, isPrivateIPv4, isPrivateIPv6, validateAndNormalizeUrl } from "./url-guard";

export type FetchFailureKind =
  | "invalid_url"
  | "dns_not_found"
  | "dns_unverified"
  | "blocked_host"
  | "timeout"
  | "ssl_error"
  | "http_404"
  | "http_error"
  | "blocked_by_site"
  | "not_html"
  | "too_large"
  | "too_many_redirects"
  | "network_error";

export interface FetchFailure {
  ok: false;
  kind: FetchFailureKind;
  userMessage: string;
  detail?: string;
  status?: number;
}

export interface FetchSuccess {
  ok: true;
  requestedUrl: string;
  finalUrl: string;
  status: number;
  redirectChain: string[];
  body: string;
  contentType: string;
  bytes: number;
  elapsedMs: number;
  headers: Record<string, string>;
}

export type PageFetchResult = FetchSuccess | FetchFailure;

const USER_AGENT =
  "Mozilla/5.0 (compatible; LocalRankLensAuditBot/1.0; +https://localranklens.lovable.app/bot)";

interface DoHAnswer {
  type?: number;
  data?: string;
}

interface DoHResponse {
  Status?: number;
  Answer?: DoHAnswer[];
}

/**
 * Resolves a hostname through DNS-over-HTTPS so we can inspect the actual IP
 * addresses before fetching. In this server runtime we cannot inspect the
 * socket the fetch uses, so resolving first and refusing private ranges is the
 * practical SSRF guard.
 */
export async function resolveHost(
  hostname: string,
): Promise<{ ok: true; addresses: string[] } | { ok: false; kind: "dns_not_found" | "dns_unverified" | "blocked_host"; detail?: string }> {
  if (isBlockedHostname(hostname)) return { ok: false, kind: "blocked_host", detail: "blocked hostname" };

  const ipv4Literal = hostname.match(/^(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (ipv4Literal) {
    return isPrivateIPv4(ipv4Literal[1])
      ? { ok: false, kind: "blocked_host" }
      : { ok: false, kind: "dns_unverified", detail: "bare IP address" };
  }
  const v6 = hostname.replace(/^\[|\]$/g, "");
  if (v6.includes(":")) {
    return isPrivateIPv6(v6)
      ? { ok: false, kind: "blocked_host" }
      : { ok: false, kind: "dns_unverified", detail: "bare IPv6 address" };
  }

  try {
    const [a, aaaa] = await Promise.all([
      dohQuery(hostname, "A"),
      dohQuery(hostname, "AAAA"),
    ]);
    const answers = [...(a?.Answer ?? []), ...(aaaa?.Answer ?? [])].filter(
      (ans) => ans.type === 1 || ans.type === 28,
    );
    if (a?.Status === 3) {
      return { ok: false, kind: "dns_not_found", detail: "NXDOMAIN" };
    }
    const addresses = answers.map((ans) => ans.data!).filter(Boolean);
    if (addresses.length === 0) {
      return a && a.Status === 0
        ? { ok: false, kind: "dns_not_found", detail: "no A/AAAA records" }
        : { ok: false, kind: "dns_unverified", detail: "resolver gave no addresses" };
    }
    if (addresses.some((ip) => isPrivateIPv4(ip) || isPrivateIPv6(ip))) {
      return { ok: false, kind: "blocked_host", detail: "resolves to a private address" };
    }
    return { ok: true, addresses };
  } catch {
    return { ok: false, kind: "dns_unverified", detail: "resolver unreachable" };
  }
}

async function dohQuery(hostname: string, type: string): Promise<DoHResponse | null> {
  const response = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=${type}`,
    { headers: { Accept: "application/dns-json" }, signal: AbortSignal.timeout(6000) },
  );
  if (!response.ok) return null;
  return (await response.json()) as DoHResponse;
}

export function fetchFailureMessage(kind: FetchFailureKind): string {
  switch (kind) {
    case "dns_not_found":
      return "We couldn't find a website at this domain. Please check the URL and try again.";
    case "blocked_host":
      return "This address points to an internal or private network and cannot be analyzed.";
    case "dns_unverified":
      return "We couldn't verify this domain right now. Please try again in a moment.";
    case "timeout":
      return "The website took too long to respond. It may be slow or temporarily unavailable.";
    case "ssl_error":
      return "The website's security certificate could not be verified, so the connection was refused.";
    case "http_404":
      return "The website exists, but the requested page was not found (404).";
    case "http_error":
      return "The website exists, but the requested page returned an error.";
    case "blocked_by_site":
      return "We couldn't access this website for automated analysis.";
    case "not_html":
      return "That address is reachable but does not serve a web page we can analyze.";
    case "too_large":
      return "The page is too large to analyze.";
    case "too_many_redirects":
      return "The website redirected too many times, so we stopped following it.";
    default:
      return "We couldn't reach this website. Check the address and try again.";
  }
}

function classifyNetworkError(error: unknown): FetchFailure {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  if (/timeout|abort/i.test(message)) {
    return { ok: false, kind: "timeout", detail: message, userMessage: fetchFailureMessage("timeout") };
  }
  if (/ssl|certificate|tls/i.test(message)) {
    return { ok: false, kind: "ssl_error", detail: message, userMessage: fetchFailureMessage("ssl_error") };
  }
  return {
    ok: false,
    kind: "network_error",
    detail: message,
    userMessage: fetchFailureMessage("network_error"),
  };
}

function statusFailure(status: number, kind: FetchFailureKind): FetchFailure {
  return { ok: false, kind, status, userMessage: fetchFailureMessage(kind) };
}

/** Reads the body as text, refusing to buffer more than maxBytes. */
async function readBodyCapped(
  response: Response,
  maxBytes: number,
): Promise<{ body: string; bytes: number; truncated: boolean } | FetchFailure> {
  const reader = response.body?.getReader();
  if (!reader) return { body: "", bytes: 0, truncated: false };
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let truncated = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        bytes += value.byteLength;
        if (bytes > maxBytes) {
          truncated = true;
          void reader.cancel().catch(() => undefined);
          break;
        }
        chunks.push(value);
      }
    }
  } catch (error) {
    return classifyNetworkError(error);
  }
  const parts = chunks.map((chunk) => decoder.decode(chunk, { stream: true }));
  parts.push(decoder.decode());
  return { body: parts.join(""), bytes, truncated };
}

export interface GuardedFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  /** Require an HTML content type on the final response (default true). */
  requireHtml?: boolean;
  extraHeaders?: Record<string, string>;
}

/**
 * Fetches a page following redirects manually. Every hop is re-validated
 * (scheme, hostname, DNS resolution) before the request is sent.
 */
export async function guardedFetch(rawUrl: string, options: GuardedFetchOptions = {}): Promise<PageFetchResult> {
  const {
    timeoutMs = 15000,
    maxBytes = 2_000_000,
    maxRedirects = 5,
    requireHtml = true,
    extraHeaders,
  } = options;

  const checked = validateAndNormalizeUrl(rawUrl);
  if (!checked.ok) {
    return { ok: false, kind: "invalid_url", userMessage: checked.userMessage };
  }

  let currentUrl = checked.url.toString();
  const redirectChain: string[] = [];

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const resolved = await resolveHost(currentUrl ? new URL(currentUrl).hostname : "");
    if (!resolved.ok) {
      return {
        ok: false,
        kind: resolved.kind === "dns_not_found" || resolved.kind === "dns_unverified" ? resolved.kind : "blocked_host",
        detail: resolved.detail,
        userMessage: fetchFailureMessage(resolved.kind === "dns_not_found" ? "dns_not_found" : resolved.kind === "blocked_host" ? "blocked_host" : "dns_unverified"),
      };
    }

    let response: Response;
    const startedAt = Date.now();
    try {
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en",
          ...extraHeaders,
        },
      });
    } catch (error) {
      return classifyNetworkError(error);
    }
    const elapsedMs = Date.now() - startedAt;

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        return { ok: false, kind: "network_error", status: response.status, userMessage: fetchFailureMessage("network_error") };
      }
      let next: URL;
      try {
        next = new URL(location, currentUrl);
      } catch {
        return { ok: false, kind: "network_error", status: response.status, userMessage: fetchFailureMessage("network_error") };
      }
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        return { ok: false, kind: "network_error", status: response.status, userMessage: fetchFailureMessage("network_error") };
      }
      if (next.hostname !== new URL(currentUrl).hostname) {
        // Cross-host redirects are common (example.com → www.example.com);
        // re-run the full guard on the new host before continuing.
        const recheck = validateAndNormalizeUrl(next.toString());
        if (!recheck.ok) {
          return { ok: false, kind: "blocked_host", detail: recheck.userMessage, userMessage: fetchFailureMessage("blocked_host") };
        }
      }
      redirectChain.push(currentUrl);
      currentUrl = next.toString();
      continue;
    }

    if (hop > maxRedirects) {
      return { ok: false, kind: "too_many_redirects", userMessage: fetchFailureMessage("too_many_redirects") };
    }

    if (response.status === 404 || response.status === 410) {
      return statusFailure(response.status, "http_404");
    }
    if (response.status === 401 || response.status === 403 || response.status === 429) {
      return statusFailure(response.status, "blocked_by_site");
    }
    if (response.status >= 400) {
      return statusFailure(response.status, "http_error");
    }
    if (response.status < 200 || response.status >= 300) {
      return statusFailure(response.status, "http_error");
    }

    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const looksHtml = contentType.includes("text/html") || contentType.includes("application/xhtml+xml") || contentType === "";
    if (requireHtml && !looksHtml) {
      return {
        ok: false,
        kind: "not_html",
        status: response.status,
        detail: contentType,
        userMessage: fetchFailureMessage("not_html"),
      };
    }

    const bodyResult = await readBodyCapped(response, maxBytes);
    if (!("body" in bodyResult)) return bodyResult;

    return {
      ok: true,
      requestedUrl: checked.url.toString(),
      finalUrl: currentUrl,
      status: response.status,
      redirectChain,
      body: bodyResult.body,
      contentType,
      bytes: bodyResult.bytes,
      elapsedMs,
      headers,
    };
  }

  return { ok: false, kind: "too_many_redirects", userMessage: fetchFailureMessage("too_many_redirects") };
}

/** Like guardedFetch but tolerant: robots.txt/sitemaps may be XML, missing, or blocked. */
export async function guardedFetchLenient(
  rawUrl: string,
  options: GuardedFetchOptions = {},
): Promise<PageFetchResult> {
  return guardedFetch(rawUrl, { requireHtml: false, timeoutMs: 10000, maxBytes: 500_000, ...options });
}
