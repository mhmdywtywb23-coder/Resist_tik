const Database = require('better-sqlite3');
const path = require('path');
const env = process.env;

const dbPath = env.DB_PATH || path.join(__dirname, 'data.db');
const db = new Database(dbPath);

// جداول
db.prepare(`
CREATE TABLE IF NOT EXISTS license_keys (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE,
  days INTEGER,
  created_at INTEGER,
  expires_at INTEGER,
  bound_device TEXT,
  active INTEGER DEFAULT 1
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  user_key TEXT,
  input_path TEXT,
  output_path TEXT,
  status TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  message TEXT
)`).run();

module.exports = db;