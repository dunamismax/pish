-- Migration: add-false-report-decay
-- Track decaying false-report counts for anti-abuse thresholds

ALTER TABLE users
  ADD COLUMN false_report_count INT NOT NULL DEFAULT 0,
  ADD COLUMN last_false_report_decay_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX idx_users_false_report_count ON users (false_report_count);
