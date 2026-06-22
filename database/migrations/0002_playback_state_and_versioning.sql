-- Playback state + schema versioning (schema v2).

PRAGMA foreign_keys = ON;

-- VERSION: 2

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL,
  applied_from TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS playback_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  current_track_id TEXT,
  queue_track_ids_json TEXT NOT NULL DEFAULT '[]',
  current_index INTEGER NOT NULL DEFAULT 0 CHECK (current_index >= 0),
  position_ms INTEGER NOT NULL DEFAULT 0 CHECK (position_ms >= 0),
  volume_level REAL NOT NULL DEFAULT 1.0 CHECK (volume_level >= 0.0 AND volume_level <= 1.0),
  repeat_mode TEXT NOT NULL DEFAULT 'off'
    CHECK (repeat_mode IN ('off', 'one', 'all')),
  shuffle_enabled INTEGER NOT NULL DEFAULT 0 CHECK (shuffle_enabled IN (0, 1)),
  seed INTEGER NOT NULL DEFAULT 0,
  last_updated_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_playback_state_last_updated
  ON playback_state(last_updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_playback_state_current_track
  ON playback_state(current_track_id);

