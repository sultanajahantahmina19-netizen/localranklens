import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, Prose, SiteShell } from "@/components/site/SiteShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — LocalRankLens" },
      {
        name: "description",
        content:
          "The terms covering accounts, acceptable use, plan limits, no ranking guarantees, liability and termination. Template to be reviewed before commercial use.",
      },
      { property: "og:title", content: "Terms of Service — LocalRankLens" },
      { property: "og:description", content: "Accounts, acceptable use, limits and liability." },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Legal" title="Terms of Service" description="Last updated: on deployment." />
      <div className="container-page max-w-3xl pt-10">
        <Alert>
          <AlertTitle>Template document</AlertTitle>
          <AlertDescription>
            These terms are a starting template, not legal advice. Have them reviewed for your
            business and jurisdiction before you charge customers.
          </AlertDescription>
        </Alert>
      </div>
      <Prose>
        <h2>1. Agreement</h2>
        <p>
          By creating an account or using this service you agree to these terms. If you do not agree,
          do not use the service.
        </p>

        <h2>2. Accounts</h2>
        <p>
          You are responsible for keeping your password confidential and for activity under your
          account. You must provide an email address you control, and you must be old enough to form
          a binding contract where you live.
        </p>

        <h2>3. Acceptable use</h2>
        <ul>
          <li>Don't attempt to break, overload or probe the service or its infrastructure.</li>
          <li>Don't resell access to the service itself (reselling reports you produce is fine).</li>
          <li>Don't upload unlawful content or anyone else's personal data you have no right to use.</li>
        </ul>

        <h2>4. Plans and limits</h2>
        <p>
          Each plan includes a monthly audit quota and a saved-location limit, enforced by the
          service. Quotas reset at the start of each calendar month and are not carried over. Where
          paid plans are available, they are billed in advance through the connected payment provider
          and can be cancelled at any time, effective at the end of the paid period unless local law
          requires otherwise.
        </p>

        <h2>5. No ranking guarantee</h2>
        <p>
          The audit scores factors under your control on a business profile. Search ranking depends on
          factors nobody controls, including searcher proximity and competition. Nothing in the
          service is a guarantee of rankings, traffic or revenue.
        </p>

        <h2>6. Your content</h2>
        <p>
          You keep ownership of the data you enter and the reports it produces. You grant us only the
          licence needed to host and display that data back to you.
        </p>

        <h2>7. Availability</h2>
        <p>
          The service is provided “as is”. We aim for high availability but do not promise
          uninterrupted service, and we may change features over time.
        </p>

        <h2>8. Liability</h2>
        <p>
          To the extent permitted by law, our total liability is limited to the amount you paid in the
          twelve months before the claim, and we are not liable for indirect or consequential losses
          including lost profits.
        </p>

        <h2>9. Termination</h2>
        <p>
          You can stop using the service and delete your data at any time. We may suspend accounts
          that breach these terms.
        </p>

        <h2>10. Changes</h2>
        <p>
          We may update these terms; material changes will be communicated to registered users by
          email or in-app notice.
        </p>
      </Prose>
    </SiteShell>
  );
}
