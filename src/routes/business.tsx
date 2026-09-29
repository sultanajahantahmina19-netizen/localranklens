import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader, Prose, SiteShell } from "@/components/site/SiteShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CHECKS } from "@/lib/audit/engine";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Business overview for buyers — LocalRankLens" },
      {
        name: "description",
        content:
          "What LocalRankLens is, who it serves, how it makes money, the stack it runs on, what operating it involves, and where an owner could grow it.",
      },
      { property: "og:title", content: "Business overview — LocalRankLens" },
      {
        property: "og:description",
        content: "Product, audience, model, stack, operating requirements and growth options.",
      },
      { property: "og:url", content: "/business" },
    ],
    links: [{ rel: "canonical", href: "/business" }],
  }),
  component: BusinessPage,
});

function BusinessPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="For buyers and investors"
        title="Business overview"
        description="An honest description of what this product is today, and what it would take to run or grow it."
      />

      <div className="container-page max-w-3xl pt-10">
        <Alert>
          <AlertTitle>No trading history</AlertTitle>
          <AlertDescription>
            This is a newly built product. There are no customers, no revenue and no traffic history
            to report, and nothing on this page should be read as a revenue projection. What is on
            offer is a working, documented codebase with a functioning product and a clear model.
          </AlertDescription>
        </Alert>
      </div>

      <Prose>
        <h2>What it does</h2>
        <p>
          LocalRankLens scores a Google Business Profile against {CHECKS.length} weighted local
          search checks and returns a prioritised list of fixes. The person running the audit records
          what they can see on the profile; the engine does the grading, consistently, every time.
        </p>

        <h2>Who it serves</h2>
        <ul>
          <li>Local SEO freelancers who need a repeatable audit to attach to proposals.</li>
          <li>Small agencies that want every account manager producing the same report.</li>
          <li>Owner-operators of local businesses checking their own profile before they hire anyone.</li>
        </ul>

        <h2>How it makes money</h2>
        <p>
          Freemium subscription. The free plan allows three audits a month and one saved location,
          which is enough to prove value on a single business. Paid plans raise audit quotas, saved
          locations and add white-label reporting for agency use. Plan limits are enforced
          server-side today; connecting a payment provider is a configuration step, documented in
          OWNER_GUIDE.md, and the owner connects their own account.
        </p>
        <p>
          Secondary options an owner could add without redesigning anything: one-off paid audits for
          non-subscribers, affiliate links on the guide content, and a done-for-you audit service
          priced above the subscription.
        </p>

        <h2>Technology</h2>
        <ul>
          <li>React 19 with TanStack Start (server-side rendering, file-based routing, typed server functions), TypeScript throughout.</li>
          <li>Tailwind CSS 4 with a tokenised design system, shadcn/ui components.</li>
          <li>PostgreSQL with row-level security, email/password and Google authentication, managed through Lovable Cloud (Supabase under the hood).</li>
          <li>Scoring logic is plain TypeScript with no third-party API dependency, so there is no per-audit cost and nothing to break when an external API changes.</li>
        </ul>

        <h2>What operating it involves</h2>
        <ul>
          <li>No manual service delivery: audits are produced by the app, not by a person.</li>
          <li>No external API keys or data feeds to maintain, and therefore no usage costs that scale with audits.</li>
          <li>Hosting and database are managed services; running costs are the hosting plan plus a domain.</li>
          <li>Ongoing work is content, support email and occasional dependency updates.</li>
        </ul>

        <h2>Where the traffic would come from</h2>
        <p>
          The product answers search queries people already type: audit tools, profile checklists and
          “why am I not showing up on Google Maps”. The site ships with a guides section built for
          that intent, along with sitemap, robots, canonical tags, per-page metadata and structured
          data. Search results are never guaranteed and none are claimed here.
        </p>

        <h2>Realistic growth opportunities</h2>
        <ul>
          <li><strong>Content depth:</strong> expand the guides into category-specific checklists (dentists, trades, restaurants), which match how people search.</li>
          <li><strong>Product features:</strong> competitor side-by-side scoring, scheduled re-audits with email reminders, CSV export, team seats.</li>
          <li><strong>New segments:</strong> multi-location franchises and marketing departments need the same audit at greater volume.</li>
          <li><strong>Partnerships:</strong> web design studios and local marketing consultants who want a white-label audit to hand clients.</li>
          <li><strong>Paid acquisition:</strong> the audience is searchable and narrow, so small, testable budgets are possible once pricing is validated.</li>
          <li><strong>Affiliates:</strong> review-request tools, citation services and booking platforms are natural, relevant recommendations.</li>
          <li><strong>International:</strong> the checks are not country-specific; the interface and content can be translated.</li>
        </ul>

        <h2>What transfers</h2>
        <p>
          The repository, the database schema and migrations, the design system, the documentation set
          (README, owner guide, transfer guide) and the domain if included. Environment variables are
          documented in <code>.env.example</code>, and no credentials are committed. See{" "}
          <Link to="/contact" className="underline">
            contact
          </Link>{" "}
          to ask anything this page doesn't cover.
        </p>
      </Prose>
    </SiteShell>
  );
}
