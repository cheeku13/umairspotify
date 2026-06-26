import { SearchResult } from '@apptypes/index';
import { BaseRepository } from './BaseRepository';
import { TrackRepository } from './TrackRepository';
import { AlbumRepository } from './AlbumRepository';
import { ArtistRepository } from './ArtistRepository';
import { PlaylistRepository } from './PlaylistRepository';
import { trackSelectSql, albumSelectSql, artistSelectSql } from './sql';
import { container } from '../../core/ServiceContainer';

export class SearchRepository extends BaseRepository {
  async search(query: string, limit = 50): Promise<SearchResult> {
    const started = Date.now();
    const trimmed = query.trim();
    if (!trimmed) {
      return { query, tracks: [], albums: [], artists: [], playlists: [], elapsedMs: 0 };
    }

    const ftsQuery = trimmed
      .split(/\s+/)
      .map(token => `${token.replace(/["*]/g, '')}*`)
      .join(' ');
    const likeQuery = `%${trimmed}%`;

    const [trackRows, albumRows, artistRows, playlistRows] = await Promise.all([
      this.query(
        `${trackSelectSql}
         JOIN search_index ON search_index.track_id = tracks.id
         WHERE search_index MATCH ?
         ORDER BY bm25(search_index), tracks.play_count DESC
         LIMIT ?`,
        [ftsQuery, limit],
      ),
      this.query(
        `${albumSelectSql}
         WHERE albums.title LIKE ? OR albums.artist_name LIKE ?
         ORDER BY albums.track_count DESC, albums.title COLLATE NOCASE
         LIMIT ?`,
        [likeQuery, likeQuery, Math.min(limit, 20)],
      ),
      this.query(
        `${artistSelectSql}
         WHERE artists.name LIKE ?
         ORDER BY artists.track_count DESC, artists.name COLLATE NOCASE
         LIMIT ?`,
        [likeQuery, Math.min(limit, 20)],
      ),
      this.query(
        'SELECT * FROM playlists WHERE name LIKE ? ORDER BY updated_at DESC LIMIT ?',
        [likeQuery, Math.min(limit, 20)],
      ),
    ]);

    const trackRepo = container.resolve<TrackRepository>('TrackRepository');
    const albumRepo = container.resolve<AlbumRepository>('AlbumRepository');
    const artistRepo = container.resolve<ArtistRepository>('ArtistRepository');
    const playlistRepo = container.resolve<PlaylistRepository>('PlaylistRepository');

    const playlists = await Promise.all(playlistRows.map(row => playlistRepo.mapPlaylist(row)));

    return {
      query: trimmed,
      tracks: trackRows.map(row => trackRepo.mapTrack(row)),
      albums: albumRows.map(row => albumRepo.mapAlbum(row)),
      artists: artistRows.map(row => artistRepo.mapArtist(row)),
      playlists,
      elapsedMs: Date.now() - started,
    };
  }
}
