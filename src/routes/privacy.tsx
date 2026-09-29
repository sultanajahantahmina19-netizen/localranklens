import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader, Prose, SiteShell } from "@/components/site/SiteShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — LocalRankLens" },
      {
        name: "description",
        content:
          "What LocalRankLens stores, why, how long for, and how to delete it. Template policy to be reviewed before commercial use.",
      },
      { property: "og:title", content: "Privacy Policy — LocalRankLens" },
      { property: "og:description", content: "Data stored, purposes, retention and deletion." },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Legal" title="Privacy Policy" description="Last updated: on deployment." />
      <div className="container-page max-w-3xl pt-10">
        <Alert>
          <AlertTitle>Template document</AlertTitle>
          <AlertDescription>
            This policy is a starting template that reflects how the software actually works. It is
            not legal advice. Before trading, have it reviewed against your business, your hosting
            locations and your jurisdiction.
          </AlertDescription>
        </Alert>
      </div>
      <Prose>
        <h2>Who we are</h2>
        <p>
          LocalRankLens is a web application for auditing Google Business Profiles. The operator of
          this installation is the data controller; contact details are on the{" "}
          <Link to="/contact" className="underline">
            contact page
          </Link>
          .
        </p>

        <h2>What we store</h2>
        <ul>
          <li><strong>Account data:</strong> email address, and optionally your name and company name.</li>
          <li><strong>Audit data:</strong> the business details and observations you enter, plus the resulting scores and findings.</li>
          <li><strong>Saved locations:</strong> business name, category, city and any notes you add.</li>
          <li><strong>Activity events:</strong> minimal product events (for example “audit created”) used to understand feature usage.</li>
          <li><strong>Contact messages:</strong> the name, email and message you submit through the contact form.</li>
        </ul>

        <h2>What we don't do</h2>
        <ul>
          <li>We don't sell or rent personal data.</li>
          <li>We don't run third-party advertising or cross-site tracking pixels.</li>
          <li>We don't store payment card details; if a payment provider is connected, it handles card data directly.</li>
        </ul>

        <h2>Why we store it</h2>
        <p>
          To provide the service you signed up for (running and storing audits), to enforce plan
          limits, to reply to your messages, and to keep the service secure. Product analytics are
          aggregate counts, not profiling.
        </p>

        <h2>Retention</h2>
        <p>
          Account, audit and location data is kept until you delete it or close your account. Audits
          and locations can be deleted from inside the app at any time. Contact messages are kept
          while needed to handle your enquiry.
        </p>

        <h2>Your rights</h2>
        <p>
          Depending on where you live, you may have the right to access, correct, export or delete
          your personal data, and to object to certain processing. Email the address on the contact
          page and we will respond.
        </p>

        <h2>Processors</h2>
        <p>
          The application is hosted on a managed cloud platform and uses a managed PostgreSQL
          database and authentication service. If email delivery or a payment provider is connected,
          those providers process the minimum data needed for those functions.
        </p>

        <h2>Cookies</h2>
        <p>
          We use cookies and browser storage that are necessary to keep you signed in and to protect
          forms against cross-site request forgery. See the{" "}
          <Link to="/cookies" className="underline">
            cookie policy
          </Link>
          .
        </p>
      </Prose>
    </SiteShell>
  );
}
