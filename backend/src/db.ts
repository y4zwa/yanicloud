import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import Database from 'better-sqlite3'
import { config, dbPath, filesDir, cacheDir } from './config.js'

fs.mkdirSync(config.dataDir, { recursive: true })
fs.mkdirSync(filesDir, { recursive: true })
fs.mkdirSync(cacheDir, { recursive: true })

const secretPath = `${config.dataDir}/.jwt-secret`
if (!fs.existsSync(secretPath)) {
  fs.writeFileSync(secretPath, randomBytes(48).toString('hex'), { mode: 0o600 })
}
export const jwtSecret = fs.readFileSync(secretPath, 'utf8').trim()

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    quota_bytes INTEGER NOT NULL DEFAULT ${config.defaultQuota},
    is_admin INTEGER NOT NULL DEFAULT 0,
    banner INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    parent_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('file', 'folder')),
    size INTEGER NOT NULL DEFAULT 0,
    mime_type TEXT,
    storage_key TEXT,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    hidden_recent INTEGER NOT NULL DEFAULT 0,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pins (
    user_id INTEGER NOT NULL,
    node_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, node_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_nodes_user_parent ON nodes(user_id, parent_id);
  CREATE INDEX IF NOT EXISTS idx_nodes_user_deleted ON nodes(user_id, deleted_at);
  CREATE INDEX IF NOT EXISTS idx_nodes_user_fav ON nodes(user_id, is_favorite);
  CREATE INDEX IF NOT EXISTS idx_nodes_user_name ON nodes(user_id, name);
`)

// Migrations
const userCols = db.prepare('PRAGMA table_info(users)').all() as any[]
if (!userCols.some((c) => c.name === 'is_admin')) {
  db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0')
}
if (!userCols.some((c) => c.name === 'storage_path')) {
  db.exec('ALTER TABLE users ADD COLUMN storage_path TEXT')
}
if (!userCols.some((c) => c.name === 'banner')) {
  db.exec('ALTER TABLE users ADD COLUMN banner INTEGER NOT NULL DEFAULT 0')
}

const nodeCols = db.prepare('PRAGMA table_info(nodes)').all() as any[]
if (!nodeCols.some((c) => c.name === 'hidden_recent')) {
  db.exec('ALTER TABLE nodes ADD COLUMN hidden_recent INTEGER NOT NULL DEFAULT 0')
}

// Promote the very first user to admin with unlimited quota if no admin exists yet
const adminRow = db.prepare('SELECT COUNT(*) AS c FROM users WHERE is_admin = 1').get() as any
if (!adminRow?.c) {
  const first = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get() as any
  if (first) {
    db.prepare('UPDATE users SET is_admin = 1, quota_bytes = 0 WHERE id = ?').run(first.id)
  }
}

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, value)
}

export function getFilesDir(): string {
  const s = getSetting('storage_dir')
  const dir = s && s.trim() ? s.trim() : filesDir
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function getDefaultQuota(): number {
  const s = getSetting('default_quota')
  if (s !== null && s !== '' && !Number.isNaN(Number(s))) return Number(s)
  return config.defaultQuota
}

export function reservedQuotaBytes(excludeUserId?: number): number {
  const row = excludeUserId
    ? db.prepare('SELECT COALESCE(SUM(quota_bytes), 0) AS s FROM users WHERE quota_bytes > 0 AND id != ?').get(excludeUserId)
    : db.prepare('SELECT COALESCE(SUM(quota_bytes), 0) AS s FROM users WHERE quota_bytes > 0').get()
  return (row as any)?.s ?? 0
}

export function rowToNode(row: any): any {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    parentId: row.parent_id,
    name: row.name,
    type: row.type,
    size: row.size,
    mimeType: row.mime_type,
    storageKey: row.storage_key,
    isFavorite: row.is_favorite === 1,
    hiddenRecent: row.hidden_recent === 1,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: row.items,
  }
}

export function getUserFilesDir(userId: number): string {
  const row = db.prepare('SELECT storage_path FROM users WHERE id = ?').get(userId) as any
  if (row && row.storage_path && row.storage_path.trim() !== '') {
    fs.mkdirSync(row.storage_path, { recursive: true })
    return row.storage_path
  }
  return getFilesDir() // Фоллбэк на дефолтную общую папку
}

export function toPublic(node: any): any {
  if (!node) return null
  const { userId, storageKey, ...rest } = node
  return rest
}

export function getCacheDir(): string {
  fs.mkdirSync(cacheDir, { recursive: true })
  return cacheDir
}
