import { Link } from "@tanstack/react-router";

import { Logo } from "./Logo";

const GROUPS = [
  {
    title: "Product",
    links: [
      { to: "/features", label: "Features" },
      { to: "/pricing", label: "Pricing" },
      { to: "/sample-report", label: "Sample report" },
      { to: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Learn",
    links: [
      { to: "/guides", label: "Local SEO guides" },
      { to: "/guides/google-business-profile-audit-checklist", label: "How to audit a profile" },
      { to: "/guides/google-business-profile-categories", label: "Choosing categories" },
      { to: "/guides/how-to-ask-for-google-reviews", label: "Getting more reviews" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
      { to: "/business", label: "Business overview" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy Policy" },
      { to: "/terms", label: "Terms of Service" },
      { to: "/cookies", label: "Cookie Policy" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-subtle">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A structured Google Business Profile audit for local businesses and the people who
            manage them.
          </p>
        </div>
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-page flex flex-col gap-2 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} LocalRankLens. Not affiliated with Google.</p>
        <p>Audit scoring is guidance based on published local search best practice.</p>
      </div>
    </footer>
  );
}
