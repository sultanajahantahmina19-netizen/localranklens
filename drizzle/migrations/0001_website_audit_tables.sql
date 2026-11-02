-- ============ website audit status ============
CREATE TYPE public.website_audit_status AS ENUM ('complete', 'failed');

-- ============ website_audits (one per analyzed URL) ============
CREATE TABLE public.website_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  final_url text,
  domain text NOT NULL,
  status public.website_audit_status NOT NULL DEFAULT 'complete',
  overall_score integer CHECK (overall_score BETWEEN 0 AND 100),
  grade text,
  category_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  local_readiness jsonb NOT NULL DEFAULT '{}'::jsonb,
  pagespeed jsonb NOT NULL DEFAULT '{}'::jsonb,
  audit_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  engine_version text NOT NULL DEFAULT 'w1',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX website_audits_user_created_idx ON public.website_audits (user_id, created_at DESC);
CREATE INDEX website_audits_domain_idx ON public.website_audits (domain);
GRANT SELECT, INSERT, DELETE ON public.website_audits TO authenticated;
GRANT ALL ON public.website_audits TO service_role;
ALTER TABLE public.website_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own website audits" ON public.website_audits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own website audits" ON public.website_audits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own website audits" ON public.website_audits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ website_audit_findings (individual checks) ============
CREATE TABLE public.website_audit_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES public.website_audits(id) ON DELETE CASCADE,
  check_key text NOT NULL,
  category text NOT NULL,
  label text NOT NULL,
  status text NOT NULL, -- pass | warn | fail | not_tested
  weight integer NOT NULL DEFAULT 0,
  points_earned integer NOT NULL DEFAULT 0,
  impact text NOT NULL,
  priority text NOT NULL DEFAULT 'medium', -- critical | high | medium | low
  observed text NOT NULL DEFAULT '',
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  explanation text NOT NULL DEFAULT '',
  recommendation text NOT NULL DEFAULT '',
  fix_example text,
  manual_verification boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE INDEX website_audit_findings_audit_idx ON public.website_audit_findings (audit_id, sort_order);
GRANT SELECT, INSERT, DELETE ON public.website_audit_findings TO authenticated;
GRANT ALL ON public.website_audit_findings TO service_role;
ALTER TABLE public.website_audit_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own website findings" ON public.website_audit_findings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.website_audits a WHERE a.id = audit_id AND a.user_id = auth.uid()));
CREATE POLICY "Users insert findings for own website audits" ON public.website_audit_findings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.website_audits a WHERE a.id = audit_id AND a.user_id = auth.uid()));
CREATE POLICY "Users delete findings for own website audits" ON public.website_audit_findings FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.website_audits a WHERE a.id = audit_id AND a.user_id = auth.uid()));

-- ============ psi_cache (PageSpeed Insights results, service-role only) ============
CREATE TABLE public.psi_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.psi_cache TO service_role;
ALTER TABLE public.psi_cache ENABLE ROW LEVEL SECURITY;

-- ============ usage counter now includes website audits ============
CREATE OR REPLACE FUNCTION public.audits_used_this_month(_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (SELECT count(*)::int FROM public.audits
            WHERE user_id = _user_id AND created_at >= date_trunc('month', now()))
       + (SELECT count(*)::int FROM public.website_audits
            WHERE user_id = _user_id AND created_at >= date_trunc('month', now()));
$$;