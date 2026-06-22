import EventEmitter from 'eventemitter3';
import { Track, PlaybackState, QueueState, LibrarySnapshot, Settings } from '@appTypes/index';

export interface AppEvents {
  TrackChanged: (track: Track | null) => void;
  PlaybackStateChanged: (state: PlaybackState) => void;
  QueueChanged: (queue: QueueState) => void;
  LibraryChanged: (snapshot: LibrarySnapshot) => void;
  SettingsChanged: (settings: Settings) => void;
  SleepTimerUpdated: (state: import('@appTypes/index').SleepTimerState) => void;
  LibraryImportStarted: () => void;
  LibraryImportProgress: (progress: number) => void;
  LibraryImportComplete: (data: { totalProcessed: number }) => void;
  ErrorOccurred: (error: Error) => void;
}

class EventBus extends EventEmitter<AppEvents> {
  // Singleton instance
  private static instance: EventBus;

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
}

export const appEventBus = EventBus.getInstance();
