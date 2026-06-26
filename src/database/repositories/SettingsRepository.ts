import { Settings, defaultSettings } from '@apptypes/index';
import { BaseRepository } from './BaseRepository';

export class SettingsRepository extends BaseRepository {
  async getSettings(): Promise<Settings> {
    const rows = await this.query('SELECT key, value_json FROM settings', []);
    const settings = { ...defaultSettings };
    rows.forEach(row => {
      const key = this.asString(row, 'key') as keyof Settings;
      if (key in settings) {
        settings[key] = JSON.parse(this.asString(row, 'value_json')) as never;
      }
    });
    return settings;
  }

  async setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    const timestamp = this.now();
    const valueType = typeof value === 'object' ? 'json' : typeof value;
    await this.execute(
      `INSERT INTO settings (key, value_json, value_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, value_type = excluded.value_type, updated_at = excluded.updated_at`,
      [key, JSON.stringify(value), valueType, timestamp, timestamp],
    );
  }
}
