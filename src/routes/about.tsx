import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader, Prose, SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About LocalRankLens — why this audit exists" },
      {
        name: "description",
        content:
          "LocalRankLens turns a manual Google Business Profile review into a repeatable, weighted audit so small businesses and freelancers get consistent answers.",
      },
      { property: "og:title", content: "About LocalRankLens" },
      {
        property: "og:description",
        content: "The thinking behind a weighted, repeatable local search audit.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="About"
        title="A repeatable answer to a repetitive question"
        description="Every local business asks the same thing: why am I not showing up? The answer is usually a handful of profile gaps — but finding them by hand takes an hour and the result depends on who looked."
      />
      <Prose>
        <h2>What LocalRankLens does</h2>
        <p>
          LocalRankLens encodes a local search audit into 24 weighted checks across six categories.
          You record what is actually on the profile; the engine scores it the same way every time
          and returns a prioritised list of fixes with a recommendation for each one.
        </p>

        <h2>Why it doesn't use the Google API</h2>
        <p>
          Profile data that matters for ranking — photo freshness, post cadence, review responses,
          service lists — is either unavailable or heavily rate-limited through official APIs, and
          scraping is fragile and against the terms of the platforms involved. Recording observations
          keeps the tool honest, cheap to run, and usable on profiles you don't own, such as a
          prospect's or a competitor's.
        </p>

        <h2>What it deliberately doesn't do</h2>
        <ul>
          <li>It doesn't promise rankings. Proximity and competition are outside anyone's control.</li>
          <li>It doesn't generate content with AI and present it as analysis.</li>
          <li>It doesn't store anything about a business beyond what you type in.</li>
        </ul>

        <h2>Who runs it</h2>
        <p>
          This is an independently built software product. It is designed to be operated by one
          person: there is no manual service delivery, no data pipeline to babysit and no per-audit
          cost. If you're evaluating it as an acquisition, the{" "}
          <Link to="/business" className="underline">
            business overview
          </Link>{" "}
          sets out how it works commercially.
        </p>
      </Prose>
    </SiteShell>
  );
}
