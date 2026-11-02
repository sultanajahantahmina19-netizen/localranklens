/**
 * Pure URL validation and SSRF guard rules. Runs on both server and client.
 * The network parts (DNS resolution, fetching) live in fetcher.server.ts.
 */

export interface UrlCheckOk {
  ok: true;
  url: URL;
  normalized: string;
}

export interface UrlCheckErr {
  ok: false;
  userMessage: string;
}

/** Hostnames that can never be audited: loopback, internal naming, cloud metadata. */
const BLOCKED_HOSTNAMES = [
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  "metadata.google.internal",
  "metadata.goog",
];

const BLOCKED_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".home.arpa",
  ".test",
  ".example",
  ".invalid",
];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    value = value * 256 + n;
  }
  return value;
}

/** IPv4 ranges that must never be fetched (private, loopback, link-local, metadata, reserved). */
const BLOCKED_V4_RANGES: Array<[string, string]> = [
  ["0.0.0.0", "0.255.255.255"], // "this network"
  ["10.0.0.0", "10.255.255.255"], // private
  ["100.64.0.0", "100.127.255.255"], // carrier-grade NAT
  ["127.0.0.0", "127.255.255.255"], // loopback
  ["169.254.0.0", "169.254.255.255"], // link-local incl. cloud metadata 169.254.169.254
  ["172.16.0.0", "172.31.255.255"], // private
  ["192.0.0.0", "192.0.0.255"], // IETF protocol assignments
  ["192.0.2.0", "192.0.2.255"], // TEST-NET-1
  ["192.88.99.0", "192.88.99.255"],
  ["192.168.0.0", "192.168.255.255"], // private
  ["198.18.0.0", "198.19.255.255"], // benchmarking
  ["198.51.100.0", "198.51.100.255"], // TEST-NET-2
  ["203.0.113.0", "203.0.113.255"], // TEST-NET-3
  ["224.0.0.0", "239.255.255.255"], // multicast
  ["240.0.0.0", "255.255.255.255"], // reserved + broadcast
];

export function isPrivateIPv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  if (value === null) return false;
  return BLOCKED_V4_RANGES.some(([start, end]) => {
    const lo = ipv4ToInt(start)!;
    const hi = ipv4ToInt(end)!;
    return value >= lo && value <= hi;
  });
}

export function isPrivateIPv6(ip: string): boolean {
  const addr = ip.toLowerCase().replace(/^\[|\]$/g, "");
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  if (addr === "::" || addr === "::1") return true;
  const first = addr.split(":")[0] ?? "";
  if (first.startsWith("fe8") || first.startsWith("fe9") || first.startsWith("fea") || first.startsWith("feb")) return true; // link-local
  if (first.startsWith("fc") || first.startsWith("fd")) return true; // unique local
  return false;
}

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(host)) return true;
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  // Bare IP literals are checked by the IP functions; block IPv4 literals outright
  // because we cannot verify what the DNS actually resolves to for them.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return false;
}

/**
 * Validates and normalizes a user-supplied website URL:
 * adds a scheme when missing, allows only http/https, rejects credentials,
 * unusual ports and internal addresses.
 */
export function validateAndNormalizeUrl(raw: string): UrlCheckOk | UrlCheckErr {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, userMessage: "Please enter a website URL." };
  }
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false, userMessage: "That doesn't look like a valid URL. Check the address and try again." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, userMessage: "Only http and https website addresses can be analyzed." };
  }
  if (url.username || url.password) {
    return { ok: false, userMessage: "URLs with embedded sign-in details can't be analyzed." };
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    return { ok: false, userMessage: "Only standard web ports (80 and 443) can be analyzed." };
  }
  if (!url.hostname || !url.hostname.includes(".")) {
    return { ok: false, userMessage: "Please enter a full domain, for example example.com." };
  }
  if (isBlockedHostname(url.hostname)) {
    return {
      ok: false,
      userMessage: "This address points to an internal or private network and cannot be analyzed.",
    };
  }
  if (url.hash) url.hash = "";
  url.hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  return { ok: true, url, normalized: url.toString().replace(/\/$/, url.pathname === "/" ? "/" : "") };
}

/** Normalized origin+path key used for caching PageSpeed results. */
export function cacheKeyForUrl(url: URL): string {
  return `${url.origin}${url.pathname === "/" ? "/" : url.pathname}${url.search}`;
}
