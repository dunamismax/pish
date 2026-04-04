-- Migration: create-hotspots
-- eBird hotspot locations with PostGIS geography

CREATE TABLE hotspots (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebird_id                TEXT UNIQUE,
  name                    TEXT NOT NULL,
  location                GEOGRAPHY(Point, 4326) NOT NULL,
  lat                     NUMERIC(9, 6) NOT NULL,
  lng                     NUMERIC(9, 6) NOT NULL,
  country_code            TEXT,
  region_code             TEXT,
  species_count           INT,
  latest_observation_date DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hotspots_location ON hotspots USING GIST (location);
CREATE INDEX idx_hotspots_region ON hotspots (region_code);
CREATE INDEX idx_hotspots_ebird_id ON hotspots (ebird_id);
