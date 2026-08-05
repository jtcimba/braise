CREATE TABLE video_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  extracted_recipe JSONB,
  low_confidence BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE video_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own video import jobs"
  ON video_import_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own video import jobs"
  ON video_import_jobs FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage video import jobs"
  ON video_import_jobs FOR ALL
  USING (auth.role() = 'service_role');
