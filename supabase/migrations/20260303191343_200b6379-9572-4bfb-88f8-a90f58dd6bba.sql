
CREATE TABLE IF NOT EXISTS public.campaign_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL,
  cost_date date NOT NULL DEFAULT CURRENT_DATE,
  daily_spend numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_name, cost_date)
);

ALTER TABLE public.campaign_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all campaign_costs" ON public.campaign_costs FOR ALL USING (true) WITH CHECK (true);
