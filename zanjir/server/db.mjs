import { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('company', 'store')),
  company_id TEXT,
  store_id TEXT,
  address TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  min_order_amount INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  price REAL NOT NULL CHECK (price >= 0),
  unit TEXT NOT NULL,
  min_order_qty INTEGER NOT NULL CHECK (min_order_qty >= 1),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_company ON products (company_id, created_at);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  store_id TEXT NOT NULL,
  store_name TEXT NOT NULL,
  store_phone TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  delivery_date TEXT NOT NULL DEFAULT '',
  history TEXT NOT NULL,
  stock_restored INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders (company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders (store_id, created_at);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  order_id TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_id, created_at);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS counters (
  name TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);
`;

export function openDb(file) {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA);
  return db;
}

/** Atomik tranzaksiya: xato bo'lsa, hamma o'zgarish bekor qilinadi. */
export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/** Ketma-ket, takrorlanmas buyurtma raqami (tranzaksiya ichida chaqiriladi). */
export function nextOrderNumber(db) {
  db.prepare(
    `INSERT INTO counters (name, value) VALUES ('order', 1)
     ON CONFLICT(name) DO UPDATE SET value = value + 1`
  ).run();
  const { value } = db.prepare(`SELECT value FROM counters WHERE name = 'order'`).get();
  return `ZN-${String(value).padStart(6, '0')}`;
}
