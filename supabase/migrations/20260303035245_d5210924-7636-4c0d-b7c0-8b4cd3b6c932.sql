CREATE INDEX IF NOT EXISTS idx_lb_created ON public.lead_behavior (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sa_created ON public.session_attribution (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sa_session ON public.session_attribution (session_id);
CREATE INDEX IF NOT EXISTS idx_al_type_created ON public.funnel_audit_logs (event_type, created_at DESC);