import { Playlist, SmartRule, Track } from '@apptypes/index';
import { container } from '../../core/ServiceContainer';
import { TrackRepository } from './TrackRepository';
import { BaseRepository, DatabaseRow, DatabaseValue } from './BaseRepository';

export class PlaylistRepository extends BaseRepository {
  async getPlaylists(): Promise<Playlist[]> {
    const rows = await this.query('SELECT * FROM playlists ORDER BY updated_at DESC', []);
    return Promise.all(rows.map(row => this.mapPlaylist(row)));
  }

  async createPlaylist(name: string, description = '', isSmart = false, smartRules: SmartRule[] = []): Promise<Playlist> {
    const timestamp = this.now();
    const playlist: Playlist = {
      id: `playlist-${timestamp}`,
      name: name.trim(),
      description: description.trim(),
      trackIds: [],
      trackCount: 0,
      durationMs: 0,
      isSmart,
      smartRules,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    const rulesJson = isSmart ? JSON.stringify(smartRules) : null;
    
    await this.execute(
      `INSERT INTO playlists (id, name, description, track_count, duration_ms, is_smart, smart_rules_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [playlist.id, playlist.name, playlist.description, 0, 0, isSmart ? 1 : 0, rulesJson, timestamp, timestamp],
    );
    return playlist;
  }

  async replacePlaylistTracks(playlistId: string, trackIds: string[]): Promise<void> {
    const timestamp = this.now();
    const statements: Array<{ sql: string; params: DatabaseValue[] }> = [
      { sql: 'DELETE FROM playlist_tracks WHERE playlist_id = ?', params: [playlistId] },
      {
        sql: 'UPDATE playlists SET track_count = ?, updated_at = ? WHERE id = ?',
        params: [trackIds.length, timestamp, playlistId],
      },
    ];
    trackIds.forEach((trackId, index) => {
      statements.push({
        sql: 'INSERT INTO playlist_tracks (playlist_id, track_id, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        params: [playlistId, trackId, index, timestamp, timestamp],
      });
    });
    await this.transaction(statements);
  }

  public async mapPlaylist(row: DatabaseRow): Promise<Playlist> {
    const id = this.asString(row, 'id');
    const isSmart = this.asBoolean(row, 'is_smart');
    const smartRulesJson = this.asNullableString(row, 'smart_rules_json');
    let smartRules: SmartRule[] = [];
    if (isSmart && smartRulesJson) {
      try {
        smartRules = JSON.parse(smartRulesJson);
      } catch (e) {
        console.error('Failed to parse smart rules JSON', e);
      }
    }

    let trackIds: string[] = [];
    if (!isSmart) {
      const trackRows = await this.query(
        'SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY position',
        [id],
      );
      trackIds = trackRows.map(trackRow => this.asString(trackRow, 'track_id'));
    }

    return {
      id,
      name: this.asString(row, 'name'),
      description: this.asString(row, 'description'),
      trackIds,
      trackCount: this.asNumber(row, 'track_count'),
      durationMs: this.asNumber(row, 'duration_ms'),
      isSmart,
      smartRules,
      createdAt: this.asNumber(row, 'created_at'),
      updatedAt: this.asNumber(row, 'updated_at'),
    };
  }

  async getSmartPlaylistTracks(playlistId: string): Promise<Track[]> {
    const playlistRow = await this.queryOne('SELECT is_smart, smart_rules_json FROM playlists WHERE id = ?', [playlistId]);
    if (!playlistRow || !this.asBoolean(playlistRow, 'is_smart')) {
      return [];
    }

    const rulesJson = this.asNullableString(playlistRow, 'smart_rules_json');
    if (!rulesJson) return [];

    let rules: SmartRule[] = [];
    try {
      rules = JSON.parse(rulesJson);
    } catch {
      return [];
    }

    if (rules.length === 0) return [];

    let sql = `SELECT tracks.*, favorites.created_at as is_favorite 
               FROM tracks 
               LEFT JOIN favorites ON favorites.track_id = tracks.id
               WHERE 1=1`;
    const params: DatabaseValue[] = [];

    for (const rule of rules) {
      const { field, operator, value } = rule;
      let dbField = '';
      switch (field) {
        case 'playCount': dbField = 'tracks.play_count'; break;
        case 'addedAt': dbField = 'tracks.date_added'; break;
        case 'lastPlayedAt': dbField = 'tracks.last_played_at'; break;
        case 'durationMs': dbField = 'tracks.duration_ms'; break;
        case 'artistName': dbField = 'tracks.artist_name'; break;
        case 'albumTitle': dbField = 'tracks.album_title'; break;
        case 'isFavorite': dbField = 'favorites.created_at'; break;
      }

      if (!dbField) continue;

      if (field === 'isFavorite') {
        if (value === true) {
          sql += ` AND ${dbField} IS NOT NULL`;
        } else {
          sql += ` AND ${dbField} IS NULL`;
        }
        continue;
      }

      switch (operator) {
        case '=': sql += ` AND ${dbField} = ?`; params.push(value as any); break;
        case '!=': sql += ` AND ${dbField} != ?`; params.push(value as any); break;
        case '>': sql += ` AND ${dbField} > ?`; params.push(value as any); break;
        case '<': sql += ` AND ${dbField} < ?`; params.push(value as any); break;
        case '>=': sql += ` AND ${dbField} >= ?`; params.push(value as any); break;
        case '<=': sql += ` AND ${dbField} <= ?`; params.push(value as any); break;
        case 'contains': sql += ` AND ${dbField} LIKE ? COLLATE NOCASE`; params.push(`%${value}%`); break;
        case 'not_contains': sql += ` AND ${dbField} NOT LIKE ? COLLATE NOCASE`; params.push(`%${value}%`); break;
      }
    }

    sql += ` ORDER BY tracks.date_added DESC LIMIT 500`;

    const trackRows = await this.query(sql, params);
    const trackRepo = container.resolve<TrackRepository>('TrackRepository');
    return trackRows.map(row => trackRepo.mapTrack(row));
  }
}
