-- Migration: create-user-location-alerts
-- Users subscribe to alerts for any sighting near a location

CREATE TABLE user_location_alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location   GEOGRAPHY(Point, 4326) NOT NULL,
  radius_km  NUMERIC(7, 2) NOT NULL DEFAULT 25,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_location_alerts_user ON user_location_alerts (user_id);
CREATE INDEX idx_user_location_alerts_location ON user_location_alerts USING GIST (location);
CREATE INDEX idx_user_location_alerts_active ON user_location_alerts (active) WHERE active;
