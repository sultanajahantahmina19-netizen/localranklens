import { createFileRoute } from "@tanstack/react-router";

import { GUIDES } from "@/content/guides";

/** Public, indexable pages. App and admin pages are deliberately excluded. */
const STATIC_PATHS = [
  "/",
  "/features",
  "/pricing",
  "/sample-report",
  "/guides",
  "/faq",
  "/about",
  "/contact",
  "/business",
  "/privacy",
  "/terms",
  "/cookies",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        // Built from the requesting host, so it stays correct on any domain.
        const origin = process.env["PUBLIC_SITE_URL"] ?? new URL(request.url).origin;
        const urls = [
          ...STATIC_PATHS.map((path) => `<url><loc>${origin}${path}</loc></url>`),
          ...GUIDES.map(
            (guide) =>
              `<url><loc>${origin}/guides/${guide.slug}</loc><lastmod>${guide.updated}</lastmod></url>`,
          ),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
