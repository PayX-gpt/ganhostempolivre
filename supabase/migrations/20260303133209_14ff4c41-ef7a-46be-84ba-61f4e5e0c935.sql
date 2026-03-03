
-- Add attribution_method column to session_attribution
ALTER TABLE public.session_attribution ADD COLUMN IF NOT EXISTS attribution_method text DEFAULT 'original';

-- Index for filtering by attribution method
CREATE INDEX IF NOT EXISTS idx_session_attribution_method ON public.session_attribution(attribution_method);
