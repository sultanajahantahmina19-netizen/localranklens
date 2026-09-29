import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader, SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CHECKS } from "@/lib/audit/engine";
import { AUDIT_CATEGORIES } from "@/lib/audit/types";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — what a LocalRankLens audit covers" },
      {
        name: "description",
        content:
          "24 weighted checks across profile completeness, categories, reviews, photos, activity and citations — plus saved locations, printable reports and score history.",
      },
      { property: "og:title", content: "Features — LocalRankLens" },
      {
        property: "og:description",
        content: "Every check, category weighting and reporting feature in a LocalRankLens audit.",
      },
      { property: "og:url", content: "/features" },
    ],
    links: [{ rel: "canonical", href: "/features" }],
  }),
  component: FeaturesPage,
});

const PRODUCT_FEATURES = [
  {
    title: "Deterministic scoring",
    body: "The same inputs always produce the same score. No black box, no AI guesswork — you can explain every point to a client.",
  },
  {
    title: "Prioritised action list",
    body: "Failures and warnings are sorted by weight, so the first three items are always the ones worth doing first.",
  },
  {
    title: "Saved locations",
    body: "Store the businesses you audit regularly. Details pre-fill the form, and score history is grouped per location.",
  },
  {
    title: "Printable reports",
    body: "Any report prints to a clean PDF from the browser — handy for proposals and monthly client updates.",
  },
  {
    title: "Usage limits per plan",
    body: "Monthly audit quotas and saved-location limits are enforced server-side, ready to attach to a payment provider.",
  },
  {
    title: "Admin area",
    body: "User management, plan changes, role control, contact messages and signup/audit trends for the site owner.",
  },
];

function FeaturesPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Features"
        title="Everything in a LocalRankLens audit"
        description={`${CHECKS.length} weighted checks across ${AUDIT_CATEGORIES.length} categories, plus the reporting and account tools around them.`}
      >
        <Button asChild>
          <Link to="/auth" search={{ mode: "signup" }}>
            Run a free audit
          </Link>
        </Button>
      </PageHeader>

      <section className="container-page py-14">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="pt-6">
                <h2 className="font-display text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface-subtle py-14">
        <div className="container-page">
          <h2 className="font-display text-2xl font-semibold">The full check list</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Weights are shown out of {CHECKS.reduce((sum, c) => sum + c.weight, 0)} total points.
          </p>
          <div className="mt-8 space-y-8">
            {AUDIT_CATEGORIES.map((category) => (
              <div key={category}>
                <h3 className="font-display text-lg font-semibold">{category}</h3>
                <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
                  {CHECKS.filter((check) => check.category === category).map((check) => (
                    <li
                      key={check.key}
                      className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                    >
                      <span>{check.label}</span>
                      <span className="shrink-0 text-muted-foreground">{check.weight} pts</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
