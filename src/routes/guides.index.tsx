import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader, SiteShell } from "@/components/site/SiteShell";
import { Card, CardContent } from "@/components/ui/card";
import { GUIDES, PLANNED_TOPICS } from "@/content/guides";

export const Route = createFileRoute("/guides/")({
  head: () => ({
    meta: [
      { title: "Local search guides — LocalRankLens" },
      {
        name: "description",
        content:
          "Practical guides to Google Business Profile optimisation: categories, reviews, photos, posts and the full audit checklist.",
      },
      { property: "og:title", content: "Local search guides — LocalRankLens" },
      {
        property: "og:description",
        content: "Plain-English guides to the profile factors that decide local visibility.",
      },
      { property: "og:url", content: "/guides" },
    ],
    links: [{ rel: "canonical", href: "/guides" }],
  }),
  component: GuidesIndex,
});

function GuidesIndex() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Guides"
        title="Local search, without the jargon"
        description="Each guide covers checks the audit scores, so you can fix things yourself or understand what a report is telling you."
      />

      <section className="container-page py-14">
        <div className="grid gap-6 md:grid-cols-2">
          {GUIDES.map((guide) => (
            <Card key={guide.slug}>
              <CardContent className="pt-6">
                <h2 className="font-display text-lg font-semibold">
                  <Link
                    to="/guides/$slug"
                    params={{ slug: guide.slug }}
                    className="transition-colors hover:text-primary"
                  >
                    {guide.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{guide.description}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {guide.readingMinutes} min read
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-14 rounded-xl border border-border bg-surface-subtle p-6">
          <h2 className="font-display text-lg font-semibold">Coming next</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Topics planned for this section. They aren't written yet, so there's nothing to click —
            this is the content roadmap, kept public on purpose.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {PLANNED_TOPICS.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
