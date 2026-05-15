-- ─────────────────────────────────────────────────────────────────────────────
-- ESNSA Energy Security Portal — Database Schema
-- Database: esnsa_db
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  officer_id    VARCHAR(10)  UNIQUE NOT NULL,
  name          VARCHAR(150) NOT NULL,
  role          VARCHAR(20)  NOT NULL
                CHECK (role IN ('DIRECTOR','ANALYST','OFFICER','LIAISON','ADMIN')),
  clearance     VARCHAR(20)  NOT NULL
                CHECK (clearance IN ('TOP SECRET','SECRET','CONFIDENTIAL','RESTRICTED','SYSTEM')),
  password_hash VARCHAR(255) NOT NULL,
  is_active     BOOLEAN      DEFAULT true,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── THREATS / INCIDENTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS threats (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id   VARCHAR(10)  UNIQUE NOT NULL,
  type          VARCHAR(50)  NOT NULL,
  location      VARCHAR(200) NOT NULL,
  state         VARCHAR(50),
  latitude      DECIMAL(9,6),
  longitude     DECIMAL(9,6),
  severity      VARCHAR(10)  NOT NULL
                CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  status        VARCHAR(15)  NOT NULL
                CHECK (status IN ('ACTIVE','MONITORING','CONTAINED','RESOLVED')),
  logged_by     UUID         REFERENCES users(id),
  logged_at     TIMESTAMPTZ  DEFAULT NOW(),
  loss_estimate VARCHAR(100),
  description   TEXT,
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS threat_agencies (
  threat_id   UUID REFERENCES threats(id) ON DELETE CASCADE,
  agency_name VARCHAR(50) NOT NULL,
  PRIMARY KEY (threat_id, agency_name)
);

CREATE TABLE IF NOT EXISTS threat_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  threat_id  UUID REFERENCES threats(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id),
  note       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INTELLIGENCE ITEMS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intel_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classification VARCHAR(20) NOT NULL
                 CHECK (classification IN ('TOP SECRET','SECRET','CONFIDENTIAL','RESTRICTED')),
  source         VARCHAR(50) NOT NULL,
  content        TEXT        NOT NULL,
  related_threat UUID        REFERENCES threats(id),
  logged_by      UUID        REFERENCES users(id),
  logged_at      TIMESTAMPTZ DEFAULT NOW(),
  is_actioned    BOOLEAN     DEFAULT false
);

-- ─── STAKEHOLDERS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stakeholders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) UNIQUE NOT NULL,
  role          VARCHAR(150) NOT NULL,
  status        VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE','STANDBY','OFFLINE')),
  contact_name  VARCHAR(100),
  contact_email VARCHAR(150),
  last_contact  TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user      UUID REFERENCES users(id),
  to_stakeholder UUID REFERENCES stakeholders(id),
  subject        VARCHAR(200) NOT NULL,
  body           TEXT         NOT NULL,
  classification VARCHAR(20)  NOT NULL DEFAULT 'RESTRICTED',
  related_threat UUID         REFERENCES threats(id),
  sent_at        TIMESTAMPTZ  DEFAULT NOW(),
  is_read        BOOLEAN      DEFAULT false
);

-- ─── AI BRIEFS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS briefs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_type      VARCHAR(30) NOT NULL,
  classification  VARCHAR(20) NOT NULL DEFAULT 'SECRET',
  prepared_for    UUID REFERENCES users(id),
  generated_by    UUID REFERENCES users(id),
  content         TEXT        NOT NULL,
  threat_snapshot JSONB,
  intel_snapshot  JSONB,
  status          VARCHAR(15) DEFAULT 'GENERATED'
                  CHECK (status IN ('GENERATED','REVIEWED','SENT','ARCHIVED')),
  generated_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ
);

-- ─── REPORTS / DOCUMENTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          VARCHAR(250) NOT NULL,
  type           VARCHAR(20)  NOT NULL
                 CHECK (type IN ('SITREP','ANALYTICAL','OPERATIONAL','INTELLIGENCE','EXECUTIVE','STRATEGIC')),
  status         VARCHAR(10)  DEFAULT 'DRAFT'
                 CHECK (status IN ('DRAFT','REVIEW','FINAL')),
  author_id      UUID REFERENCES users(id),
  file_path      VARCHAR(500),
  file_name      VARCHAR(250),
  file_size      INTEGER,
  related_threat UUID REFERENCES threats(id),
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── AUDIT LOG ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  details     JSONB,
  ip_address  VARCHAR(45),
  user_agent  VARCHAR(500),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_threats_status    ON threats(status);
CREATE INDEX IF NOT EXISTS idx_threats_severity  ON threats(severity);
CREATE INDEX IF NOT EXISTS idx_intel_class       ON intel_items(classification);
CREATE INDEX IF NOT EXISTS idx_intel_logged      ON intel_items(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user        ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created     ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefs_generated  ON briefs(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_stakeholder ON messages(to_stakeholder);

-- ─── WEBAUTHN / BIOMETRIC CREDENTIALS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT        UNIQUE NOT NULL,
  public_key    TEXT        NOT NULL,
  counter       BIGINT      DEFAULT 0,
  device_type   VARCHAR(50),
  backed_up     BOOLEAN     DEFAULT false,
  transports    TEXT[]      DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
