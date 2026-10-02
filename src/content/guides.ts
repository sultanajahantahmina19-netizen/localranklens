/**
 * Guide content lives here as structured data so the routes stay presentational
 * and a new owner can add an article by appending one object.
 */

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  updated: string;
  readingMinutes: number;
  intro: string;
  sections: GuideSection[];
  related: string[];
}

export const GUIDES: Guide[] = [
  {
    slug: "why-my-business-isnt-showing-up-on-google-maps",
    title: "Why your business isn't showing up on Google Maps",
    metaTitle: "Why your business isn't showing up on Google Maps (and how to check)",
    description:
      "The practical reasons a local business is missing from Google Maps results, in the order worth checking: verification, categories, proximity, duplicates and profile gaps.",
    updated: "2026-01-01",
    readingMinutes: 7,
    intro:
      "“We don't show up on Maps” almost always has a specific cause, and it is usually one of six things. Work through them in this order — the cheap checks are first.",
    sections: [
      {
        heading: "1. The profile isn't verified",
        paragraphs: [
          "An unverified profile can appear in some results but is heavily disadvantaged, and anyone can suggest edits to it. Verification is free and done in Google Business Profile Manager.",
          "If verification was started and abandoned — common after a change of ownership or agency — the profile can sit in limbo for months without anyone noticing.",
        ],
      },
      {
        heading: "2. The primary category is wrong",
        paragraphs: [
          "The primary category is the single strongest lever you control. Google matches it against the searcher's query, so a dental practice listed primarily as “Medical clinic” competes for the wrong searches.",
          "Pick the primary category that matches the exact phrase customers search, then add secondary categories for the rest of what you do.",
        ],
      },
      {
        heading: "3. You are further away than you think",
        paragraphs: [
          "Local results are proximity-weighted. Searching from your own premises flatters you; searching from the other side of town is the honest test. If you rank inside a one-mile radius and vanish at three, that is proximity, not a penalty.",
          "Proximity is not fixable through the profile. It is fixable through relevance and prominence: better categories, more reviews, real service pages.",
        ],
      },
      {
        heading: "4. There is a duplicate or suspended listing",
        paragraphs: [
          "Duplicates split your signals and confuse Google. Search your business name plus the street, then your old address if you moved. Report duplicates through the profile so they are merged rather than deleted.",
        ],
      },
      {
        heading: "5. The profile is thin",
        paragraphs: [
          "Missing hours, no description, no services, five photos from 2019 and no posts all reduce the reasons Google has to show you and the reasons customers have to pick you.",
        ],
        bullets: [
          "Complete hours, including holiday hours",
          "A 500+ character description that reads like a person wrote it",
          "Every service or product listed with a short description",
          "Photos added this month, not this decade",
        ],
      },
      {
        heading: "6. Reviews have stalled",
        paragraphs: [
          "A profile with 12 reviews and nothing new for a year looks dormant next to a competitor gaining two a week. Volume matters, but recency and owner responses matter too.",
        ],
      },
      {
        heading: "Turn this into a scored checklist",
        paragraphs: [
          "Running these checks by hand takes about an hour per profile and the result depends on who looked. A LocalRankLens audit applies the same 26 weighted checks every time and ranks the fixes by impact, so you start with the ones that actually move the needle.",
        ],
      },
    ],
    related: ["google-business-profile-categories", "google-business-profile-audit-checklist"],
  },
  {
    slug: "google-business-profile-audit-checklist",
    title: "The Google Business Profile audit checklist",
    metaTitle: "Google Business Profile audit checklist: 26 checks that matter",
    description:
      "A complete, weighted audit checklist for a Google Business Profile, grouped into profile completeness, categories, reviews, photos, activity and citations.",
    updated: "2026-01-01",
    readingMinutes: 9,
    intro:
      "This is the checklist the LocalRankLens engine encodes. Work top to bottom; each group is ordered roughly by how much it is worth.",
    sections: [
      {
        heading: "Profile completeness",
        paragraphs: ["The basics, and the most common source of easy points."],
        bullets: [
          "Claimed and verified",
          "Business name matches real-world signage, with no keyword stuffing",
          "Description of 500+ characters",
          "Regular hours set, and holiday hours maintained",
          "A local phone number, not only a national one",
          "Website linked",
        ],
      },
      {
        heading: "Categories and services",
        paragraphs: [
          "Relevance lives here. Most underperforming profiles fail at least one of these.",
        ],
        bullets: [
          "Primary category matches the phrase customers search",
          "At least three relevant secondary categories",
          "Services or products listed individually",
          "Attributes completed (accessibility, payment, amenities)",
        ],
      },
      {
        heading: "Reviews and reputation",
        paragraphs: [
          "Judge four things, not one: how many, how good, how recent, and how you respond.",
        ],
        bullets: [
          "Review count in line with local competitors",
          "Average rating of 4.3 or better",
          "New reviews in the last 30 days",
          "Owner responses to most reviews, including the negative ones",
          "Reviews that mention services by name",
        ],
      },
      {
        heading: "Photos and media",
        paragraphs: ["Photos drive clicks and calls, and freshness is part of the signal."],
        bullets: [
          "20+ photos on the profile",
          "New photos added in the last 30 days",
          "Logo and cover image set deliberately",
          "At least one short video",
        ],
      },
      {
        heading: "Activity and engagement",
        paragraphs: ["The part almost everyone skips, which is why it differentiates."],
        bullets: [
          "Posts published in the last 30 days",
          "Questions in the Q&A section answered",
          "Messaging enabled and actually monitored",
        ],
      },
      {
        heading: "Website and citations",
        paragraphs: ["Off-profile consistency confirms you exist where you say you do."],
        bullets: [
          "Name, address and phone consistent across directories",
          "A website location page with an embedded map",
          "Claimed listings in the main directories for your country and industry",
        ],
      },
      {
        heading: "Scoring it",
        paragraphs: [
          "A checklist tells you what is missing; a weighted score tells you what to do first. Assign each item a weight, give partial credit for “nearly”, and sort the failures by weight — or run the audit and let the engine do it.",
        ],
      },
    ],
    related: [
      "why-my-business-isnt-showing-up-on-google-maps",
      "how-to-ask-for-google-reviews",
    ],
  },
  {
    slug: "google-business-profile-categories",
    title: "How to choose Google Business Profile categories",
    metaTitle: "How to choose the right Google Business Profile categories",
    description:
      "How to pick a primary category that matches search demand, how many secondary categories to add, and the category mistakes that quietly cost visibility.",
    updated: "2026-01-01",
    readingMinutes: 6,
    intro:
      "Categories are the closest thing to a ranking dial on a Google Business Profile. Getting them right is a fifteen-minute job with a long payoff.",
    sections: [
      {
        heading: "Your primary category is a positioning decision",
        paragraphs: [
          "Google treats the primary category as the main statement of what you are. One primary category is used for the searches you most want to win, so it should mirror the exact phrase your best customers type — “Emergency plumber”, not “Plumbing service”, if emergencies are the work you want.",
        ],
      },
      {
        heading: "Find the phrase before you pick the category",
        paragraphs: [
          "Look at what the top three competitors in the map pack use. Their primary category is visible on their profile, and it usually reflects what already works locally. Then check the phrase in Google's autocomplete to confirm real people search it.",
        ],
      },
      {
        heading: "Add secondary categories, but stay honest",
        paragraphs: [
          "Three to five relevant secondary categories cover the rest of what you do. Irrelevant ones dilute relevance and can trigger suspensions — add only categories you would happily be judged on.",
        ],
      },
      {
        heading: "Common mistakes",
        paragraphs: [],
        bullets: [
          "Leaving the category the setup wizard guessed years ago",
          "Choosing a broad umbrella category because it feels bigger",
          "Stuffing keywords into the business name instead of fixing categories",
          "Never revisiting categories after the business changed focus",
        ],
      },
      {
        heading: "Check the effect",
        paragraphs: [
          "Category changes can move results within days. Re-audit a fortnight after the change so you can tell what the category did versus everything else you altered.",
        ],
      },
    ],
    related: [
      "google-business-profile-audit-checklist",
      "why-my-business-isnt-showing-up-on-google-maps",
    ],
  },
  {
    slug: "how-to-ask-for-google-reviews",
    title: "How to ask for Google reviews without being annoying",
    metaTitle: "How to ask for Google reviews (that customers actually leave)",
    description:
      "A simple, repeatable way to ask for Google reviews: when to ask, what to say, how to make it one tap, and how to respond once they arrive.",
    updated: "2026-01-01",
    readingMinutes: 6,
    intro:
      "Review volume, recency and owner responses all feed local visibility — and all three come from one habit, asked at the right moment.",
    sections: [
      {
        heading: "Ask at the moment of relief",
        paragraphs: [
          "The best time is immediately after the problem is solved: the leak stops, the treatment finishes, the car is handed back. A day later the feeling has faded; a week later you are a marketing email.",
        ],
      },
      {
        heading: "Make it one tap",
        paragraphs: [
          "Use the short review link from your profile, put it in a saved text message template, and send it while you are still with the customer. Every extra step halves completion.",
        ],
      },
      {
        heading: "Say less than you think",
        paragraphs: [
          "“Glad that's sorted. If you have thirty seconds, a quick Google review really helps us — here's the link.” No incentive, no script for what they should write, no pressure. Incentives breach Google's policies and read as fake anyway.",
        ],
      },
      {
        heading: "Respond to everything, briefly",
        paragraphs: [
          "Owner responses are visible to future customers and are part of a healthy profile. Thank the positive ones in one line. For a negative review, acknowledge the specific issue, say what you're doing, and move the detail offline.",
        ],
      },
      {
        heading: "Aim for steady, not spiky",
        paragraphs: [
          "Two reviews a week for a year beats forty in one month and silence afterwards. Steady flow keeps recency healthy and looks exactly like what it is: a business people keep using.",
        ],
      },
    ],
    related: ["google-business-profile-audit-checklist", "local-seo-for-dentists"],
  },
  {
    slug: "local-seo-for-dentists",
    title: "Local SEO for dental practices",
    metaTitle: "Local SEO for dentists: a practical profile checklist",
    description:
      "How dental practices should set up categories, services, reviews and photos on Google, and which profile gaps cost the most new-patient enquiries.",
    updated: "2026-01-01",
    readingMinutes: 6,
    intro:
      "Dentistry is one of the most competitive local categories, and most practices lose ground on the same handful of profile details.",
    sections: [
      {
        heading: "Category: dentist, then the specialisms",
        paragraphs: [
          "“Dentist” is almost always the right primary category. Add the specialisms you genuinely offer — cosmetic dentist, dental implants periodontist, emergency dental service — as secondaries, because those are separate searches with separate intent.",
        ],
      },
      {
        heading: "List treatments as services",
        paragraphs: [
          "Patients search treatments, not practices. List each treatment as its own service with a one-line description: check-up, hygienist, whitening, implants, Invisalign, emergency appointment.",
        ],
      },
      {
        heading: "Reviews carry more weight here",
        paragraphs: [
          "Choosing a dentist is high-anxiety, so recency and owner responses matter as much as the average. Ask at the end of the appointment, at reception, with a QR code and a short link.",
        ],
      },
      {
        heading: "Photos that reduce anxiety",
        paragraphs: [
          "Show the waiting room, the surgery, the parking and the team — the things a nervous patient wants to preview. Stock imagery does the opposite.",
        ],
      },
      {
        heading: "Emergency and out-of-hours",
        paragraphs: [
          "If you take emergencies, say so in the description, add the relevant category, and keep hours accurate including holidays. Emergency searches convert immediately and punish wrong opening times hard.",
        ],
      },
    ],
    related: ["how-to-ask-for-google-reviews", "google-business-profile-categories"],
  },
  {
    slug: "google-business-profile-posts",
    title: "Are Google Business Profile posts worth the effort?",
    metaTitle: "Google Business Profile posts: what to publish and how often",
    description:
      "What Google Business Profile posts do, a realistic cadence for a small business, and five post ideas that take ten minutes each.",
    updated: "2026-01-01",
    readingMinutes: 5,
    intro:
      "Posts are the most skipped part of a profile, which is exactly why they are worth a small, consistent effort.",
    sections: [
      {
        heading: "What posts actually do",
        paragraphs: [
          "Posts appear on your profile and give an active signal that the business is trading and maintained. They are not a magic ranking lever, but an active profile beats a dormant one on the metrics that do count: clicks, calls and direction requests.",
        ],
      },
      {
        heading: "A realistic cadence",
        paragraphs: [
          "One post a week is plenty and sustainable. Two a month is fine. Nothing for six months is a gap an audit will flag, because it usually correlates with a profile nobody is maintaining.",
        ],
      },
      {
        heading: "Five posts that take ten minutes",
        paragraphs: [],
        bullets: [
          "A job you finished this week, with one photo",
          "A seasonal reminder relevant to your trade",
          "A frequently asked question and its answer",
          "An opening-hours change, well in advance",
          "A new service, product or team member",
        ],
      },
      {
        heading: "Don't write posts like adverts",
        paragraphs: [
          "Short, specific and human works. Discount-heavy copy gets ignored and makes the profile look like a promotional feed rather than a business.",
        ],
      },
    ],
    related: ["google-business-profile-audit-checklist", "why-my-business-isnt-showing-up-on-google-maps"],
  },
];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

/**
 * Content roadmap: topics with genuine search intent that a future owner can
 * write next. Listed publicly as a plan, never as published links.
 */
export const PLANNED_TOPICS = [
  "Local SEO for plumbers: the profile checks that win emergency work",
  "Local SEO for restaurants: menus, photos and reservation links",
  "Local SEO for law firms: practice-area services and review handling",
  "How to fix name, address and phone inconsistencies across directories",
  "What to do when your Google Business Profile is suspended",
  "How to handle a fake or unfair Google review",
  "Service areas vs a physical address: which to use",
  "How many photos does a Google Business Profile need?",
  "Google Business Profile attributes: the ones customers filter by",
  "Multi-location businesses: keeping twenty profiles consistent",
  "Google Q&A: seeding and answering questions properly",
  "Booking links and messaging: turning profile views into appointments",
  "How to audit a competitor's Google Business Profile",
  "Monthly local SEO routine for a one-person business",
];
