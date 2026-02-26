
-- Table: whatsapp_instances
CREATE TABLE public.whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id text NOT NULL,
  token text NOT NULL,
  label text NOT NULL DEFAULT 'Instância',
  is_active boolean NOT NULL DEFAULT true,
  priority integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  health_status text DEFAULT 'unknown',
  last_error text,
  last_health_check timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all whatsapp_instances" ON public.whatsapp_instances FOR ALL USING (true) WITH CHECK (true);

-- Table: whatsapp_conversations
CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  lead_name text,
  direction text NOT NULL DEFAULT 'outgoing',
  message text NOT NULL,
  ai_generated boolean DEFAULT false,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all whatsapp_conversations" ON public.whatsapp_conversations FOR ALL USING (true) WITH CHECK (true);

-- Table: whatsapp_welcome_queue
CREATE TABLE public.whatsapp_welcome_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  lead_name text,
  lead_type text NOT NULL DEFAULT 'unknown',
  purchased boolean NOT NULL DEFAULT false,
  purchased_at timestamptz,
  send_at timestamptz NOT NULL,
  sent boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_welcome_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all whatsapp_welcome_queue" ON public.whatsapp_welcome_queue FOR ALL USING (true) WITH CHECK (true);
