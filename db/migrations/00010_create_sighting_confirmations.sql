-- Migration: create-sighting-confirmations
-- Users confirm sightings with optional photo and notes

CREATE TABLE sighting_confirmations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sighting_id UUID NOT NULL REFERENCES sightings(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_url   TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sighting_id, user_id)
);

CREATE INDEX idx_sighting_confirmations_sighting ON sighting_confirmations (sighting_id);
CREATE INDEX idx_sighting_confirmations_user ON sighting_confirmations (user_id);
