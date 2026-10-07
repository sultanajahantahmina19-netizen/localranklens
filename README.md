# LocalRankLens

**Find out why a local business isn't showing up on Google Maps — and exactly what to fix first.**

> Status: newly built product with no trading history. No revenue, traffic or customer figures exist yet. Nothing in this document claims otherwise.

---

## Table of contents
1. [Project overview](#2-project-overview) · 2. [Problem](#3-problem-it-solves) · 3. [Features](#4-key-features) · 4. [Target users](#5-target-users) · 5. [How it works](#6-how-it-works) · 6. [Tech stack](#7-tech-stack) · 7. [Architecture](#8-architecture-overview) · 8. [Structure](#9-project-structure) · 9. [Prerequisites](#10-prerequisites) · 10. [Installation](#11-installation--setup) · 11. [Env vars](#12-environment-variables) · 12. [Database](#13-database-setup) · 13. [Auth](#14-authentication-setup) · 14. [Third-party services & costs](#15-third-party-apiservice-setup) · 15. [Running locally](#16-running-locally) · 16. [Scripts](#17-available-scripts) · 17. [Deployment](#18-deployment) · 18. [Production config](#19-production-configuration) · 19. [Usage](#20-usage-guide) · 20. [Roles](#21-user-roles--permissions) · 21. [Monetization](#22-subscriptionmonetization-model) · 22. [API](#23-api-documentation) · 23. [Security](#24-security-considerations) · 24. [SEO](#25-seo-setup) · 25. [Analytics](#26-analytics-setup) · 26. [Testing](#27-testing) · 27. [Limitations](#28-known-limitations) · 28. [Roadmap](#29-future-improvements--roadmap) · 29. [Growth](#30-business--growth-opportunities) · 30. [Transfer](#31-ownership--transfer-information) · 31. [Flippa](#32-flippa-sale-information) · 32. [License](#33-license) · 33. [Support](#34-contact--support) · 34. [Credits](#35-credits--third-party-dependencies) · [Troubleshooting](#troubleshooting) · [Updating](#updating-the-production-app) · [Backup](#backup--recovery)

---

## 2. Project overview
LocalRankLens is a SaaS web app that audits a Google Business Profile (GBP). The user records what is visible on a profile (categories, photos, reviews, hours, posts, website, etc.). A deterministic scoring engine checks it against **26 weighted checks in 6 categories** and returns a 0–100 score, an A–F grade and a fix list ranked by impact. Reports are saved, tracked per location over time and printable/exportable to PDF.

## 3. Problem it solves
Local businesses lose calls and visits when their Google Maps listing is incomplete or weak, but most owners don't know what Google weighs. Freelancers and agencies do these audits manually in spreadsheets. LocalRankLens turns that into a repeatable, explainable checklist with prioritised actions.

## 4. Key features
- 26-check audit engine (pure TypeScript, no external API, versioned `engine_version`)
- Score dial, grade, pass/warn/fail breakdown, category scores, prioritised fix list
- Audit history with search, pagination, delete (with confirmation)
- Saved locations with per-location score history
- Printable report / Save as PDF
- Plans with enforced limits (audits per month, number of locations)
- Email/password sign-up with email confirmation, password reset, optional Google sign-in
- Admin area: overview, users (plan + admin role), contact inbox, 30-day charts
- Public marketing site, live sample report, 6 guides + content roadmap, FAQ, buyer page (`/business`)
- SEO: per-page metadata, Open Graph/Twitter, structured data, sitemap, robots.txt
- Light and dark design tokens, responsive/mobile-first layouts, loading/empty/error states, toasts

## 5. Target users
- Local SEO freelancers and small agencies auditing client profiles
- Owners/managers of local businesses (dentists, clinics, trades, salons, restaurants)
- Marketing consultants who need a quick, explainable audit to start a client conversation

## 6. How it works
1. User signs up and confirms their email.
2. Optionally saves a location (business).
3. Fills the audit form with what is visible on the Google profile.
4. Server validates input (zod), checks plan quota, runs the engine, stores the audit and its findings.
5. User sees the report, fixes issues, re-audits later and compares history.

## 7. Tech stack
| Layer | Technology |
|---|---|
| Framework | React 19 + TanStack Start v1 (SSR, file-based routing, typed server functions) |
| Language | TypeScript (strict, `exactOptionalPropertyTypes`) |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 (tokens in `src/styles.css`), shadcn/ui (Radix) |
| Forms / validation | react-hook-form + zod (shared client/server schemas) |
| Data fetching | TanStack Query |
| Charts | recharts |
| Database | PostgreSQL (Supabase / Lovable Cloud) with row-level security |
| Auth | Supabase Auth (email/password, Google OAuth) |
| Runtime | Edge/serverless worker (Cloudflare Workers by default via Nitro) |
| Package manager | Bun (npm also works) |

> Note: the original brief mentioned Next.js. This project uses TanStack Start, which gives the same capabilities (SSR, server functions, file routes) and deploys as a single worker.

## 8. Architecture overview
```text
Browser (React, TanStack Router/Query)
   │  typed RPC (createServerFn) + bearer token + CSRF check
   ▼
Server functions (src/lib/api/*.functions.ts)  ── runs audit engine (src/lib/audit)
   │  Supabase client acting AS the user (RLS enforced)
   │  Service-role client only for admin writes / contact form / first-admin bootstrap
   ▼
PostgreSQL (RLS on every table) + Supabase Auth
```
- Authorization is enforced twice: RLS in the database and role checks (`has_role()`) inside every admin server function.
- `src/routes/sitemap[.]xml.ts` is a server route that returns XML.

## 9. Project structure
```text
src/
  routes/                 pages: public at top level, signed-in under _authenticated/, admin under _authenticated/admin*
  components/site/        marketing header, footer, layout
  components/app/         signed-in shell, stat cards, empty states
  components/audit/       audit form, report view, score dial
  components/ui/          shadcn/ui primitives
  lib/audit/              scoring engine, types, zod schema, demo samples
  lib/api/                server functions: audits, locations, profile, plans, contact, admin
  content/guides.ts       guide articles + planned topics
  integrations/supabase/  generated clients, auth middleware (do not edit by hand)
  hooks/                  use-auth, use-mobile
  start.ts                CSRF + error + auth middleware
  styles.css              design tokens (rebrand here)
drizzle/migrations/       SQL schema (source of truth)
supabase/seed-demo.sql    optional demo rows (is_demo = true)
public/robots.txt
.env.example
OWNER_GUIDE.md  TRANSFER_GUIDE.md
```

## 10. Prerequisites
| Requirement | Version / note |
|---|---|
| Node.js | 20 LTS or newer (developed on 22) |
| Bun | 1.1+ recommended (developed on 1.3). npm 10+ works too |
| Git | any recent version |
| Database | PostgreSQL 15+ via a Supabase project (auth + RLS rely on Supabase) |
| Accounts | GitHub; Supabase (or keep Lovable Cloud); a host (Cloudflare recommended, or Lovable publish); domain registrar; optional Google Cloud (OAuth); optional payment provider |

## 11. Installation & setup
### Getting the source code
```bash
git clone https://github.com/YOUR-ACCOUNT/localranklens.git
cd localranklens
```
(Or download the ZIP from GitHub and unzip it.)

### Install dependencies
```bash
bun install        # or: npm install
```

### Configure
```bash
cp .env.example .env
```
Fill in values (next section), apply the database migration, then run `bun run dev`.

## 12. Environment variables
| Variable | Scope | Required | Where to get it |
|---|---|---|---|
| `VITE_SUPABASE_URL` | public (browser) | yes | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | public | yes | Supabase → API keys → publishable (anon) key |
| `VITE_SUPABASE_PROJECT_ID` | public | yes | Project ref (the subdomain of the project URL) |
| `SUPABASE_URL` | server | yes | same as above |
| `SUPABASE_PUBLISHABLE_KEY` | server | yes | same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | **server secret** | yes | Supabase → API keys → secret/service_role. Never expose |
| `BILLING_MODE` | server | no | `sandbox` (default, users may switch plans) or `live` (self-serve switching disabled) |
| `PUBLIC_SITE_URL` | server | recommended in prod | Your canonical origin, e.g. `https://localranklens.com` |

**Development vs production:** use a separate Supabase project (or branch) for development. In production set `BILLING_MODE=live` once a payment provider is connected, and set `PUBLIC_SITE_URL`. `VITE_*` values are bundled into browser code and must never contain secrets. On Lovable Cloud these values are injected automatically.

## 13. Database setup
1. **Create** a Supabase project (choose a region near your users).
2. **Connection:** the app connects through the Supabase API using the env vars above — no direct connection string is needed at runtime.
3. **Migrations:** open Supabase → SQL Editor, paste and run every file in `drizzle/migrations/` in filename order (currently `0000_localranklens_core_schema.sql`). Or with psql:
   ```bash
   psql "$DATABASE_URL" -f drizzle/migrations/0000_localranklens_core_schema.sql
   ```
   This creates enums, tables (`profiles`, `user_roles`, `plans`, `locations`, `audits`, `audit_findings`, `contact_messages`, `activity_events`), indexes, RLS policies, triggers (new-user profile creation, `updated_at`) and seeds the three plans.
4. **Seed/demo data (optional):** edit the email in `supabase/seed-demo.sql` to an existing account, then run it. All rows are flagged `is_demo = true` and named "(demo)". Delete before listing: `DELETE FROM <table> WHERE is_demo;`

## 14. Authentication setup
- **Email/password:** Supabase → Authentication → Providers → Email: enabled, "Confirm email" on.
- **URLs:** Authentication → URL Configuration: Site URL = your domain; add `https://YOUR-DOMAIN/reset-password` and `https://YOUR-DOMAIN` to Redirect URLs (plus `http://localhost:8080` for dev).
- **Google (optional):** create an OAuth client in Google Cloud Console (authorised redirect URI = `https://<project-ref>.supabase.co/auth/v1/callback`), paste client ID/secret into Supabase → Providers → Google.
  - On Lovable Cloud, Google sign-in uses Lovable's managed OAuth (`@lovable.dev/cloud-auth-js`, `src/integrations/lovable`). When self-hosting on plain Supabase, replace that call in `src/routes/auth.tsx` with `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })`.
- **First admin:** sign up, confirm, open Settings → "Claim admin access". Works only while no admin exists.

## 15. Third-party API/service setup
### Service inventory, keys and recurring costs
| Service | Purpose | Keys/credentials | Required? | Recurring cost |
|---|---|---|---|---|
| Lovable Cloud **or** Supabase | Database, auth, auth emails | publishable key, service-role key | Yes | Free tier available; paid plans billed monthly by usage. Check current pricing |
| Hosting (Lovable publish, Cloudflare Workers, or similar) | Serves the app | host account | Yes | Free tiers exist; paid tiers usage-based |
| Domain registrar | Custom domain | registrar login | Recommended | Annual renewal (typically $10–20/yr for .com) |
| Google Cloud OAuth | Google sign-in | client ID + secret | Optional | Free |
| Google Search Console | Search performance | Google account | Recommended | Free |
| Payment provider (Stripe/Paddle) | Subscriptions | API keys + webhook secret | Not connected | Per-transaction fees only |
| Transactional email (custom domain) | Branded auth emails | provider API key | Optional | Free tiers exist |
| Analytics | Traffic | — | Built-in admin analytics only | None |

- **APIs:** none. The audit engine has no external dependencies or API keys.
- **Email:** auth emails (confirm, reset) are sent by the auth provider's default sender. For production volume/branding, configure custom SMTP in Supabase → Authentication → SMTP.
- **Storage:** not used (no file uploads). Reports are rendered in the browser and printed to PDF.
- **Analytics:** see section 26.
- **Payments:** not connected — see section 22 and OWNER_GUIDE.md.

Costs listed are categories, not quotes. Verify on each provider's pricing page; at low traffic the app can run on free tiers.

## 16. Running locally
```bash
bun run dev
```
Open **http://localhost:8080**.

**Test the main workflow:**
1. `/auth?mode=signup` → register with a real email, confirm it.
2. Settings → Claim admin access.
3. Locations → add a business.
4. New audit → fill the form → Run audit → report opens.
5. Audits → search, open, delete (confirm dialog).
6. Billing → switch plan (sandbox) and check limits.
7. `/contact` → send a message → Admin → Messages.
8. Admin → Users / Analytics.

## 17. Available scripts
| Command | What it does |
|---|---|
| `bun run dev` | Dev server with hot reload (port 8080) |
| `bun run build` | Production build |
| `bun run build:dev` | Development-mode build |
| `bun run preview` | Serve the built output locally |
| `bun run lint` | ESLint |
| `bun run format` | Prettier |
| `bunx tsgo --noEmit` (or `npx tsc --noEmit`) | Type check |

## 18. Deployment
### Production build
```bash
bun install
bunx tsgo --noEmit   # type check
bun run lint
bun run build
bun run preview      # local production check
```
The build outputs a server worker plus static assets (Nitro, Cloudflare preset by default). There is no long-running `start` process — the host runs the worker.

### Option A — Lovable (simplest)
Click **Publish**. Database, auth and env vars are already configured. Add a custom domain in Project Settings → Domains (DNS + SSL handled automatically).

### Option B — Cloudflare Workers + Supabase (self-host)
1. Create the Supabase project, run migrations, configure auth (sections 13–14).
2. Cloudflare dashboard → Workers & Pages → Create → connect the GitHub repo.
3. Build command `bun run build`; deploy the generated output (or run `npx wrangler deploy` from the build output directory).
4. Add all env vars from section 12 (mark `SUPABASE_SERVICE_ROLE_KEY` as a secret).
5. Add your custom domain to the worker; Cloudflare issues SSL.

### Other hosts (e.g. Vercel, Netlify)
Possible by switching Nitro's deployment preset in `vite.config.ts`. Test the build on that host before going live; the default and tested target is a Cloudflare-style worker.

## 19. Production configuration
### Post-deployment checklist
- **Auth URLs:** Site URL and redirect URLs set to the production domain.
- **API configuration:** `PUBLIC_SITE_URL` set; `BILLING_MODE=live` once payments are connected.
- **Database migration:** all files in `drizzle/migrations/` applied to the production database.
- **Webhooks:** none today. When payments are added, register `https://YOUR-DOMAIN/api/public/<provider>-webhook` and verify signatures.
- **DNS/SSL:** domain points at the host; HTTPS enforced.
- **Analytics:** verify domain in Google Search Console; uncomment the `Sitemap:` line in `public/robots.txt` and submit `/sitemap.xml`.
- **Clean up:** remove demo rows and test accounts.

## 20. Usage guide
- **Users:** run audits, read the prioritised fix list, save locations, re-audit to track progress, print reports.
- **Owner/admin:** answer messages (Admin → Messages, reply by email), manage users and plans, watch growth in Analytics, add guides in `src/content/guides.ts`. Day-to-day details in OWNER_GUIDE.md.

## 21. User roles & permissions
| Role | Can |
|---|---|
| Visitor | Public pages, sample report, guides, contact form |
| User | Own audits, locations, profile, plan (sandbox only) |
| Admin | Everything above + all users, plans, roles, messages, analytics |

Roles live in the separate `user_roles` table (never on the profile), checked by the `has_role()` security-definer function in RLS and on every admin server function. Admins cannot remove their own admin role.

## 22. Subscription/monetization model
| Plan | Price | Audits/month | Locations | Extras |
|---|---|---|---|---|
| Free | $0 | 3 | 1 | — |
| Pro | $19/mo | 50 | 10 | — |
| Agency | $49/mo | Unlimited | Unlimited | White-label reports |

Limits are enforced server-side. **No payment provider is connected and no revenue exists.** Plan definitions are in the `plans` table; enforced limits also in `PLAN_AUDIT_LIMITS` (`src/lib/api/audits.functions.ts`) and `PLAN_LOCATION_LIMITS` (`src/lib/api/locations.functions.ts`) — keep them in sync. To connect Stripe/Paddle: hosted checkout on `/billing` with the user id as metadata → signed webhook under `src/routes/api/public/` updating `profiles.plan` → set `BILLING_MODE=live`.

## 23. API documentation
There is no public REST API. The app uses typed server functions (internal RPC, CSRF-protected, bearer-authenticated):

| Module | Functions | Auth |
|---|---|---|
| `plans.functions.ts` | `listPlans` | public |
| `contact.functions.ts` | `sendContactMessage` | public, rate limited |
| `audits.functions.ts` | `getUsage`, `createAudit`, `listAudits`, `getAudit`, `deleteAudit` | user |
| `locations.functions.ts` | list/create/update/delete location, `getLocationHistory` | user |
| `profile.functions.ts` | `getMyProfile`, `updateMyProfile`, `changeMyPlan`, `claimFirstAdmin` | user |
| `admin.functions.ts` | overview, users, plan/role changes, messages, trends | admin |

Public HTTP route: `GET /sitemap.xml`.

## 24. Security considerations
- Passwords hashed by Supabase Auth (bcrypt); sessions are signed JWTs with refresh tokens.
- RLS on every table; admin actions re-check the role server-side.
- zod validation on client and server; parameterised queries via the Supabase client (no raw SQL from user input).
- React escapes output (XSS); no `dangerouslySetInnerHTML` with user content.
- CSRF middleware on server functions (`src/start.ts`).
- Contact form rate limited per email.
- Service-role key used only inside server handlers, never sent to the browser.

**Security notes for owners**
- Never commit `.env` (it is git-ignored); only `.env.example` belongs in the repo.
- Store secrets in the host's secret manager, not in code.
- No admin credentials exist in the code; admin is granted per account.
- Rotate the service-role key, OAuth secret and any payment keys at transfer or if exposed (Supabase → API keys → rotate, then update the host env vars).

## 25. SEO setup
- Per-route `head()` with title, description, canonical, Open Graph and Twitter tags
- Structured data: SoftwareApplication (site), FAQPage, Article (guides)
- `/sitemap.xml` built from static routes + guide slugs; `public/robots.txt` blocks app/admin pages
- Semantic HTML, clean URLs (`/guides/google-business-profile-categories`), internal links between guides
- Content: 6 published guides; 14 planned topics in `PLANNED_TOPICS` (`src/content/guides.ts`)

## 26. Analytics setup
- **Built-in (privacy-conscious, no cookies/trackers):** Admin → Overview/Analytics read live counts from the database — users, new and active users, audits, locations, paid users, free→paid rate, daily signups/audits, feature use from `activity_events`.
- **Traffic:** not tracked in-app. Use Google Search Console, plus host analytics (Lovable / Cloudflare Web Analytics, both cookie-free). If you add a cookie-based tool, update the Cookie Policy and add consent.
- No metrics are fabricated; demo rows are flagged and excluded from claims.

## 27. Testing
No automated test suite is included yet. Manual QA covered: all public pages, contact form validation and submission, signup validation and confirmation step, protected-route redirects, type check and production build. Before listing, run the full workflow in section 16 on production. Recommended next step: add Vitest unit tests for `src/lib/audit/engine.ts` (pure functions) and Playwright for the signup → audit flow.

## 28. Known limitations
- Profile data is entered manually; there is no automatic Google data import (Google's Business Profile API requires owner OAuth and approval).
- No payment checkout connected.
- No automated tests.
- No in-app traffic analytics.
- PDF export uses the browser's print dialog.
- White-label branding is a plan flag; custom logo upload is not built yet.
- Legal pages are templates and must be reviewed by a lawyer for your jurisdiction.

## 29. Future improvements / roadmap
- Stripe/Paddle checkout and customer portal
- Google Business Profile API import for verified owners
- White-label logo upload and branded PDF generation
- Scheduled re-audit reminders by email
- Competitor comparison audits
- Team seats for agencies
- More guides from `PLANNED_TOPICS`
- Automated tests

## 30. Business & growth opportunities
- SEO: publish the planned guides; industry-specific landing pages (dentists, plumbers, salons)
- Agency partnerships and a referral/affiliate programme
- Paid acquisition on high-intent keywords once conversion is measured
- Localisation (UK, AU, CA first; then non-English markets)
- Upsell: done-for-you optimisation service, lead generation for agencies

These are opportunities, not forecasts.

## 31. Ownership & transfer information
**What the buyer needs to change**
- **GitHub:** transfer the repo (Settings → Transfer ownership) or push to the buyer's account.
- **Hosting:** transfer the Lovable project to the buyer's workspace, or the buyer imports the repo into their host.
- **Database:** on Lovable Cloud it moves with the project. Self-hosted: transfer the Supabase organisation, or `pg_dump` → restore into the buyer's project.
- **Domain:** unlock, send auth code / push to buyer's registrar, update DNS.
- **Third-party services:** buyer creates their own Google OAuth client, payment account, SMTP and Search Console property; rotates all keys; updates env vars.
- **Admin:** buyer signs up, seller grants admin, buyer removes seller's account.

Full step-by-step checklist: **TRANSFER_GUIDE.md**.

## 32. Flippa sale information
**Included:** full source code and Git history, database schema and migrations, brand name and assets in the repo, domain (if registered), guide content, documentation (README, OWNER_GUIDE, TRANSFER_GUIDE), Search Console property (if set up), 30 days of handover email support (adjust to your listing).

**Excluded:** seller's personal accounts and API keys, any payment provider account, revenue or customers (none exist), seller's Lovable/hosting billing, legal advice.

## 33. License
Proprietary — all rights reserved. Ownership transfers to the buyer on sale. Third-party packages keep their own licenses (mostly MIT; see section 35).

## 34. Contact / Support
Use the in-app contact form at `/contact`; messages appear in Admin → Messages. Replace with the owner's support email after transfer.

## 35. Credits & third-party dependencies
React, TanStack Start/Router/Query, Vite, Tailwind CSS, shadcn/ui, Radix UI, lucide-react, react-hook-form, zod, recharts, sonner, Supabase JS, date-fns-style utilities as listed in `package.json`. Fonts: Bricolage Grotesque and DM Sans (Google Fonts, OFL). Hero image generated for this project.

---

## Troubleshooting
| Problem | Fix |
|---|---|
| `bun install` / `npm install` fails | Use Node 20+; delete `node_modules` and the lockfile only if necessary, then reinstall |
| Port 8080 in use | Stop the other process or run `bun run dev -- --port 3000` |
| "Missing Supabase environment variable(s)" | `.env` missing or misnamed; check all `VITE_*` and server variables |
| `Expected 3 parts in JWT` | You used a new `sb_publishable_`/`sb_secret_` key in a hand-written client; use the generated clients |
| `permission denied for table …` | Migration not fully applied (GRANTs/RLS); rerun the migration file |
| Sign-up email never arrives | Check spam; default sender is rate limited — configure custom SMTP |
| Password reset link goes to localhost | Fix Site URL / redirect URLs in auth settings |
| Google sign-in "Unsupported provider" | Enable Google provider and add credentials |
| 401 on dashboard data | Session expired; sign out and in again |
| Deployment build fails | Run `bun run build` locally and fix the first error; make sure env vars are set on the host |
| Works locally, fails in production | Usually a missing server env var or a Node-only package not supported on the worker runtime |

## Updating the production app
```bash
git pull
bun install
# apply any new files in drizzle/migrations/ to production (SQL editor or psql)
bunx tsgo --noEmit && bun run lint && bun run build
# deploy: Lovable → Publish → Update; Cloudflare → push to the main branch or `wrangler deploy`
```
Then test sign-in, one audit and the admin area.

## Backup & recovery
- **Database backup:** Supabase paid plans take daily backups; also keep your own: `pg_dump "$DATABASE_URL" -Fc -f backup.dump` (weekly, stored off-site).
- **Restore:** `pg_restore -d "$NEW_DATABASE_URL" --clean backup.dump`, then confirm auth users and RLS policies are present.
- **Important files/data:** the Git repo, `drizzle/migrations/`, `src/content/guides.ts`, env var values (in a password manager), domain registrar access.
