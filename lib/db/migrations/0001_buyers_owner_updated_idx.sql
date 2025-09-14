-- Composite index to optimize queries filtering by owner and sorting by updated_at
-- Safe to run multiple times
CREATE INDEX IF NOT EXISTS buyers_owner_updated_idx ON buyers (owner_id, updated_at);
