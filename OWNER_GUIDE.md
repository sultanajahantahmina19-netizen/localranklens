# Owner guide

## Daily operation
- **Messages:** Admin → Messages. Reply by email, then mark read or archive.
- **Users:** Admin → Users. Search, change plan, grant/remove admin (confirmation required; you can't remove your own admin).
- **Numbers:** Admin → Overview and Analytics show live database counts. There is no revenue figure until billing is connected — use your payment provider's dashboard for revenue.

## Content
Guides live in `src/content/guides.ts`. Add an article by appending an object (slug, title, metaTitle, description, sections). It appears on /guides, gets its own page, metadata and a sitemap entry automatically. `PLANNED_TOPICS` lists the next 14 articles worth writing.

## Plans and limits
Plan rows are in the `plans` table (prices, audits/month, location limit, features). Enforced limits are also in `PLAN_AUDIT_LIMITS` (`src/lib/api/audits.functions.ts`) and `PLAN_LOCATION_LIMITS` (`src/lib/api/locations.functions.ts`) — keep them in sync when you change a plan.

## Connecting payments
1. Create products/prices in your payment provider (Stripe, Paddle, etc.) matching `pro` and `agency`.
2. Add a checkout button on /billing that opens the provider's hosted checkout with the user's id as metadata.
3. Add a webhook route under `src/routes/api/public/` that verifies the provider signature and updates `profiles.plan` using the server admin client.
4. Set `BILLING_MODE=live` so users can no longer change plans themselves.
5. Test in the provider's sandbox before switching keys to live.

## Database
Schema: `drizzle/migrations`. Back up through your database host. Demo rows have `is_demo = true`; remove them before measuring metrics.

## Updates
`bun update` occasionally, run `bun run build`, test sign-in, an audit and the admin area, then deploy.

## Deployment
**Option A — Lovable:** click Publish. Database and auth are already hosted. Add a custom domain in Project Settings → Domains.

**Option B — self-host (Vercel/Cloudflare + Supabase):**
1. Create a Supabase project. Run every file in `drizzle/migrations` in its SQL editor.
2. Auth → enable Email provider; set Site URL to your domain; add `https://YOUR-DOMAIN/reset-password` to redirect URLs. Enable Google if wanted (needs your own Google OAuth client).
3. Create a hosting project from the GitHub repo. Build command `bun run build`.
4. Set all variables from `.env.example` in the host dashboard. Set `PUBLIC_SITE_URL`.
5. Deploy, then point your domain's DNS at the host.
6. Uncomment the Sitemap line in `public/robots.txt` with your domain; submit the sitemap in Google Search Console.
7. Test in production: sign up (confirm email), sign in, run an audit, open report, reset password, claim admin, send a contact message and read it in Admin.
