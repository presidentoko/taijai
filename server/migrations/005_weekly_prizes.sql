CREATE TABLE IF NOT EXISTS weekly_config (
  week_key TEXT PRIMARY KEY,
  prize_1st INTEGER DEFAULT 0,
  prize_2nd INTEGER DEFAULT 0,
  prize_3rd INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_key TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  rank INTEGER NOT NULL,
  prize_thb INTEGER NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_key, rank)
);
