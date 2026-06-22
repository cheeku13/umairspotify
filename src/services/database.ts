import { Track, Album, Artist, Playlist, QueueState, SearchResult, Settings, LibrarySnapshot, ListeningInsights } from '@appTypes/index';
import { initializeDatabase, getDatabase } from '../database';
import { container } from '../core/ServiceContainer';
import { TrackRepository } from '../database/repositories/TrackRepository';
import { AlbumRepository } from '../database/repositories/AlbumRepository';
import { ArtistRepository } from '../database/repositories/ArtistRepository';
import { PlaylistRepository } from '../database/repositories/PlaylistRepository';
import { SettingsRepository } from '../database/repositories/SettingsRepository';
import { QueueRepository } from '../database/repositories/QueueRepository';
import { SearchRepository } from '../database/repositories/SearchRepository';
import { ArtworkRepository } from '../database/repositories/ArtworkRepository';
import { StatsRepository } from '../database/repositories/StatsRepository';

class DatabaseService {
  async initialize(): Promise<void> {
    initializeDatabase();

    // Register all repositories
    container.register('TrackRepository', new TrackRepository());
    container.register('AlbumRepository', new AlbumRepository());
    container.register('ArtistRepository', new ArtistRepository());
    container.register('PlaylistRepository', new PlaylistRepository());
    container.register('SettingsRepository', new SettingsRepository());
    container.register('QueueRepository', new QueueRepository());
    container.register('SearchRepository', new SearchRepository());
    container.register('ArtworkRepository', new ArtworkRepository());
    container.register('StatsRepository', new StatsRepository());
  }

  // Forwarding methods to maintain compatibility during migration
  async getTracks(limit = 10000, offset = 0): Promise<Track[]> {
    return container.resolve<TrackRepository>('TrackRepository').getTracks(limit, offset);
  }

  async getTrackById(trackId: string): Promise<Track | null> {
    return container.resolve<TrackRepository>('TrackRepository').getTrackById(trackId);
  }

  async upsertTrack(track: Track): Promise<void> {
    return container.resolve<TrackRepository>('TrackRepository').upsertTrack(track);
  }

  async deleteTrack(trackId: string): Promise<void> {
    return container.resolve<TrackRepository>('TrackRepository').deleteTrack(trackId);
  }

  async search(query: string, limit = 50): Promise<SearchResult> {
    return container.resolve<SearchRepository>('SearchRepository').search(query, limit);
  }

  async searchLibraryTracks(
    query: string,
    sortBy: 'dateAdded' | 'title' | 'artist' | 'duration',
    filterBy: 'all' | 'favorites' | 'downloaded',
    limit: number = 10000,
    offset: number = 0
  ): Promise<Track[]> {
    return container.resolve<TrackRepository>('TrackRepository').searchLibraryTracks(query, sortBy, filterBy, limit, offset);
  }

  async getLibrarySnapshot(): Promise<LibrarySnapshot> {
    const trackRepo = container.resolve<TrackRepository>('TrackRepository');
    const artistRepo = container.resolve<ArtistRepository>('ArtistRepository');
    const albumRepo = container.resolve<AlbumRepository>('AlbumRepository');

    const [recentlyAdded, recentlyPlayed, favoriteTracks, topArtists, suggestedAlbums] = await Promise.all([
      trackRepo.getTracks(20, 0), // Will need actual date_added sort, but getTracks already does that
      trackRepo.getTracks(20, 0), // Needs recently played method, but getTracks is fine for now
      trackRepo.getFavorites(20),
      artistRepo.getArtists().then(artists => artists.slice(0, 12)),
      albumRepo.getAlbums().then(albums => albums.slice(0, 12)),
    ]);

    return { recentlyAdded, recentlyPlayed, topArtists, favoriteTracks, suggestedAlbums };
  }

  async getAlbums(): Promise<Album[]> {
    return container.resolve<AlbumRepository>('AlbumRepository').getAlbums();
  }

  async getArtists(): Promise<Artist[]> {
    return container.resolve<ArtistRepository>('ArtistRepository').getArtists();
  }

  async getFavorites(limit = 10000): Promise<Track[]> {
    return container.resolve<TrackRepository>('TrackRepository').getFavorites(limit);
  }

  async setFavorite(trackId: string, favorite: boolean): Promise<void> {
    return container.resolve<TrackRepository>('TrackRepository').setFavorite(trackId, favorite);
  }

  async getPlaylists(): Promise<Playlist[]> {
    return container.resolve<PlaylistRepository>('PlaylistRepository').getPlaylists();
  }

  async createPlaylist(name: string, description = '', isSmart = false, smartRules: import('@appTypes/index').SmartRule[] = []): Promise<Playlist> {
    return container.resolve<PlaylistRepository>('PlaylistRepository').createPlaylist(name, description, isSmart, smartRules);
  }

  async replacePlaylistTracks(playlistId: string, trackIds: string[]): Promise<void> {
    return container.resolve<PlaylistRepository>('PlaylistRepository').replacePlaylistTracks(playlistId, trackIds);
  }

  async getSmartPlaylistTracks(playlistId: string): Promise<Track[]> {
    return container.resolve<PlaylistRepository>('PlaylistRepository').getSmartPlaylistTracks(playlistId);
  }

  async getQueueState(): Promise<QueueState> {
    return container.resolve<QueueRepository>('QueueRepository').getQueueState();
  }

  async saveQueueState(queue: QueueState): Promise<void> {
    return container.resolve<QueueRepository>('QueueRepository').saveQueueState(queue);
  }

  async getSettings(): Promise<Settings> {
    return container.resolve<SettingsRepository>('SettingsRepository').getSettings();
  }

  async setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    return container.resolve<SettingsRepository>('SettingsRepository').setSetting(key, value);
  }

  async getListeningInsights(): Promise<ListeningInsights> {
    return container.resolve<StatsRepository>('StatsRepository').getListeningInsights();
  }

  async close(): Promise<void> {
    // getDatabase().close()
  }
}

export const databaseService = new DatabaseService();
