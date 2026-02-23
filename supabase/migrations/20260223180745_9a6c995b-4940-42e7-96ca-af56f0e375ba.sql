
CREATE TABLE public.session_attribution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  fbclid TEXT,
  ttclid TEXT,
  fbp TEXT,
  fbc TEXT,
  ttp TEXT,
  gclid TEXT,
  referrer TEXT,
  landing_page TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_session_attribution UNIQUE (session_id)
);

ALTER TABLE public.session_attribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert session_attribution" ON public.session_attribution
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select session_attribution" ON public.session_attribution
  FOR SELECT USING (true);

CREATE POLICY "Allow update session_attribution" ON public.session_attribution
  FOR UPDATE USING (true);
