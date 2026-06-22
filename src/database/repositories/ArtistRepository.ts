import { Artist } from '@appTypes/index';
import { BaseRepository, DatabaseRow } from './BaseRepository';
import { artistSelectSql } from './sql';

export class ArtistRepository extends BaseRepository {
  async getArtists(): Promise<Artist[]> {
    const rows = await this.query(`${artistSelectSql} ORDER BY artists.name COLLATE NOCASE`, []);
    return rows.map(row => this.mapArtist(row));
  }

  public mapArtist(row: DatabaseRow): Artist {
    return {
      id: this.asString(row, 'id'),
      name: this.asString(row, 'name'),
      normalizedName: this.asString(row, 'normalized_name'),
      artworkUri: this.asNullableString(row, 'artwork_uri'),
      trackCount: this.asNumber(row, 'track_count'),
      albumCount: this.asNumber(row, 'album_count'),
      createdAt: this.asNumber(row, 'created_at'),
      updatedAt: this.asNumber(row, 'updated_at'),
    };
  }
}
