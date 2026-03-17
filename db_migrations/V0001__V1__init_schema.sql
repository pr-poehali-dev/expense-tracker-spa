
CREATE TABLE IF NOT EXISTS t_p83865015_expense_tracker_spa.users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  login         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p83865015_expense_tracker_spa.sessions (
  id          TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES t_p83865015_expense_tracker_spa.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE IF NOT EXISTS t_p83865015_expense_tracker_spa.password_resets (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES t_p83865015_expense_tracker_spa.users(id),
  token       TEXT NOT NULL UNIQUE,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

CREATE TABLE IF NOT EXISTS t_p83865015_expense_tracker_spa.transactions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES t_p83865015_expense_tracker_spa.users(id),
  amount      NUMERIC(14,2) NOT NULL,
  category    TEXT NOT NULL,
  comment     TEXT DEFAULT '',
  type        TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  date        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p83865015_expense_tracker_spa.goals (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES t_p83865015_expense_tracker_spa.users(id) UNIQUE,
  name        TEXT NOT NULL DEFAULT 'Моя цель',
  target      NUMERIC(14,2) NOT NULL DEFAULT 0,
  current     NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p83865015_expense_tracker_spa.user_settings (
  user_id     INTEGER NOT NULL REFERENCES t_p83865015_expense_tracker_spa.users(id) PRIMARY KEY,
  currency    TEXT NOT NULL DEFAULT 'RUB',
  theme       TEXT NOT NULL DEFAULT 'dark'
);
