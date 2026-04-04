-- Migration: create-oauth-accounts
-- Store OAuth provider links for users (Google, Apple, etc.)

CREATE TABLE oauth_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,  -- 'google', 'apple'
  provider_user_id TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts (user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts (provider, provider_user_id);
