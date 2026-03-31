
CREATE TABLE companies (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  brand_name    TEXT,
  brand_logo    TEXT,
  brand_color   TEXT DEFAULT '#00a8cc',
  brand_accent  TEXT DEFAULT '#a855f7',
  email         TEXT,
  website       TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id            SERIAL PRIMARY KEY,
  company_id    INT NOT NULL REFERENCES companies(id),
  plan          TEXT NOT NULL DEFAULT 'trial',
  status        TEXT NOT NULL DEFAULT 'active',
  clients_limit INT DEFAULT 10,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clients (
  id            SERIAL PRIMARY KEY,
  company_id    INT NOT NULL REFERENCES companies(id),
  phone         TEXT NOT NULL,
  name          TEXT NOT NULL,
  deal_id       TEXT,
  lawyer_name   TEXT,
  tariff        TEXT DEFAULT 'Стандарт',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, phone)
);

CREATE TABLE sessions (
  id            SERIAL PRIMARY KEY,
  token         TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  role          TEXT NOT NULL,
  subject_id    INT NOT NULL,
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE superadmins (
  id            SERIAL PRIMARY KEY,
  phone         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_token   ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_clients_company  ON clients(company_id);
CREATE INDEX idx_clients_phone    ON clients(phone);
CREATE INDEX idx_subscriptions_co ON subscriptions(company_id);

INSERT INTO superadmins (phone, password_hash)
VALUES ('+79000000000', 'CHANGE_ME_AFTER_FIRST_LOGIN');

INSERT INTO companies (name, phone, password_hash, brand_name, brand_color)
VALUES ('Демо Юрист', '+79111111111', 'CHANGE_ME', 'Демо Юрист', '#00a8cc');

INSERT INTO subscriptions (company_id, plan, status, clients_limit, expires_at)
VALUES (1, 'trial', 'active', 5, NOW() + INTERVAL '14 days');

INSERT INTO clients (company_id, phone, name, deal_id, lawyer_name)
VALUES (1, '+79222222222', 'Алексей Иванов', '12345', 'Елена Смирнова');
