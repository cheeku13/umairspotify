import { QueueState, defaultQueueState } from '@appTypes/index';
import { BaseRepository } from './BaseRepository';

export class QueueRepository extends BaseRepository {
  async getQueueState(): Promise<QueueState> {
    const row = await this.queryOne('SELECT * FROM queue_state WHERE id = 1', []);
    if (!row) {
      return defaultQueueState;
    }
    return {
      trackIds: this.parseJsonArray(row.track_ids_json),
      currentIndex: this.asNumber(row, 'current_index'),
      positionMs: this.asNumber(row, 'position_ms'),
      repeatMode: this.asString(row, 'repeat_mode', 'off') as QueueState['repeatMode'],
      shuffleEnabled: this.asBoolean(row, 'shuffle_enabled'),
      shuffledTrackIds: this.parseJsonArray(row.shuffled_track_ids_json),
      seed: this.asNumber(row, 'seed'),
      updatedAt: this.asNumber(row, 'updated_at'),
    };
  }

  async saveQueueState(queue: QueueState): Promise<void> {
    const timestamp = this.now();
    await this.execute(
      `INSERT INTO queue_state (
        id, track_ids_json, current_index, position_ms, repeat_mode, shuffle_enabled,
        shuffled_track_ids_json, seed, created_at, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        track_ids_json = excluded.track_ids_json,
        current_index = excluded.current_index,
        position_ms = excluded.position_ms,
        repeat_mode = excluded.repeat_mode,
        shuffle_enabled = excluded.shuffle_enabled,
        shuffled_track_ids_json = excluded.shuffled_track_ids_json,
        seed = excluded.seed,
        updated_at = excluded.updated_at`,
      [
        JSON.stringify(queue.trackIds),
        queue.currentIndex,
        queue.positionMs,
        queue.repeatMode,
        queue.shuffleEnabled ? 1 : 0,
        JSON.stringify(queue.shuffledTrackIds),
        queue.seed,
        timestamp,
        timestamp,
      ],
    );
  }
}
