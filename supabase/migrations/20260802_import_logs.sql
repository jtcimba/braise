CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  platform TEXT,
  extraction_method TEXT,
  success BOOLEAN,
  latency_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage import logs"
  ON import_logs FOR ALL
  USING (auth.role() = 'service_role');
