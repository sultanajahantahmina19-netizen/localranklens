import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader, SiteShell } from "@/components/site/SiteShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Does LocalRankLens connect to the Google API?",
    a: "No. You record what you can see on the profile and the scoring engine grades it. That keeps the tool free of API quotas, keys and rate limits, and means audits work for profiles you don't own.",
  },
  {
    q: "How is the score calculated?",
    a: "24 checks are grouped into six categories and each carries a weight. A pass earns the full weight, a partial result earns 55%, a fail earns nothing. The total is normalised to 0–100 and mapped to a letter grade.",
  },
  {
    q: "Will fixing everything guarantee a number one ranking?",
    a: "No tool can promise rankings. The checks cover the profile factors that are within your control; proximity to the searcher and competition still matter.",
  },
  {
    q: "Can I use the reports with clients?",
    a: "Yes. Any report prints to a clean PDF from the browser, and the Agency plan is designed for white-label use.",
  },
  {
    q: "What happens when I hit my monthly audit limit?",
    a: "The limit is enforced when you submit an audit, and the quota resets on the first of the month. Saved audits and reports stay available.",
  },
  {
    q: "Can I delete my data?",
    a: "Yes. Audits and locations can be deleted from the app at any time. See the privacy policy for what is stored and why.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — how LocalRankLens audits work" },
      {
        name: "description",
        content:
          "How the scoring works, why there's no Google API connection, what happens at your monthly limit, and how client reporting works.",
      },
      { property: "og:title", content: "FAQ — LocalRankLens" },
      {
        property: "og:description",
        content: "Answers about scoring, limits, reporting and data handling.",
      },
      { property: "og:url", content: "/faq" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="FAQ"
        title="Questions people ask before their first audit"
        description="If something isn't covered here, the contact form goes straight to the site owner."
      />
      <section className="container-page max-w-3xl py-14">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((item, index) => (
            <AccordionItem key={item.q} value={`item-${index}`}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-8 text-sm text-muted-foreground">
          Still stuck?{" "}
          <Link to="/contact" className="underline">
            Send a message
          </Link>
          .
        </p>
      </section>
    </SiteShell>
  );
}
