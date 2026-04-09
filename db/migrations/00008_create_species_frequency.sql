-- Migration: create-species-frequency
-- eBird frequency data per species, region, and month

CREATE TABLE species_frequency (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id   UUID NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  region_code  TEXT NOT NULL,     -- eBird region code (e.g., 'US-FL-021' for Collier County)
  month        SMALLINT NOT NULL, -- 1-12
  frequency    REAL NOT NULL,     -- 0.0 to 1.0 (fraction of checklists reporting)
  sample_size  INT,               -- number of checklists in sample
  UNIQUE (species_id, region_code, month)
);

CREATE INDEX idx_species_frequency_species ON species_frequency (species_id);
CREATE INDEX idx_species_frequency_region ON species_frequency (region_code);
CREATE INDEX idx_species_frequency_region_month ON species_frequency (region_code, month);
CREATE INDEX idx_species_frequency_lookup ON species_frequency (region_code, month, frequency DESC);
