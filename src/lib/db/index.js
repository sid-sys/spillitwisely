import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Database singleton
let db = null;

export function getDb() {
  if (db) return db;
  
  const dbPath = path.join(process.cwd(), 'data', 'splitwise.db');
  const dataDir = path.dirname(dbPath);
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  // Initialize schema
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
  }
  
  return db;
}

// Transaction wrapper for atomic operations
export function transaction(fn) {
  const db = getDb();
  return db.transaction(fn)();
}

// Helper to run queries
export function query(sql, params = []) {
  const db = getDb();
  return db.prepare(sql).all(...params);
}

export function queryOne(sql, params = []) {
  const db = getDb();
  return db.prepare(sql).get(...params);
}

export function run(sql, params = []) {
  const db = getDb();
  return db.prepare(sql).run(...params);
}

export function insert(sql, params = []) {
  const result = run(sql, params);
  return result.lastInsertRowid;
}
