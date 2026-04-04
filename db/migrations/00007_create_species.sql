-- Migration: create-species
-- Species taxonomy table for eBird data

CREATE TABLE species (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_code           TEXT NOT NULL UNIQUE,
  common_name            TEXT NOT NULL,
  scientific_name        TEXT NOT NULL,
  family_common_name     TEXT,
  family_scientific_name TEXT,
  taxonomic_order        TEXT,
  category               TEXT,  -- 'species', 'issf', 'slash', 'spuh', 'hybrid', 'form', 'domestic'
  taxon_order            REAL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_species_common_name ON species (common_name);
CREATE INDEX idx_species_scientific_name ON species (scientific_name);
CREATE INDEX idx_species_category ON species (category);
CREATE INDEX idx_species_taxon_order ON species (taxon_order);

CREATE TRIGGER trg_species_updated_at
  BEFORE UPDATE ON species
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
