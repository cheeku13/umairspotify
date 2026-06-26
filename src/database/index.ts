import { SCHEMA_SQL } from './schema';

const sqliteModule = require('@op-engineering/op-sqlite');
const open: any = sqliteModule?.open ?? sqliteModule?.default?.open;

let db: any = null;

export const getDatabase = (): any => {
  if (!db) {
    if (typeof open !== 'function') {
      throw new Error('react-native-quick-sqlite open() is unavailable. Make sure the native module is linked and the package supports your environment.');
    }
    db = open({ name: 'harmony.sqlite' });
  }
  return db;
};

export const initializeDatabase = () => {
  const database = getDatabase();
  
  // Split the schema string by semi-colons to execute statements individually,
  // as quick-sqlite expects a single statement per execute call.
  // Note: PRAGMA foreign_keys = ON and similar statements must be run sequentially.
  // Trigger definitions contain semicolons inside BEGIN...END, so a naive split doesn't work for everything.
  // A safer approach is to use executeBatch or carefully craft the split.
  
  // To keep it simple and robust, we can run `executeBatch` for table creation.
  const statements = SCHEMA_SQL.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .reduce((acc, stmt) => {
      // Very basic handling for BEGIN...END in triggers.
      if (acc.length > 0 && acc[acc.length - 1].toUpperCase().includes('BEGIN') && !acc[acc.length - 1].toUpperCase().includes('END')) {
        acc[acc.length - 1] += ';\n' + stmt;
      } else {
        acc.push(stmt);
      }
      return acc;
    }, [] as string[]);
  
  // Execute sequentially to ensure PRAGMAs and dependencies are respected
  database.transaction((tx: any) => {
    for (const stmt of statements) {
      tx.execute(stmt);
    }
  });

  // Migrations
  try {
    database.execute('ALTER TABLE playlists ADD COLUMN is_smart INTEGER NOT NULL DEFAULT 0');
    database.execute('ALTER TABLE playlists ADD COLUMN smart_rules_json TEXT');
  } catch (e) {
    // Columns might already exist, safe to ignore
  }

  console.log('Database initialized successfully.');
};
