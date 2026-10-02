# LocalRankLens

Google Business Profile audit software. A user records what is visible on a profile; a deterministic engine scores it against 24 weighted checks across 6 categories and returns a 0–100 score, a grade and a fix list ranked by impact.

## Stack
- React 19 + TanStack Start (SSR, file routes, typed server functions), TypeScript, Vite
- Tailwind CSS 4 (tokens in `src/styles.css`), shadcn/ui
- PostgreSQL + Auth (email/password, Google) via Lovable Cloud / Supabase, row-level security on every table

## Structure
```
src/
  routes/            pages (public at top level, signed-in under _authenticated/, admin under _authenticated/admin*)
  components/site    marketing header/footer/layout
  components/app     signed-in layout, stat cards, empty states
  components/audit   audit form and report view
  lib/audit          scoring engine, schema, demo samples (pure TypeScript)
  lib/api            server functions (audits, locations, profile, plans, contact, admin)
  content/guides.ts  guide articles + content roadmap
drizzle/migrations   database schema
supabase/seed-demo.sql  optional demo rows (flagged is_demo)
```

## Local setup
1. `bun install`
2. `cp .env.example .env` and fill in values (see below)
3. Apply `drizzle/migrations/*.sql` to your database (SQL editor or `psql`)
4. `bun run dev` → http://localhost:8080
5. Sign up, open Settings → "Claim admin access" (works once, for the first admin only)

## Environment variables
See `.env.example`. `VITE_*` values are public. `SUPABASE_SERVICE_ROLE_KEY` is server-only. `BILLING_MODE=live` disables self-serve plan switching once a payment provider is connected.

## Deploy
Covered in OWNER_GUIDE.md ("Deployment"). Production build: `bun run build`.

## Security notes
Passwords hashed by the auth provider; sessions are signed tokens; RLS on all tables; admin actions re-check the role on the server; all input validated with zod on client and server; contact form is rate limited; CSRF middleware in `src/start.ts`; no secrets in the repo.
