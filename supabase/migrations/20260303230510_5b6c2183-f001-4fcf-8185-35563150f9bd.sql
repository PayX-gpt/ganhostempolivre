-- Create email_session_map for email-based session correlation
CREATE TABLE IF NOT EXISTS public.email_session_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_session_map_email ON public.email_session_map (LOWER(email));
CREATE INDEX idx_email_session_map_session ON public.email_session_map (session_id);

ALTER TABLE public.email_session_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert email_session" ON public.email_session_map FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select email_session" ON public.email_session_map FOR SELECT USING (true);

-- Backfill: populate email_session_map from phone_session_map + whatsapp_welcome_queue cross-referencing
-- This won't help for email users, but establishes the table

-- Backfill from purchase_tracking: for purchases WITH session_id and email, create mapping
INSERT INTO public.email_session_map (email, session_id, created_at)
SELECT DISTINCT ON (LOWER(TRIM(p.email)))
  LOWER(TRIM(p.email)), p.session_id, p.created_at
FROM public.purchase_tracking p
WHERE p.session_id IS NOT NULL AND p.session_id != '' AND p.session_id LIKE 'sess_%'
AND p.email IS NOT NULL AND p.email != ''
ORDER BY LOWER(TRIM(p.email)), p.created_at DESC;
