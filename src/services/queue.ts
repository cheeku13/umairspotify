import { QueueState, RepeatMode, defaultQueueState } from '@appTypes/index';
import { databaseService } from './database';
import { appEventBus } from '../core/EventBus';

class QueueService {
  private queue: QueueState = defaultQueueState;
  private persistPromise: Promise<void> = Promise.resolve();

  async initialize(): Promise<QueueState> {
    this.queue = await databaseService.getQueueState();
    return this.getQueue();
  }

  async setQueue(trackIds: string[], startIndex = 0, positionMs = 0): Promise<QueueState> {
    this.queue = {
      ...this.queue,
      trackIds: [...trackIds],
      currentIndex: this.clampIndex(startIndex, trackIds.length),
      positionMs,
      shuffledTrackIds: this.queue.shuffleEnabled ? this.shuffle(trackIds, this.queue.seed) : [],
      updatedAt: Date.now(),
    };
    await this.persist();
    return this.getQueue();
  }

  async addTrack(trackId: string): Promise<QueueState> {
    return this.addTracks([trackId]);
  }

  async addTracks(trackIds: string[]): Promise<QueueState> {
    const nextTrackIds = [...this.queue.trackIds, ...trackIds];
    this.queue = {
      ...this.queue,
      trackIds: nextTrackIds,
      shuffledTrackIds: this.queue.shuffleEnabled ? this.shuffle(nextTrackIds, this.queue.seed) : [],
      updatedAt: Date.now(),
    };
    await this.persist();
    return this.getQueue();
  }

  async removeTrack(index: number): Promise<QueueState> {
    this.assertIndex(index);
    const currentTrackId = this.getCurrentTrackId();
    const nextTrackIds = this.queue.trackIds.filter((_, itemIndex) => itemIndex !== index);
    const nextIndex = currentTrackId ? Math.max(0, nextTrackIds.indexOf(currentTrackId)) : 0;
    this.queue = {
      ...this.queue,
      trackIds: nextTrackIds,
      currentIndex: nextIndex === -1 ? this.clampIndex(index, nextTrackIds.length) : nextIndex,
      shuffledTrackIds: this.queue.shuffleEnabled ? this.shuffle(nextTrackIds, this.queue.seed) : [],
      updatedAt: Date.now(),
    };
    await this.persist();
    return this.getQueue();
  }

  async moveTrack(fromIndex: number, toIndex: number): Promise<QueueState> {
    this.assertIndex(fromIndex);
    this.assertIndex(toIndex);
    const currentTrackId = this.getCurrentTrackId();
    const nextTrackIds = [...this.queue.trackIds];
    const [movedTrack] = nextTrackIds.splice(fromIndex, 1);
    nextTrackIds.splice(toIndex, 0, movedTrack);
    this.queue = {
      ...this.queue,
      trackIds: nextTrackIds,
      currentIndex: currentTrackId ? nextTrackIds.indexOf(currentTrackId) : 0,
      shuffledTrackIds: this.queue.shuffleEnabled ? this.shuffle(nextTrackIds, this.queue.seed) : [],
      updatedAt: Date.now(),
    };
    await this.persist();
    return this.getQueue();
  }

  async clearQueue(): Promise<QueueState> {
    this.queue = { ...defaultQueueState, updatedAt: Date.now() };
    await this.persist();
    return this.getQueue();
  }

  async setCurrentIndex(index: number): Promise<QueueState> {
    this.assertIndex(index);
    this.queue = { ...this.queue, currentIndex: index, positionMs: 0, updatedAt: Date.now() };
    await this.persist();
    return this.getQueue();
  }

  async setPosition(positionMs: number): Promise<QueueState> {
    this.queue = { ...this.queue, positionMs: Math.max(0, positionMs), updatedAt: Date.now() };
    await this.persist();
    return this.getQueue();
  }

  async setRepeatMode(repeatMode: RepeatMode): Promise<QueueState> {
    this.queue = { ...this.queue, repeatMode, updatedAt: Date.now() };
    await this.persist();
    return this.getQueue();
  }

  async toggleShuffle(): Promise<QueueState> {
    const enabled = !this.queue.shuffleEnabled;
    const seed = enabled ? Date.now() : this.queue.seed;
    this.queue = {
      ...this.queue,
      shuffleEnabled: enabled,
      seed,
      shuffledTrackIds: enabled ? this.shuffle(this.queue.trackIds, seed) : [],
      updatedAt: Date.now(),
    };
    await this.persist();
    return this.getQueue();
  }

  getNextTrackIndex(): number | null {
    if (this.queue.trackIds.length === 0) {
      return null;
    }
    if (this.queue.repeatMode === 'one') {
      return this.queue.currentIndex;
    }
    const nextIndex = this.queue.currentIndex + 1;
    if (nextIndex < this.queue.trackIds.length) {
      return nextIndex;
    }
    return this.queue.repeatMode === 'all' ? 0 : null;
  }

  getPreviousTrackIndex(): number | null {
    if (this.queue.trackIds.length === 0) {
      return null;
    }
    if (this.queue.currentIndex > 0) {
      return this.queue.currentIndex - 1;
    }
    return this.queue.repeatMode === 'all' ? this.queue.trackIds.length - 1 : null;
  }

  getCurrentTrackId(): string | null {
    return this.queue.trackIds[this.queue.currentIndex] ?? null;
  }

  getQueue(): QueueState {
    return {
      ...this.queue,
      trackIds: [...this.queue.trackIds],
      shuffledTrackIds: [...this.queue.shuffledTrackIds],
    };
  }

  private async persist(): Promise<void> {
    appEventBus.emit('QueueChanged', this.getQueue());
    this.persistPromise = this.persistPromise.then(() => databaseService.saveQueueState(this.queue));
    await this.persistPromise;
  }

  private assertIndex(index: number): void {
    if (index < 0 || index >= this.queue.trackIds.length) {
      throw new Error('Queue index is out of bounds');
    }
  }

  private clampIndex(index: number, length: number): number {
    if (length === 0) {
      return 0;
    }
    return Math.min(Math.max(0, index), length - 1);
  }

  private shuffle(trackIds: string[], seed: number): string[] {
    const currentTrackId = this.getCurrentTrackId();
    const remaining = trackIds.filter(trackId => trackId !== currentTrackId);
    let state = seed || 1;
    for (let index = remaining.length - 1; index > 0; index -= 1) {
      state = (state * 1664525 + 1013904223) >>> 0;
      const swapIndex = state % (index + 1);
      [remaining[index], remaining[swapIndex]] = [remaining[swapIndex], remaining[index]];
    }
    return currentTrackId ? [currentTrackId, ...remaining] : remaining;
  }
}

export const queueService = new QueueService();
