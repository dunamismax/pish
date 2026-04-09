-- Migration: create-users
-- Core user table with roles, status, and geospatial support

CREATE TYPE user_role AS ENUM (
  'god',
  'admin',
  'regional_mod',
  'trusted',
  'user',
  'new_user',
  'banned'
);

CREATE TYPE account_status AS ENUM (
  'active',
  'banned',
  'new_user'
);

CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT NOT NULL UNIQUE,
  username       TEXT NOT NULL UNIQUE,
  display_name   TEXT,
  password_hash  TEXT,  -- nullable for OAuth-only accounts
  role           user_role NOT NULL DEFAULT 'new_user',
  account_status account_status NOT NULL DEFAULT 'new_user',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url     TEXT,
  bio            TEXT,
  location_name  TEXT,
  home_location  GEOMETRY(Point, 4326),  -- PostGIS point for home location
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_account_status ON users (account_status);
CREATE INDEX idx_users_home_location ON users USING GIST (home_location);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
