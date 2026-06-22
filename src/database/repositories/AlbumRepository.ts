import { Album } from '@appTypes/index';
import { BaseRepository, DatabaseRow } from './BaseRepository';
import { albumSelectSql } from './sql';

export class AlbumRepository extends BaseRepository {
  async getAlbums(): Promise<Album[]> {
    const rows = await this.query(`${albumSelectSql} ORDER BY albums.title COLLATE NOCASE`, []);
    return rows.map(row => this.mapAlbum(row));
  }

  public mapAlbum(row: DatabaseRow): Album {
    return {
      id: this.asString(row, 'id'),
      title: this.asString(row, 'title'),
      normalizedTitle: this.asString(row, 'normalized_title'),
      artistId: this.asString(row, 'artist_id'),
      artistName: this.asString(row, 'artist_name'),
      artworkCacheId: this.asNullableString(row, 'artwork_cache_id'),
      artworkUri: this.asNullableString(row, 'artwork_uri'),
      releaseYear: this.asNullableNumber(row, 'release_year'),
      trackCount: this.asNumber(row, 'track_count'),
      durationMs: this.asNumber(row, 'duration_ms'),
      createdAt: this.asNumber(row, 'created_at'),
      updatedAt: this.asNumber(row, 'updated_at'),
    };
  }
}
