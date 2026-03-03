
-- Create phone-to-session mapping for attribution
CREATE TABLE IF NOT EXISTS phone_session_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_phone_session_phone ON phone_session_map(phone);
CREATE INDEX IF NOT EXISTS idx_phone_session_session ON phone_session_map(session_id);

ALTER TABLE phone_session_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert phone_session" ON phone_session_map FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select phone_session" ON phone_session_map FOR SELECT USING (true);
