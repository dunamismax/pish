-- Migration: create-sighting-flags
-- Flag sightings for review; moderators can resolve

CREATE TABLE sighting_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sighting_id UUID NOT NULL REFERENCES sightings(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  resolved    BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sighting_flags_sighting ON sighting_flags (sighting_id);
CREATE INDEX idx_sighting_flags_user ON sighting_flags (user_id);
CREATE INDEX idx_sighting_flags_unresolved ON sighting_flags (sighting_id) WHERE NOT resolved;
