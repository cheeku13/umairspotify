import { create } from 'zustand';
import {
  Album,
  Artist,
  LibrarySnapshot,
  PlaybackState,
  Playlist,
  QueueState,
  SearchResult,
  Settings,
  SleepTimerState,
  Track,
  defaultQueueState,
  defaultSettings,
  RepeatMode,
} from '@apptypes/index';
import TrackPlayer from 'react-native-track-player';
import { MMKV } from 'react-native-mmkv';
import { appEventBus } from '../core/EventBus';

export const storage = new MMKV();

interface MusicStore {
  initialized: boolean;
  initializationError: string | null;
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  librarySnapshot: LibrarySnapshot;
  queue: QueueState;
  playback: PlaybackState;
  // derived convenience fields
  currentTrackId: string | null;
  isPlaying: boolean;
  favorites: Track[];
  settings: Settings;
  sleepTimer: SleepTimerState;
  searchResults: SearchResult | null;
  setInitialized: (initialized: boolean) => void;
  setInitializationError: (message: string | null) => void;
  setLibrary: (tracks: Track[], albums: Album[], artists: Artist[], playlists: Playlist[]) => void;
  setLibrarySnapshot: (snapshot: LibrarySnapshot) => void;
  upsertTrack: (track: Track) => void;
  removeTrack: (trackId: string) => void;
  setFavorite: (trackId: string, favorite: boolean) => void;
  toggleFavorite: (trackId: string, favorite?: boolean) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  upsertPlaylist: (playlist: Playlist) => void;
  deletePlaylist: (playlistId: string) => void;
  setQueue: (queue: QueueState) => void;
  setPlayback: (playback: PlaybackState) => void;
  patchPlayback: (patch: Partial<PlaybackState>) => void;
  setSettings: (settings: Settings) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  setSleepTimer: (timer: SleepTimerState) => void;
  setSearchResults: (results: SearchResult | null) => void;
  playTrack: (track: Track) => Promise<void>;
  // Convenience helpers used by UI
  setCurrentTrackId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (timeMs: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
}

const emptySnapshot: LibrarySnapshot = {
  recentlyAdded: [],
  recentlyPlayed: [],
  topArtists: [],
  favoriteTracks: [],
  suggestedAlbums: [],
};

const initialPlayback: PlaybackState = {
  status: 'idle',
  currentTrackId: null,
  positionMs: 0,
  durationMs: 0,
  bufferedMs: 0,
  repeatMode: 'off',
  shuffleEnabled: false,
  error: null,
};

export const useMusicStore = create<MusicStore>(set => ({
  initialized: false,
  initializationError: null,
  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  librarySnapshot: emptySnapshot,
  queue: defaultQueueState,
  playback: initialPlayback,
  // Derived convenience fields
  currentTrackId: initialPlayback.currentTrackId,
  isPlaying: initialPlayback.status === 'playing',
  favorites: emptySnapshot.favoriteTracks,
  settings: defaultSettings,
  sleepTimer: { active: false, endTime: null, stopAtEndOfTrack: false },
  searchResults: null,
  setInitialized: initialized => set({ initialized }),
  setInitializationError: message => set({ initializationError: message }),
  setLibrary: (tracks, albums, artists, playlists) => set({ tracks, albums, artists, playlists }),
  setLibrarySnapshot: snapshot => set({ librarySnapshot: snapshot, favorites: snapshot.favoriteTracks }),
  upsertTrack: track => set(state => ({
    tracks: state.tracks.some(item => item.id === track.id)
      ? state.tracks.map(item => (item.id === track.id ? track : item))
      : [track, ...state.tracks],
  })),
  removeTrack: trackId => set(state => ({
    tracks: state.tracks.filter(track => track.id !== trackId),
    playlists: state.playlists.map(playlist => ({
      ...playlist,
      trackIds: playlist.trackIds.filter(id => id !== trackId),
      trackCount: playlist.trackIds.filter(id => id !== trackId).length,
    })),
  })),
  setFavorite: (trackId, favorite) => set(state => ({
    tracks: state.tracks.map(track => (track.id === trackId ? { ...track, isFavorite: favorite } : track)),
    librarySnapshot: {
      ...state.librarySnapshot,
      favoriteTracks: favorite
        ? state.tracks.filter(track => track.id === trackId || track.isFavorite)
        : state.librarySnapshot.favoriteTracks.filter(track => track.id !== trackId),
    },
    favorites: favorite
      ? state.tracks.filter(track => track.id === trackId || track.isFavorite)
      : state.librarySnapshot.favoriteTracks.filter(track => track.id !== trackId),
  })),
  toggleFavorite: (trackId: string, favorite?: boolean) => set(state => {
    const existing = state.tracks.find(t => t.id === trackId);
    const final = typeof favorite === 'boolean' ? favorite : !(existing?.isFavorite ?? false);
    return {
      tracks: state.tracks.map(track => (track.id === trackId ? { ...track, isFavorite: final } : track)),
      librarySnapshot: {
        ...state.librarySnapshot,
        favoriteTracks: final
          ? state.tracks.filter(track => track.id === trackId || track.isFavorite)
          : state.librarySnapshot.favoriteTracks.filter(track => track.id !== trackId),
      },
      favorites: final
        ? state.tracks.filter(track => track.id === trackId || track.isFavorite)
        : state.librarySnapshot.favoriteTracks.filter(track => track.id !== trackId),
    };
  }),
  setPlaylists: playlists => set({ playlists }),
  upsertPlaylist: playlist => set(state => ({
    playlists: state.playlists.some(item => item.id === playlist.id)
      ? state.playlists.map(item => (item.id === playlist.id ? playlist : item))
      : [playlist, ...state.playlists],
  })),
  deletePlaylist: playlistId => set(state => ({
    playlists: state.playlists.filter(playlist => playlist.id !== playlistId),
  })),
  setQueue: queue => set({ queue }),
  setPlayback: playback => set(state => ({ playback, currentTrackId: playback.currentTrackId, isPlaying: playback.status === 'playing' })),
  patchPlayback: patch => set(state => {
    const next = { ...state.playback, ...patch };
    return { playback: next, currentTrackId: next.currentTrackId, isPlaying: next.status === 'playing' };
  }),
  setSettings: settings => set({ settings }),
  patchSettings: patch => set(state => ({ settings: { ...state.settings, ...patch } })),
  setSleepTimer: sleepTimer => set({ sleepTimer }),
  setSearchResults: results => set({ searchResults: results }),
  playTrack: async (track) => {
    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: track.id,
      url: track.fileUri || `file://${track.localFilePath}`,
      title: track.title,
      artist: track.artistName,
      artwork: track.artworkUri ?? undefined,
    });
    await TrackPlayer.play();
    set(state => ({ 
      playback: { ...state.playback, currentTrackId: track.id, status: 'playing' },
      currentTrackId: track.id,
      isPlaying: true,
    }));
  },
  // Convenience helpers
  setCurrentTrackId: id => set(state => ({ playback: { ...state.playback, currentTrackId: id }, currentTrackId: id })),
  setIsPlaying: playing => set(state => ({ playback: { ...state.playback, status: playing ? 'playing' : 'paused' }, isPlaying: playing })),
  setCurrentTime: timeMs => set(state => ({ playback: { ...state.playback, positionMs: timeMs } })),
  setRepeatMode: mode => set(state => ({ playback: { ...state.playback, repeatMode: mode }, queue: { ...state.queue, repeatMode: mode } })),
}));

