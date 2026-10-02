# Transfer guide

A checklist for handing LocalRankLens to a new owner. Do steps in order; tick each one with the buyer.

1. **Domain** — unlock at the registrar, send the auth code (or push to the buyer's registrar account). Update DNS once the buyer's hosting is ready.
2. **Code (GitHub)** — Settings → Transfer ownership to the buyer's account, or add them as owner then leave. Confirm no secrets in history (`.env` is not committed).
3. **Hosting** — on Lovable: transfer the project to the buyer's workspace. Self-hosted: transfer the Vercel/Cloudflare project or have the buyer import the repo.
4. **Database** — on Lovable Cloud it moves with the project. Self-hosted Supabase: transfer the organisation, or `pg_dump` and restore into the buyer's project, then rerun migrations check.
5. **Auth** — update Site URL and redirect URLs to the buyer's domain. If Google sign-in uses your own OAuth client, the buyer creates theirs and replaces the credentials.
6. **Analytics** — transfer Google Search Console and any hosting analytics property; add buyer as owner, then remove yourself.
7. **Payments** — none connected at sale. The buyer connects their own account (see OWNER_GUIDE.md → Connecting payments).
8. **Email** — auth emails use the platform default sender. If a custom sending domain was set up, transfer the domain's DNS records with it.
9. **Third-party APIs** — none. The scoring engine has no external dependencies.
10. **Environment variables** — buyer generates fresh keys in their own database project and sets every value listed in `.env.example`. Rotate anything you ever shared.
11. **Admin access** — buyer signs up, you grant them admin in Admin → Users, they remove your account.
12. **Clean up** — delete demo rows (`is_demo = true`), delete your test accounts, confirm metrics shown to the buyer are from real usage only.
