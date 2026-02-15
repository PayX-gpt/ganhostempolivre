
-- Table to store granular behavioral data from the offer page
CREATE TABLE public.lead_behavior (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Quiz answers snapshot for segmentation
  quiz_answers JSONB DEFAULT '{}'::jsonb,
  
  -- Offer page behavior
  time_on_page_ms INTEGER DEFAULT 0,
  max_scroll_depth INTEGER DEFAULT 0,  -- percentage 0-100
  sections_viewed TEXT[] DEFAULT '{}',
  section_times JSONB DEFAULT '{}'::jsonb,  -- { "hero": 5000, "testimonials": 12000, ... }
  
  -- CTA interaction behavior
  cta_views INTEGER DEFAULT 0,
  cta_clicks INTEGER DEFAULT 0,
  first_cta_view_ms INTEGER,  -- ms after page load
  first_cta_click_ms INTEGER,
  cta_hesitation_count INTEGER DEFAULT 0,  -- scrolled past CTA without clicking
  
  -- Video behavior
  video_started BOOLEAN DEFAULT false,
  video_watch_time_ms INTEGER DEFAULT 0,
  
  -- FAQ behavior
  faq_opened TEXT[] DEFAULT '{}',
  
  -- Outcome
  checkout_clicked BOOLEAN DEFAULT false,
  checkout_click_count INTEGER DEFAULT 0,
  
  -- Computed fields (updated by edge function)
  intent_score INTEGER,  -- 0-100
  intent_label TEXT,     -- 'cold', 'warm', 'hot', 'buyer'
  ai_insights TEXT,      -- AI-generated analysis
  segment_tags TEXT[] DEFAULT '{}',
  
  -- Price shown
  dynamic_price NUMERIC,
  account_balance TEXT,
  
  CONSTRAINT valid_scroll CHECK (max_scroll_depth >= 0 AND max_scroll_depth <= 100)
);

-- Enable RLS
ALTER TABLE public.lead_behavior ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert lead_behavior" ON public.lead_behavior FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select lead_behavior" ON public.lead_behavior FOR SELECT USING (true);
CREATE POLICY "Allow update lead_behavior" ON public.lead_behavior FOR UPDATE USING (true);

-- Index for fast lookups
CREATE INDEX idx_lead_behavior_session ON public.lead_behavior(session_id);
CREATE INDEX idx_lead_behavior_created ON public.lead_behavior(created_at DESC);
CREATE INDEX idx_lead_behavior_intent ON public.lead_behavior(intent_score DESC NULLS LAST);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_behavior;
