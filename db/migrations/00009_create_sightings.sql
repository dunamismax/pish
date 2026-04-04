-- Migration: create-sightings
-- Sighting reports with PostGIS location, rarity, status, and media

CREATE TYPE sighting_rarity AS ENUM ('common', 'uncommon', 'rare', 'mega_rare');
CREATE TYPE sighting_status AS ENUM ('unconfirmed', 'confirmed', 'flagged', 'removed');

CREATE TABLE sightings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species_id          UUID NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  location            GEOGRAPHY(Point, 4326) NOT NULL,
  lat                 NUMERIC(9, 6) NOT NULL,
  lng                 NUMERIC(9, 6) NOT NULL,
  location_name       TEXT,
  notes               TEXT,
  rarity              sighting_rarity NOT NULL DEFAULT 'common',
  status              sighting_status NOT NULL DEFAULT 'unconfirmed',
  confirmation_count  INT NOT NULL DEFAULT 0,
  photo_urls          JSONB NOT NULL DEFAULT '[]'::jsonb,
  audio_url           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sightings_user ON sightings (user_id);
CREATE INDEX idx_sightings_species ON sightings (species_id);
CREATE INDEX idx_sightings_location ON sightings USING GIST (location);
CREATE INDEX idx_sightings_status ON sightings (status);
CREATE INDEX idx_sightings_rarity ON sightings (rarity);
CREATE INDEX idx_sightings_created_at ON sightings (created_at DESC);
CREATE INDEX idx_sightings_species_status ON sightings (species_id, status);

CREATE TRIGGER trg_sightings_updated_at
  BEFORE UPDATE ON sightings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
