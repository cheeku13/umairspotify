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
} from '@appTypes/index';
import TrackPlayer from 'react-native-track-player';
import MMKV from 'react-native-mmkv';
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
  settings: defaultSettings,
  sleepTimer: { active: false, endTime: null, stopAtEndOfTrack: false },
  searchResults: null,
  setInitialized: initialized => set({ initialized }),
  setInitializationError: message => set({ initializationError: message }),
  setLibrary: (tracks, albums, artists, playlists) => set({ tracks, albums, artists, playlists }),
  setLibrarySnapshot: snapshot => set({ librarySnapshot: snapshot }),
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
  })),
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
  setPlayback: playback => set({ playback }),
  patchPlayback: patch => set(state => ({ playback: { ...state.playback, ...patch } })),
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
      playback: { ...state.playback, currentTrackId: track.id, status: 'playing' }
    }));
  }
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
