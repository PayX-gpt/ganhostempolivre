
-- funnel_audit_logs
CREATE TABLE IF NOT EXISTS public.funnel_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  page_id TEXT,
  session_id TEXT NOT NULL,
  payment_id TEXT,
  conversion_id TEXT,
  redirect_url TEXT,
  duration_ms INTEGER,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT
);

ALTER TABLE public.funnel_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert audit" ON public.funnel_audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select audit" ON public.funnel_audit_logs FOR SELECT USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_audit_logs;

-- purchase_tracking
CREATE TABLE IF NOT EXISTS public.purchase_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  amount NUMERIC,
  status TEXT DEFAULT 'purchased',
  email TEXT,
  plan_id TEXT,
  product_name TEXT,
  session_id TEXT,
  failure_reason TEXT,
  funnel_step TEXT,
  transaction_id TEXT,
  redirect_completed BOOLEAN DEFAULT false,
  redirect_completed_at TIMESTAMP WITH TIME ZONE,
  redirect_source TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  fbclid TEXT,
  gclid TEXT,
  fbp TEXT,
  fbc TEXT,
  landing_page TEXT,
  referrer TEXT,
  pixel_sent BOOLEAN DEFAULT false,
  conversion_api_sent BOOLEAN DEFAULT false,
  utmify_sent BOOLEAN DEFAULT false,
  event_id TEXT,
  whop_payment_id TEXT,
  vsl_variant TEXT
);

ALTER TABLE public.purchase_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert purchase" ON public.purchase_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select purchase" ON public.purchase_tracking FOR SELECT USING (true);
CREATE POLICY "Allow update purchase" ON public.purchase_tracking FOR UPDATE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_tracking;

-- funnel_events
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  user_agent TEXT
);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert events" ON public.funnel_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select events" ON public.funnel_events FOR SELECT USING (true);

-- redirect_metrics
CREATE TABLE IF NOT EXISTS public.redirect_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL,
  from_page TEXT NOT NULL,
  to_page TEXT NOT NULL,
  redirect_duration_ms INTEGER NOT NULL
);

ALTER TABLE public.redirect_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert redirects" ON public.redirect_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select redirects" ON public.redirect_metrics FOR SELECT USING (true);
