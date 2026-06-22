import { getDatabase } from '../../database';

export type DatabaseValue = string | number | boolean | null;
export type DatabaseRow = Record<string, DatabaseValue>;

export class BaseRepository {
  protected async execute(sql: string, params: DatabaseValue[] = []): Promise<void> {
    const db = getDatabase();
    await db.executeAsync(sql, params as any);
  }

  protected async query(sql: string, params: DatabaseValue[] = []): Promise<DatabaseRow[]> {
    const db = getDatabase();
    const result = await db.executeAsync(sql, params as any);
    return (result.rows?._array as DatabaseRow[]) || [];
  }

  protected async queryOne(sql: string, params: DatabaseValue[] = []): Promise<DatabaseRow | null> {
    const db = getDatabase();
    const result = await db.executeAsync(sql, params as any);
    return result.rows?.length ? (result.rows.item(0) as DatabaseRow) : null;
  }

  protected async transaction(statements: Array<{ sql: string; params: DatabaseValue[] }>): Promise<void> {
    const db = getDatabase();
    await db.transactionAsync(async (tx: any) => {
      for (const stmt of statements) {
        await tx.executeAsync(stmt.sql, stmt.params as any);
      }
    });
  }

  protected now(): number {
    return Date.now();
  }

  protected asString(row: DatabaseRow, key: string, fallback = ''): string {
    const value = row[key];
    return typeof value === 'string' ? value : fallback;
  }

  protected asNumber(row: DatabaseRow, key: string, fallback = 0): number {
    const value = row[key];
    return typeof value === 'number' ? value : fallback;
  }

  protected asNullableNumber(row: DatabaseRow, key: string): number | null {
    const value = row[key];
    return typeof value === 'number' ? value : null;
  }

  protected asNullableString(row: DatabaseRow, key: string): string | null {
    const value = row[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  protected asBoolean(row: DatabaseRow, key: string): boolean {
    return row[key] === 1 || row[key] === true;
  }

  protected parseJsonArray(value: DatabaseValue): string[] {
    if (typeof value !== 'string') {
      return [];
    }
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
}
