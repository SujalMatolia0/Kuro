import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import * as schema from './schema.js';

let db;

export function initDb(userDataPath: string) {
  const dbPath = path.join(userDataPath, 'dev_companion_production.sqlite');
  const sqlite = new Database(dbPath);
  db = drizzle(sqlite, { schema });
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb first.');
  }
  return db;
}
