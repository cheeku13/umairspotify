export type RepeatMode = 'off' | 'one' | 'all';
export type ImportStatus = 'pending' | 'ready' | 'failed' | 'unsupported';
export type SettingValueType = 'string' | 'number' | 'boolean' | 'json';
export type ThemeMode = 'system' | 'dark' | 'light';
export type SortDirection = 'asc' | 'desc';
export type LibraryTab = 'songs' | 'albums' | 'artists' | 'playlists' | 'folders';

export interface ServiceError {
  code: string;
  message: string;
  recoverable: boolean;
  cause?: string;
}

export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: ServiceError;
}

export interface Track {
  id: string;
  sourceId: string;
  fileUri: string;
  localFilePath: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  title: string;
  sortTitle: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  albumArtistName: string | null;
  trackNumber: number | null;
  discNumber: number | null;
  durationMs: number;
  bitrate: number | null;
  sampleRate: number | null;
  artworkCacheId: string | null;
  artworkUri: string | null;
  dateAdded: number;
  dateModified: number;
  lastPlayedAt: number | null;
  playCount: number;
  importStatus: ImportStatus;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Album {
  id: string;
  title: string;
  normalizedTitle: string;
  artistId: string;
  artistName: string;
  artworkCacheId: string | null;
  artworkUri: string | null;
  releaseYear: number | null;
  trackCount: number;
  durationMs: number;
  createdAt: number;
  updatedAt: number;
}

export interface Artist {
  id: string;
  name: string;
  normalizedName: string;
  artworkUri: string | null;
  trackCount: number;
  albumCount: number;
  createdAt: number;
  updatedAt: number;
}

export type SmartOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not_contains';

export interface SmartRule {
  field: 'playCount' | 'addedAt' | 'lastPlayedAt' | 'durationMs' | 'artistName' | 'albumTitle' | 'isFavorite';
  operator: SmartOperator;
  value: string | number | boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  trackCount: number;
  durationMs: number;
  isSmart: boolean;
  smartRules: SmartRule[];
  createdAt: number;
  updatedAt: number;
}

export interface QueueItem {
  id: string;
  trackId: string;
  track: Track;
  position: number;
  queuedAt: number;
}

export interface QueueState {
  trackIds: string[];
  currentIndex: number;
  positionMs: number;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  shuffledTrackIds: string[];
  seed: number;
  updatedAt: number;
}

export interface PlaybackState {
  status: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';
  currentTrackId: string | null;
  positionMs: number;
  durationMs: number;
  bufferedMs: number;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  error: ServiceError | null;
}

export interface SleepTimerState {
  active: boolean;
  endTime: number | null; // Timestamp when it should fire
  stopAtEndOfTrack: boolean; // If true, pause at end of current track
  remainingMs: number | null; // Remaining time in ms for display
}

export interface SearchResult {
  query: string;
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  elapsedMs: number;
}

export interface ArtworkCache {
  id: string;
  sourceTrackId: string | null;
  albumId: string | null;
  originalPath: string | null;
  cachedPath: string;
  thumbnailPath: string;
  mimeType: string;
  width: number;
  height: number;
  byteSize: number;
  contentHash: string;
  lastAccessedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  backgroundPlaybackEnabled: boolean;
  lockScreenControlsEnabled: boolean;
  artworkCacheEnabled: boolean;
  cacheLimitMb: number;
  themeMode: ThemeMode;
  searchDebounceMs: number;
  librarySortField: 'dateAdded' | 'title' | 'artist' | 'album' | 'duration';
  librarySortDirection: SortDirection;
}

export interface PlayHistoryEntry {
  id: string;
  trackId: string;
  startedAt: number;
  completedAt: number | null;
  positionMs: number;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ImportCandidate {
  fileUri: string;
  localFilePath: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  dateModified: number;
}

export interface ExtractedMetadata {
  title: string;
  artistName: string;
  albumTitle: string;
  albumArtistName: string | null;
  trackNumber: number | null;
  discNumber: number | null;
  durationMs: number;
  bitrate: number | null;
  sampleRate: number | null;
  releaseYear: number | null;
  artworkPath: string | null;
}

export interface LibrarySnapshot {
  recentlyAdded: Track[];
  recentlyPlayed: Track[];
  topArtists: Artist[];
  favoriteTracks: Track[];
  suggestedAlbums: Album[];
}

export interface TopItem {
  id: string;
  name: string;
  artworkUri: string | null;
  playCount: number;
  totalListeningMs: number;
}

export interface ListeningInsights {
  totalTracksPlayed: number;
  totalListeningMs: number;
  uniqueTracksPlayed: number;
  uniqueArtistsPlayed: number;
  averageSessionMs: number;
  longestStreakDays: number;
  topTracks: TopItem[];
  topArtists: TopItem[];
  topAlbums: TopItem[];
  playsByHour: number[];      // 24 entries, index=hour 0-23
  playsByDayOfWeek: number[]; // 7 entries, index=0=Sunday
}

export const defaultQueueState: QueueState = {
  trackIds: [],
  currentIndex: 0,
  positionMs: 0,
  repeatMode: 'off',
  shuffleEnabled: false,
  shuffledTrackIds: [],
  seed: 0,
  updatedAt: 0,
};

export const defaultSettings: Settings = {
  backgroundPlaybackEnabled: true,
  lockScreenControlsEnabled: true,
  artworkCacheEnabled: true,
  cacheLimitMb: 512,
  themeMode: 'system',
  searchDebounceMs: 180,
  librarySortField: 'dateAdded',
  librarySortDirection: 'desc',
};
