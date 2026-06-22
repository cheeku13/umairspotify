import { Track } from '@appTypes/index';
import { BaseRepository, DatabaseRow } from './BaseRepository';
import { trackSelectSql } from './sql';

export class TrackRepository extends BaseRepository {
  async getTracks(limit = 10000, offset = 0): Promise<Track[]> {
    const rows = await this.query(
      `${trackSelectSql}
       ORDER BY tracks.date_added DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );
    return rows.map(row => this.mapTrack(row));
  }

  async getTrackById(trackId: string): Promise<Track | null> {
    const row = await this.queryOne(`${trackSelectSql} WHERE tracks.id = ?`, [trackId]);
    return row ? this.mapTrack(row) : null;
  }

  async upsertTrack(track: Track): Promise<void> {
    await this.execute(
      `INSERT INTO tracks (
        id, source_id, file_uri, local_file_path, file_name, file_size_bytes, mime_type,
        title, sort_title, artist_id, artist_name, album_id, album_title, album_artist_name,
        track_number, disc_number, duration_ms, bitrate, sample_rate, artwork_cache_id,
        date_added, date_modified, last_played_at, play_count, import_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        file_uri = excluded.file_uri,
        local_file_path = excluded.local_file_path,
        file_name = excluded.file_name,
        file_size_bytes = excluded.file_size_bytes,
        mime_type = excluded.mime_type,
        title = excluded.title,
        sort_title = excluded.sort_title,
        artist_id = excluded.artist_id,
        artist_name = excluded.artist_name,
        album_id = excluded.album_id,
        album_title = excluded.album_title,
        album_artist_name = excluded.album_artist_name,
        track_number = excluded.track_number,
        disc_number = excluded.disc_number,
        duration_ms = excluded.duration_ms,
        bitrate = excluded.bitrate,
        sample_rate = excluded.sample_rate,
        artwork_cache_id = excluded.artwork_cache_id,
        date_modified = excluded.date_modified,
        import_status = excluded.import_status,
        updated_at = excluded.updated_at`,
      [
        track.id,
        track.sourceId,
        track.fileUri,
        track.localFilePath,
        track.fileName,
        track.fileSizeBytes,
        track.mimeType,
        track.title,
        track.sortTitle,
        track.artistId,
        track.artistName,
        track.albumId,
        track.albumTitle,
        track.albumArtistName,
        track.trackNumber,
        track.discNumber,
        track.durationMs,
        track.bitrate,
        track.sampleRate,
        track.artworkCacheId,
        track.dateAdded,
        track.dateModified,
        track.lastPlayedAt,
        track.playCount,
        track.importStatus,
        track.createdAt,
        track.updatedAt,
      ],
    );
  }

  async deleteTrack(trackId: string): Promise<void> {
    await this.execute('DELETE FROM tracks WHERE id = ?', [trackId]);
  }

  async getFavorites(limit = 10000): Promise<Track[]> {
    const rows = await this.query(
      `${trackSelectSql}
       JOIN favorites ON favorites.track_id = tracks.id
       ORDER BY favorites.created_at DESC
       LIMIT ?`,
      [limit],
    );
    return rows.map(row => this.mapTrack(row));
  }

  async setFavorite(trackId: string, favorite: boolean): Promise<void> {
    if (favorite) {
      await this.execute(
        'INSERT OR REPLACE INTO favorites (track_id, created_at, updated_at) VALUES (?, ?, ?)',
        [trackId, this.now(), this.now()],
      );
      return;
    }
    await this.execute('DELETE FROM favorites WHERE track_id = ?', [trackId]);
  }

  public mapTrack(row: DatabaseRow): Track {
    return {
      id: this.asString(row, 'id'),
      sourceId: this.asString(row, 'source_id'),
      fileUri: this.asString(row, 'file_uri'),
      localFilePath: this.asString(row, 'local_file_path'),
      fileName: this.asString(row, 'file_name'),
      fileSizeBytes: this.asNumber(row, 'file_size_bytes'),
      mimeType: this.asString(row, 'mime_type'),
      title: this.asString(row, 'title'),
      sortTitle: this.asString(row, 'sort_title'),
      artistId: this.asString(row, 'artist_id'),
      artistName: this.asString(row, 'artist_name'),
      albumId: this.asString(row, 'album_id'),
      albumTitle: this.asString(row, 'album_title'),
      albumArtistName: this.asNullableString(row, 'album_artist_name'),
      trackNumber: this.asNullableNumber(row, 'track_number'),
      discNumber: this.asNullableNumber(row, 'disc_number'),
      durationMs: this.asNumber(row, 'duration_ms'),
      bitrate: this.asNullableNumber(row, 'bitrate'),
      sampleRate: this.asNullableNumber(row, 'sample_rate'),
      artworkCacheId: this.asNullableString(row, 'artwork_cache_id'),
      artworkUri: this.asNullableString(row, 'artwork_uri'),
      dateAdded: this.asNumber(row, 'date_added'),
      dateModified: this.asNumber(row, 'date_modified'),
      lastPlayedAt: this.asNullableNumber(row, 'last_played_at'),
      playCount: this.asNumber(row, 'play_count'),
      importStatus: this.asString(row, 'import_status', 'ready') as Track['importStatus'],
      isFavorite: this.asBoolean(row, 'is_favorite'),
      createdAt: this.asNumber(row, 'created_at'),
      updatedAt: this.asNumber(row, 'updated_at'),
    };
  }

  async searchLibraryTracks(
    query: string,
    sortBy: 'dateAdded' | 'title' | 'artist' | 'duration',
    filterBy: 'all' | 'favorites' | 'downloaded',
    limit: number = 10000,
    offset: number = 0
  ): Promise<Track[]> {
    let sql = trackSelectSql;
    const params: any[] = [];
    const trimmed = query.trim();

    // 1. Handle Full Text Search
    if (trimmed) {
      const ftsQuery = trimmed
        .split(/\s+/)
        .map(token => `${token.replace(/["*]/g, '')}*`)
        .join(' ');
      sql += `\nJOIN search_index ON search_index.track_id = tracks.id`;
      sql += `\nWHERE search_index MATCH ?`;
      params.push(ftsQuery);
    } else {
      sql += `\nWHERE 1=1`; // simplify appending AND
    }

    // 2. Handle Filters
    if (filterBy === 'favorites') {
      // trackSelectSql already LEFT JOINs favorites to select is_favorite
      // We can just filter by favorites.created_at IS NOT NULL
      sql += `\nAND favorites.created_at IS NOT NULL`;
    } else if (filterBy === 'downloaded') {
      sql += `\nAND tracks.local_file_path IS NOT NULL`;
    }

    // 3. Handle Sorting
    if (trimmed) {
      // If searching, BM25 rank takes precedence unless another sort is strongly desired.
      // But user selected a specific sort. Let's respect it but maybe fallback to rank?
      // Actually, if we have a query, it's usually best to order by rank, but we'll respect the sortBy if specified.
      sql += `\nORDER BY `;
    } else {
      sql += `\nORDER BY `;
    }

    switch (sortBy) {
      case 'title':
        sql += `tracks.sort_title ASC`;
        break;
      case 'artist':
        sql += `tracks.artist_name COLLATE NOCASE ASC, tracks.sort_title ASC`;
        break;
      case 'duration':
        sql += `tracks.duration_ms ASC`;
        break;
      case 'dateAdded':
      default:
        sql += `tracks.date_added DESC`;
        break;
    }

    sql += `\nLIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await this.query(sql, params);
    return rows.map(row => this.mapTrack(row));
  }
}
