import { ListeningInsights, TopItem } from '@appTypes/index';
import { BaseRepository, DatabaseRow } from './BaseRepository';

export class StatsRepository extends BaseRepository {
  async getListeningInsights(): Promise<ListeningInsights> {
    const [
      summaryRow,
      topTracksRows,
      topArtistsRows,
      topAlbumsRows,
      hourRows,
      dayRows,
      streakRow,
    ] = await Promise.all([
      this.queryOne(`
        SELECT
          COALESCE(SUM(play_count), 0) as total_plays,
          COALESCE(SUM(CASE WHEN play_count > 0 THEN duration_ms * play_count ELSE 0 END), 0) as total_listening_ms,
          COUNT(CASE WHEN play_count > 0 THEN 1 END) as unique_tracks,
          COUNT(DISTINCT CASE WHEN play_count > 0 THEN artist_id END) as unique_artists
        FROM tracks
      `, []),
      this.query(`
        SELECT
          tracks.id,
          tracks.title as name,
          tracks.artwork_cache_id as artwork_uri,
          tracks.play_count,
          (tracks.duration_ms * tracks.play_count) as total_listening_ms
        FROM tracks
        WHERE tracks.play_count > 0
        ORDER BY tracks.play_count DESC
        LIMIT 10
      `, []),
      this.query(`
        SELECT
          artists.id,
          artists.name,
          artists.artwork_path as artwork_uri,
          COALESCE(SUM(tracks.play_count), 0) as play_count,
          COALESCE(SUM(tracks.duration_ms * tracks.play_count), 0) as total_listening_ms
        FROM artists
        JOIN tracks ON tracks.artist_id = artists.id
        WHERE tracks.play_count > 0
        GROUP BY artists.id
        ORDER BY play_count DESC
        LIMIT 10
      `, []),
      this.query(`
        SELECT
          albums.id,
          albums.title as name,
          albums.artwork_cache_id as artwork_uri,
          COALESCE(SUM(tracks.play_count), 0) as play_count,
          COALESCE(SUM(tracks.duration_ms * tracks.play_count), 0) as total_listening_ms
        FROM albums
        JOIN tracks ON tracks.album_id = albums.id
        WHERE tracks.play_count > 0
        GROUP BY albums.id
        ORDER BY play_count DESC
        LIMIT 10
      `, []),
      this.query(`
        SELECT
          CAST(strftime('%H', started_at / 1000, 'unixepoch', 'localtime') AS INTEGER) as hour,
          COUNT(*) as cnt
        FROM play_history
        GROUP BY hour
        ORDER BY hour
      `, []),
      this.query(`
        SELECT
          CAST(strftime('%w', started_at / 1000, 'unixepoch', 'localtime') AS INTEGER) as dow,
          COUNT(*) as cnt
        FROM play_history
        GROUP BY dow
        ORDER BY dow
      `, []),
      this.queryOne(`
        SELECT COALESCE(
          (SELECT COUNT(*) FROM play_history
           WHERE started_at > 0),
          0
        ) as total_sessions
      `, []),
    ]);

    const totalPlays = this.asNumber(summaryRow ?? {}, 'total_plays');
    const totalListeningMs = this.asNumber(summaryRow ?? {}, 'total_listening_ms');
    const uniqueTracks = this.asNumber(summaryRow ?? {}, 'unique_tracks');
    const uniqueArtists = this.asNumber(summaryRow ?? {}, 'unique_artists');
    const totalSessions = this.asNumber(streakRow ?? {}, 'total_sessions');
    const averageSessionMs = totalSessions > 0 ? Math.round(totalListeningMs / totalSessions) : 0;

    // Build plays-by-hour array (24 slots)
    const playsByHour = new Array(24).fill(0);
    for (const row of hourRows) {
      const hour = this.asNumber(row, 'hour');
      playsByHour[hour] = this.asNumber(row, 'cnt');
    }

    // Build plays-by-day-of-week array (7 slots, 0=Sunday)
    const playsByDayOfWeek = new Array(7).fill(0);
    for (const row of dayRows) {
      const dow = this.asNumber(row, 'dow');
      playsByDayOfWeek[dow] = this.asNumber(row, 'cnt');
    }

    // Calculate longest streak
    const longestStreakDays = await this.calculateLongestStreak();

    return {
      totalTracksPlayed: totalPlays,
      totalListeningMs,
      uniqueTracksPlayed: uniqueTracks,
      uniqueArtistsPlayed: uniqueArtists,
      averageSessionMs,
      longestStreakDays,
      topTracks: topTracksRows.map(row => this.mapTopItem(row)),
      topArtists: topArtistsRows.map(row => this.mapTopItem(row)),
      topAlbums: topAlbumsRows.map(row => this.mapTopItem(row)),
      playsByHour,
      playsByDayOfWeek,
    };
  }

  private mapTopItem(row: DatabaseRow): TopItem {
    return {
      id: this.asString(row, 'id'),
      name: this.asString(row, 'name'),
      artworkUri: this.asNullableString(row, 'artwork_uri'),
      playCount: this.asNumber(row, 'play_count'),
      totalListeningMs: this.asNumber(row, 'total_listening_ms'),
    };
  }

  private async calculateLongestStreak(): Promise<number> {
    const rows = await this.query(`
      SELECT DISTINCT date(started_at / 1000, 'unixepoch', 'localtime') as play_date
      FROM play_history
      ORDER BY play_date
    `, []);

    if (rows.length === 0) return 0;

    let maxStreak = 1;
    let currentStreak = 1;
    const dates = rows.map(r => this.asString(r, 'play_date'));

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return maxStreak;
  }
}
