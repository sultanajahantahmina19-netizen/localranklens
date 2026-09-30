import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { PageHeader, Prose, SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { findGuide, GUIDES } from "@/content/guides";

export const Route = createFileRoute("/guides/$slug")({
  loader: ({ params }) => {
    const guide = findGuide(params.slug);
    if (!guide) throw notFound();
    return { guide };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Guide unavailable — LocalRankLens" }, { name: "robots", content: "noindex" }],
      };
    }
    const { guide } = loaderData;
    return {
      meta: [
        { title: guide.metaTitle },
        { name: "description", content: guide.description },
        { property: "og:title", content: guide.metaTitle },
        { property: "og:description", content: guide.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/guides/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/guides/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.title,
            description: guide.description,
            dateModified: guide.updated,
            author: { "@type": "Organization", name: "LocalRankLens" },
          }),
        },
      ],
    };
  },
  notFoundComponent: GuideNotFound,
  component: GuidePage,
});

function GuideNotFound() {
  return (
    <SiteShell>
      <PageHeader
        title="That guide doesn't exist"
        description="It may have been renamed. The full list is one click away."
      >
        <Button asChild>
          <Link to="/guides">Browse all guides</Link>
        </Button>
      </PageHeader>
    </SiteShell>
  );
}

function GuidePage() {
  const { guide } = Route.useLoaderData();
  const related = guide.related
    .map((slug) => GUIDES.find((g) => g.slug === slug))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Guide"
        title={guide.title}
        description={`${guide.readingMinutes} min read · updated ${new Date(guide.updated).toLocaleDateString()}`}
      />
      <Prose>
        <p className="text-base text-foreground">{guide.intro}</p>

        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets ? (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <h2>Score this profile</h2>
        <p>
          A LocalRankLens audit turns everything above into a 0–100 score with the fixes ranked by
          impact. The free plan covers three audits a month.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Run a free audit
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/sample-report">See a sample report</Link>
          </Button>
        </div>

        {related.length ? (
          <>
            <h2>Keep reading</h2>
            <ul>
              {related.map((item) => (
                <li key={item.slug}>
                  <Link to="/guides/$slug" params={{ slug: item.slug }} className="underline">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Prose>
    </SiteShell>
  );
}
