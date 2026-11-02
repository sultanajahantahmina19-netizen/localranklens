# Roadmap — Website SEO audit engine (extends LocalRankLens)

1. [x] Inspect codebase, schema, auth, engine, plans
2. [ ] Migration: website_audits, website_audit_findings, psi_cache (+RLS, grants, usage function)
3. [ ] Core engine: URL guard (SSRF), fetcher, HTML parser, checks, weighted scoring, recommendations
4. [ ] PageSpeed Insights integration (server-side, cached, optional API key)
5. [ ] Local Visibility Readiness section (separate score + disclaimers)
6. [ ] API server functions + plan quota (shared with GBP audit limit)
7. [ ] UI: website audit form, report view, list, routes, nav, dashboard
8. [ ] robots.txt / README / env example updates
9. [ ] Tests for scoring rules + E2E QA (valid site, nonexistent domain, 404, blocked, slow, bad/good metadata)
