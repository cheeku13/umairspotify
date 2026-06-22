-- Index improvements + repair-support structures (schema v3).

PRAGMA foreign_keys = ON;

-- VERSION: 3

-- Playlist tracks: optimize position ordering
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_position
  ON playlist_tracks(playlist_id, position);

-- Artwork cache: support eviction / cleanup by accessed time and size
CREATE INDEX IF NOT EXISTS idx_artwork_accessed_desc
  ON artwork_cache(last_accessed_at DESC);

-- Favorites: already has idx_favorites_created; keep as-is.

-- Queue state: optimize restore read
CREATE INDEX IF NOT EXISTS idx_queue_state_updated
  ON queue_state(updated_at DESC);

