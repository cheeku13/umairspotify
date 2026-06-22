import TrackPlayer, { Capability, Event, RepeatMode as NativeRepeatMode, State, AppKilledPlaybackBehavior } from 'react-native-track-player';
import MMKV from 'react-native-mmkv';
import { PlaybackState, RepeatMode, Track } from '@appTypes/index';
import { appEventBus } from '../core/EventBus';
const initialPlaybackState: PlaybackState = {
  status: 'idle',
  currentTrackId: null,
  positionMs: 0,
  durationMs: 0,
  bufferedMs: 0,
  repeatMode: 'off',
  shuffleEnabled: false,
  error: null,
};

class PlayerService {
  private playbackState: PlaybackState = initialPlaybackState;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
      maxCacheSize: 1024 * 10,
    });

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SeekTo,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SeekTo,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
    });

    TrackPlayer.addEventListener(Event.PlaybackState, event => {
      this.setPlaybackState({
        status: this.mapNativeState(event.state),
      });
    });

    TrackPlayer.addEventListener(Event.PlaybackError, event => {
      this.setPlaybackState({
        status: 'error',
        error: {
          code: event.code,
          message: event.message,
          recoverable: true,
        },
      });
    });

    TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async event => {
      const track = event.track;
      this.setPlaybackState({
        currentTrackId: typeof track?.id === 'string' ? track.id : null,
        durationMs: typeof track?.duration === 'number' ? Math.round(track.duration * 1000) : 0,
        positionMs: 0,
      });

      if (this.stopAtEndOfTrack) {
        await this.pause();
        this.clearSleepTimer();
      }
    });

    this.initialized = true;
  }

  private sleepTimerTimeout: ReturnType<typeof setTimeout> | null = null;
  private stopAtEndOfTrack = false;

  setSleepTimer(durationMs: number | null, stopAtEndOfTrack = false): void {
    this.clearSleepTimer();
    
    this.stopAtEndOfTrack = stopAtEndOfTrack;
    
    if (durationMs !== null) {
      this.sleepTimerTimeout = setTimeout(() => {
        void this.pause();
        this.clearSleepTimer();
      }, durationMs);
    }
    
    appEventBus.emit('SleepTimerUpdated', {
      active: durationMs !== null || stopAtEndOfTrack,
      endTime: durationMs !== null ? Date.now() + durationMs : null,
      stopAtEndOfTrack,
    });
  }

  clearSleepTimer(): void {
    if (this.sleepTimerTimeout) {
      clearTimeout(this.sleepTimerTimeout);
      this.sleepTimerTimeout = null;
    }
    this.stopAtEndOfTrack = false;
    appEventBus.emit('SleepTimerUpdated', {
      active: false,
      endTime: null,
      stopAtEndOfTrack: false,
    });
  }



  async loadQueue(tracks: Track[], startIndex: number, positionMs = 0): Promise<void> {
    await this.ensureInitialized();
    await TrackPlayer.reset();
    await TrackPlayer.add(
      tracks.map(track => ({
        id: track.id,
        url: track.fileUri || `file://${track.localFilePath}`,
        title: track.title,
        artist: track.artistName,
        album: track.albumTitle,
        duration: track.durationMs / 1000,
        artwork: track.artworkUri ?? undefined,
      })),
    );
    if (tracks[startIndex]) {
      await TrackPlayer.skip(startIndex, positionMs / 1000);
      this.setPlaybackState({
        currentTrackId: tracks[startIndex].id,
        durationMs: tracks[startIndex].durationMs,
        positionMs,
        status: 'ready',
      });
    }
  }

  async play(): Promise<void> {
    await this.ensureInitialized();
    await TrackPlayer.play();
    this.setPlaybackState({ status: 'playing' });
  }

  async pause(): Promise<void> {
    await this.ensureInitialized();
    await TrackPlayer.pause();
    this.setPlaybackState({ status: 'paused' });
  }

  async resume(): Promise<void> {
    await this.play();
  }

  async stop(): Promise<void> {
    await this.ensureInitialized();
    await TrackPlayer.stop();
    this.setPlaybackState({ status: 'idle', positionMs: 0 });
  }

  async seek(positionMs: number): Promise<void> {
    await this.ensureInitialized();
    const seconds = Math.max(0, positionMs / 1000);
    await TrackPlayer.seekTo(seconds);
    this.setPlaybackState({ positionMs: Math.round(seconds * 1000) });
  }

  async next(): Promise<void> {
    await this.ensureInitialized();
    await TrackPlayer.skipToNext();
  }

  async previous(): Promise<void> {
    await this.ensureInitialized();
    await TrackPlayer.skipToPrevious();
  }

  async setRepeatMode(mode: RepeatMode): Promise<void> {
    await this.ensureInitialized();
    const nativeMode = mode === 'one'
      ? NativeRepeatMode.Track
      : mode === 'all'
        ? NativeRepeatMode.Queue
        : NativeRepeatMode.Off;
    await TrackPlayer.setRepeatMode(nativeMode);
    this.setPlaybackState({ repeatMode: mode });
  }

  async setPlaybackRate(rate: number): Promise<void> {
    if (rate < 0.5 || rate > 2) {
      throw new Error('Playback rate must be between 0.5 and 2.0');
    }
    await this.ensureInitialized();
    await TrackPlayer.setRate(rate);
  }

  async refreshProgress(): Promise<PlaybackState> {
    await this.ensureInitialized();
    const progress = await TrackPlayer.getProgress();
    this.setPlaybackState({
      positionMs: Math.round(progress.position * 1000),
      durationMs: Math.round(progress.duration * 1000),
      bufferedMs: Math.round(progress.buffered * 1000),
    });
    return this.playbackState;
  }

  getState(): PlaybackState {
    return this.playbackState;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private setPlaybackState(patch: Partial<PlaybackState>): void {
    this.playbackState = { ...this.playbackState, ...patch };
    appEventBus.emit('PlaybackStateChanged', this.playbackState);
  }

  private mapNativeState(state: State): PlaybackState['status'] {
    if (state === State.Playing) {
      return 'playing';
    }
    if (state === State.Paused) {
      return 'paused';
    }
    if (state === State.Buffering) {
      return 'buffering';
    }
    if (state === State.Loading) {
      return 'loading';
    }
    if (state === State.Ended) {
      return 'ended';
    }
    return 'ready';
  }
}

export const playerService = new PlayerService();
