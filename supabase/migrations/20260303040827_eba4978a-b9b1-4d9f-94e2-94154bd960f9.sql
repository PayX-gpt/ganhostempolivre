
-- Add quiz_variant column to session_attribution for A/B test tracking
ALTER TABLE public.session_attribution ADD COLUMN quiz_variant text DEFAULT NULL;

-- Index for fast grouping/filtering by variant
CREATE INDEX idx_session_attribution_quiz_variant ON public.session_attribution(quiz_variant) WHERE quiz_variant IS NOT NULL;
