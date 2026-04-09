-- Migration: create-user-species-alerts
-- Users subscribe to alerts for specific species at a rarity threshold

CREATE TABLE user_species_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species_id  UUID NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  min_rarity  sighting_rarity NOT NULL DEFAULT 'rare',
  radius_km   NUMERIC(7, 2) NOT NULL DEFAULT 50,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, species_id)
);

CREATE INDEX idx_user_species_alerts_user ON user_species_alerts (user_id);
CREATE INDEX idx_user_species_alerts_species ON user_species_alerts (species_id);
CREATE INDEX idx_user_species_alerts_active ON user_species_alerts (active) WHERE active;
