ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  amount_thb    NUMERIC(10,2) NOT NULL,
  credits       INT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  omise_charge_id TEXT,
  promptpay_qr  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  paid_at       TIMESTAMPTZ
);
