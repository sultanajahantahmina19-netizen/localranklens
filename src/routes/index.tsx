import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, CheckCircle2, ClipboardList, FileText, MapPinned } from "lucide-react";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AUDIT_CATEGORIES } from "@/lib/audit/types";
import { CHECKS } from "@/lib/audit/engine";
import heroImage from "@/assets/hero-map-lens.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LocalRankLens — score any Google Business Profile in minutes" },
      {
        name: "description",
        content:
          "Audit a Google Business Profile against 24 weighted local ranking checks, get a prioritised fix list, and track the score over time. Free plan, no card needed.",
      },
      { property: "og:title", content: "LocalRankLens — Google Business Profile audits" },
      {
        property: "og:description",
        content:
          "24 weighted local ranking checks, a clear score and a prioritised fix list you can hand to a client.",
      },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const STEPS = [
  {
    icon: ClipboardList,
    title: "Record what you see",
    body: "Walk the profile once and note the facts: categories, reviews, photos, posts, hours, citations. No API keys, no scraping.",
  },
  {
    icon: BarChart3,
    title: "Get a weighted score",
    body: `${CHECKS.length} checks across ${AUDIT_CATEGORIES.length} categories produce a 0–100 score and a letter grade, using the same rules every time.`,
  },
  {
    icon: FileText,
    title: "Hand over the fix list",
    body: "Failures and warnings are ranked by impact, each with a specific recommendation you or the owner can action.",
  },
];

function HomePage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-surface-subtle">
        <div className="container-page grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Local search audits
            </p>
            <h1 className="mt-3 text-balance-tight text-4xl font-semibold md:text-5xl">
              Find out why a business isn't showing up in the map pack
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              LocalRankLens scores a Google Business Profile against {CHECKS.length} weighted local
              ranking checks and returns a prioritised list of fixes — the same audit an agency would
              charge for, in about ten minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Run a free audit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/sample-report">See a sample report</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Free plan: 3 audits a month, no card required.
            </p>
          </div>
          <img
            src={heroImage}
            alt="Illustration of a magnifying lens over a city map with business pins"
            width={1600}
            height={1104}
            className="rounded-2xl border border-border shadow-panel"
          />
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <Card key={step.title}>
              <CardContent className="pt-6">
                <step.icon className="h-6 w-6 text-primary" aria-hidden />
                <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface-subtle py-16">
        <div className="container-page">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">What gets checked</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every audit covers the six areas that decide local visibility. Each check carries a
            weight, so a missing primary category costs more than a missing video.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIT_CATEGORIES.map((category) => (
              <li
                key={category}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-5"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-pass" aria-hidden />
                <div>
                  <p className="font-medium">{category}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {CHECKS.filter((c) => c.category === category).length} checks
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">Who it's for</h2>
            <ul className="mt-6 space-y-4">
              {[
                {
                  title: "Local SEO freelancers",
                  body: "Turn a discovery call into a scored report you can attach to a proposal.",
                },
                {
                  title: "Small agencies",
                  body: "Give every account manager the same repeatable audit, and re-score monthly.",
                },
                {
                  title: "Owner-operators",
                  body: "See which of your own profile gaps actually matter, before paying anyone.",
                },
              ].map((item) => (
                <li key={item.title} className="rounded-xl border border-border p-5">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-panel">
            <MapPinned className="h-6 w-6 text-primary" aria-hidden />
            <h2 className="mt-4 font-display text-2xl font-semibold">Track progress, not vibes</h2>
            <p className="mt-3 text-muted-foreground">
              Save each business as a location and re-audit after the fixes land. Scores are stored
              per audit, so improvement is visible and easy to report.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create a free account
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/pricing">Compare plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-subtle py-16">
        <div className="container-page">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">Start with a guide</h2>
          <p className="mt-3 text-muted-foreground">
            Practical walkthroughs of the checks the audit scores.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/guides">Browse the guides</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/faq">Read the FAQ</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
