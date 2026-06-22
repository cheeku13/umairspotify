PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;
PRAGMA cache_size = -20000;

CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE,
  normalized_name TEXT NOT NULL,
  artwork_path TEXT,
  track_count INTEGER NOT NULL DEFAULT 0 CHECK (track_count >= 0),
  album_count INTEGER NOT NULL DEFAULT 0 CHECK (album_count >= 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_normalized_name
  ON artists(normalized_name);
CREATE INDEX IF NOT EXISTS idx_artists_name
  ON artists(name COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL COLLATE NOCASE,
  normalized_title TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  artist_name TEXT NOT NULL COLLATE NOCASE,
  artwork_cache_id TEXT,
  release_year INTEGER,
  track_count INTEGER NOT NULL DEFAULT 0 CHECK (track_count >= 0),
  duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_albums_artist_title
  ON albums(artist_id, normalized_title);
CREATE INDEX IF NOT EXISTS idx_albums_title
  ON albums(title COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_albums_artist
  ON albums(artist_id);

CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  file_uri TEXT NOT NULL,
  local_file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes >= 0),
  mime_type TEXT NOT NULL,
  title TEXT NOT NULL COLLATE NOCASE,
  sort_title TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  artist_name TEXT NOT NULL COLLATE NOCASE,
  album_id TEXT NOT NULL,
  album_title TEXT NOT NULL COLLATE NOCASE,
  album_artist_name TEXT,
  track_number INTEGER,
  disc_number INTEGER,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  bitrate INTEGER,
  sample_rate INTEGER,
  artwork_cache_id TEXT,
  date_added INTEGER NOT NULL,
  date_modified INTEGER NOT NULL,
  last_played_at INTEGER,
  play_count INTEGER NOT NULL DEFAULT 0 CHECK (play_count >= 0),
  import_status TEXT NOT NULL DEFAULT 'ready'
    CHECK(import_status IN ('pending', 'ready', 'failed', 'unsupported')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE RESTRICT,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE RESTRICT,
  FOREIGN KEY (artwork_cache_id) REFERENCES artwork_cache(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tracks_source_id
  ON tracks(source_id);
CREATE INDEX IF NOT EXISTS idx_tracks_title
  ON tracks(title COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tracks_sort_title
  ON tracks(sort_title COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tracks_artist
  ON tracks(artist_id, title COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tracks_album
  ON tracks(album_id, track_number, title COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tracks_added
  ON tracks(date_added DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_last_played
  ON tracks(last_played_at DESC);

CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  track_id UNINDEXED,
  title,
  artist_name,
  album_title,
  content = ''
);

CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE,
  description TEXT NOT NULL DEFAULT '',
  track_count INTEGER NOT NULL DEFAULT 0 CHECK (track_count >= 0),
  duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_playlists_name
  ON playlists(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_playlists_updated
  ON playlists(updated_at DESC);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, track_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_playlist_tracks_position
  ON playlist_tracks(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track
  ON playlist_tracks(track_id);

CREATE TABLE IF NOT EXISTS queue_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  track_ids_json TEXT NOT NULL,
  current_index INTEGER NOT NULL DEFAULT 0 CHECK (current_index >= 0),
  position_ms INTEGER NOT NULL DEFAULT 0 CHECK (position_ms >= 0),
  repeat_mode TEXT NOT NULL DEFAULT 'off'
    CHECK(repeat_mode IN ('off', 'one', 'all')),
  shuffle_enabled INTEGER NOT NULL DEFAULT 0 CHECK(shuffle_enabled IN (0, 1)),
  shuffled_track_ids_json TEXT NOT NULL DEFAULT '[]',
  seed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  track_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorites_created
  ON favorites(created_at DESC);

CREATE TABLE IF NOT EXISTS artwork_cache (
  id TEXT PRIMARY KEY,
  source_track_id TEXT,
  album_id TEXT,
  original_path TEXT,
  cached_path TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER NOT NULL CHECK (width >= 0),
  height INTEGER NOT NULL CHECK (height >= 0),
  byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
  content_hash TEXT NOT NULL,
  last_accessed_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (source_track_id) REFERENCES tracks(id) ON DELETE SET NULL,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_artwork_hash
  ON artwork_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_artwork_album
  ON artwork_cache(album_id);
CREATE INDEX IF NOT EXISTS idx_artwork_accessed
  ON artwork_cache(last_accessed_at);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  value_type TEXT NOT NULL CHECK(value_type IN ('string', 'number', 'boolean', 'json')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS play_history (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  position_ms INTEGER NOT NULL DEFAULT 0 CHECK (position_ms >= 0),
  completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_play_history_track
  ON play_history(track_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_play_history_started
  ON play_history(started_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_tracks_search_insert
AFTER INSERT ON tracks
BEGIN
  INSERT INTO search_index(rowid, track_id, title, artist_name, album_title)
  VALUES (new.rowid, new.id, new.title, new.artist_name, new.album_title);
END;

CREATE TRIGGER IF NOT EXISTS trg_tracks_search_update
AFTER UPDATE OF title, artist_name, album_title ON tracks
BEGIN
  DELETE FROM search_index WHERE track_id = old.id;
  INSERT INTO search_index(rowid, track_id, title, artist_name, album_title)
  VALUES (new.rowid, new.id, new.title, new.artist_name, new.album_title);
END;

CREATE TRIGGER IF NOT EXISTS trg_tracks_search_delete
AFTER DELETE ON tracks
BEGIN
  DELETE FROM search_index WHERE track_id = old.id;
END;