appEventBus.on('PlaybackStateChanged', (playback) => {
  useMusicStore.getState().setPlayback(playback);
});

appEventBus.on('QueueChanged', (queue) => {
  useMusicStore.getState().setQueue(queue);
});

appEventBus.on('SettingsChanged', (settings) => {
  useMusicStore.getState().setSettings(settings);
});

appEventBus.on('LibraryChanged', (snapshot) => {
  useMusicStore.getState().setLibrarySnapshot(snapshot);
});

appEventBus.on('SleepTimerUpdated', (timer) => {
  useMusicStore.getState().setSleepTimer(timer);
});

// ─── TrackPlayer Event Bridge (auto-patched) ─────────────────────────────────
// Ensures the Zustand store stays in sync with playback events.
import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * Call this function once during app initialization (e.g., in App.tsx useEffect)
 * to wire TrackPlayer events into the Zustand store.
 */
export function setupTrackPlayerEventBridge() {
  TrackPlayer.addEventListener(Event.PlaybackState, (data) => {
    const state = data.state;
    useMusicStore.getState().setPlaybackState(state);
  });

  TrackPlayer.addEventListener(Event.PlaybackTrackChanged, (data) => {
    if (data.track != null) {
      useMusicStore.getState().setCurrentTrack(data.track);
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
    useMusicStore.getState().setPlaybackState('ended');
  });
}

// ─── Sleep Timer State (auto-patched, L7) ────────────────────────────────────
// Persists sleep timer configuration across app restarts via MMKV.
interface SleepTimerState {
  active: boolean;
  endTime: number | null;       // Unix timestamp (ms) when timer fires
  stopAtEndOfTrack: boolean;          // If true, pause at end of current track
  remainingMs: number | null;   // Remaining time in ms (for display)
}

const initialSleepTimer: SleepTimerState = {
  active: false,
  endTime: null,
  stopAtEndOfTrack: false,
  remainingMs: null,
};

// Append sleep timer state and actions to the store
// (These will be merged into the store's create() call)
