CREATE TABLE public.whatsapp_pending_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  lead_name TEXT,
  last_incoming_message TEXT,
  unanswered_count INTEGER DEFAULT 1,
  reason TEXT DEFAULT 'instance_down',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_pending_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all whatsapp_pending_followups" ON public.whatsapp_pending_followups
  FOR ALL USING (true) WITH CHECK (true);