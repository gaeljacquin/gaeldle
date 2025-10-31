-- Add tsvector column for full-text search on game names
ALTER TABLE game ADD COLUMN name_search tsvector GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX game_name_search_idx ON game USING gin(name_search);
