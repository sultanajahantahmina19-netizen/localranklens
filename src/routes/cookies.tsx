import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, Prose, SiteShell } from "@/components/site/SiteShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — LocalRankLens" },
      {
        name: "description",
        content:
          "The cookies and browser storage LocalRankLens uses: sign-in session and CSRF protection only, with no advertising or cross-site tracking.",
      },
      { property: "og:title", content: "Cookie Policy — LocalRankLens" },
      { property: "og:description", content: "Essential cookies only — no ad tracking." },
      { property: "og:url", content: "/cookies" },
    ],
    links: [{ rel: "canonical", href: "/cookies" }],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Legal" title="Cookie Policy" description="Last updated: on deployment." />
      <div className="container-page max-w-3xl pt-10">
        <Alert>
          <AlertTitle>Template document</AlertTitle>
          <AlertDescription>
            This describes how the software behaves as built. If you add analytics or advertising
            tools, update this page and check whether a consent banner is required where your users
            are.
          </AlertDescription>
        </Alert>
      </div>
      <Prose>
        <h2>What we use</h2>
        <ul>
          <li>
            <strong>Authentication session.</strong> When you sign in, a session token is stored in
            your browser so you stay signed in between visits. Clearing it signs you out.
          </li>
          <li>
            <strong>Security token.</strong> A cookie used to protect form submissions against
            cross-site request forgery.
          </li>
        </ul>

        <h2>What we don't use</h2>
        <p>
          No advertising cookies, no social media pixels, no cross-site tracking, and no third-party
          analytics that profile individuals. Product usage is measured as aggregate counts of events
          such as “audit created”, tied to your account rather than to a tracking identifier.
        </p>

        <h2>Managing cookies</h2>
        <p>
          You can clear or block cookies in your browser settings. Blocking the essential cookies
          above will prevent you from signing in.
        </p>
      </Prose>
    </SiteShell>
  );
}
