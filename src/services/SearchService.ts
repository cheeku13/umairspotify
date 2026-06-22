import { getDatabase } from '../database';
import { SearchResult } from '@appTypes/index';

export class SearchService {
  static search(query: string, limit = 50): SearchResult {
    const started = Date.now();
    const trimmed = query.trim();
    if (!trimmed) {
      return { query, tracks: [], albums: [], artists: [], playlists: [], elapsedMs: 0 };
    }

    const ftsQuery = trimmed
      .split(/\s+/)
      .map(token => `"${token.replace(/["*]/g, '')}*"`)
      .join(' ');
      
    const db = getDatabase();
    
    // Quick SQLite executes synchronously by default for execute
    const res = db.execute(`
      SELECT * FROM tracks 
      WHERE id IN (
        SELECT track_id FROM search_index WHERE search_index MATCH ?
      )
      LIMIT ?
    `, [ftsQuery, limit]);

    // Note: To return full proper objects we'd map via database.ts mapping methods,
    // but this serves as the base logic for Phase 5.
    return {
      query: trimmed,
      tracks: (res.rows?._array as any) || [],
      albums: [],
      artists: [],
      playlists: [],
      elapsedMs: Date.now() - started,
    };
  }
}
