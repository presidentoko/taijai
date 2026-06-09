CREATE TABLE IF NOT EXISTS comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 300),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_prediction ON comments(prediction_id, created_at DESC);

CREATE TABLE IF NOT EXISTS suggestions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  option_a    TEXT NOT NULL,
  option_b    TEXT NOT NULL,
  category    TEXT DEFAULT 'general',
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE predictions ADD COLUMN IF NOT EXISTS suggested_by UUID REFERENCES users(id);
