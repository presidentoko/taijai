CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS predictions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question       TEXT NOT NULL,
  options        TEXT[] NOT NULL,
  deadline       TIMESTAMPTZ NOT NULL,
  resolved       BOOLEAN DEFAULT FALSE,
  correct_option INT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_id             TEXT UNIQUE NOT NULL,
  display_name        TEXT,
  avatar_url          TEXT,
  total_predictions   INT DEFAULT 0,
  correct_predictions INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  option_index  INT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_id, user_id)
);
