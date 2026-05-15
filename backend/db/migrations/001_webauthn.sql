-- WebAuthn / Biometric credentials table
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
