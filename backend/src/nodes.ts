import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { db, rowToNode, getFilesDir } from './db.js'
import type { Node } from './types.js'

export function getNode(userId: number, id: string): Node | null {
  const row = db.prepare('SELECT * FROM nodes WHERE id = ? AND user_id = ?').get(id, userId)
  return rowToNode(row)
}

export function getQuota(userId: number): number {
  const row = db.prepare('SELECT quota_bytes FROM users WHERE id = ?').get(userId) as any
  return row?.quota_bytes ?? 0
}

export function usedBytes(userId: number): number {
  const row = db.prepare(
    "SELECT COALESCE(SUM(size), 0) AS s FROM nodes WHERE user_id = ? AND type = 'file' AND deleted_at IS NULL"
  ).get(userId) as any
  return row?.s ?? 0
}

export function resolveParent(userId: number, parentId: string | null | undefined): string | null {
  if (!parentId) return null
  const row = db.prepare(
    "SELECT id, type FROM nodes WHERE id = ? AND user_id = ? AND deleted_at IS NULL"
  ).get(parentId, userId) as any
  if (!row || row.type !== 'folder') {
    throw new Error('Папка не найдена')
  }
  return parentId
}

export function sanitizeName(name: string): string {
  let n = name
    .replace(/[\\/]/g, '_')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
  if (!n) n = 'Без названия'
  if (n.length > 255) n = n.slice(0, 255)
  return n
}

export function uniqueName(userId: number, parentId: string | null, name: string): string {
  const exists = db.prepare(
    'SELECT 1 FROM nodes WHERE user_id = ? AND parent_id IS ? AND name = ? AND deleted_at IS NULL LIMIT 1'
  )
  if (!exists.get(userId, parentId, name)) return name

  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let i = 1
  let candidate = `${stem} (${i})${ext}`
  while (exists.get(userId, parentId, candidate)) {
    i++
    candidate = `${stem} (${i})${ext}`
  }
  return candidate
}

export function isDescendant(userId: number, ancestorId: string, nodeId: string): boolean {
  let cur: string | null = ancestorId
  const seen = new Set<string>()
  while (cur) {
    if (cur === nodeId) return true
    if (seen.has(cur)) return false
    seen.add(cur)
    const row = db.prepare('SELECT parent_id FROM nodes WHERE id = ? AND user_id = ?').get(cur, userId) as any
    cur = row ? row.parent_id : null
  }
  return false
}

export function createFolder(userId: number, parentId: string | null, name: string): Node {
  const finalName = uniqueName(userId, parentId, sanitizeName(name))
  const id = randomUUID()
  const now = Date.now()
  db.prepare(
    "INSERT INTO nodes (id, user_id, parent_id, name, type, size, created_at, updated_at) VALUES (?, ?, ?, ?, 'folder', 0, ?, ?)"
  ).run(id, userId, parentId, finalName, now, now)
  return getNode(userId, id)!
}

export function createFile(
  userId: number,
  parentId: string | null,
  name: string,
  size: number,
  mimeType: string | null,
  storageKey: string
): Node {
  const id = randomUUID()
  const now = Date.now()
  db.prepare(
    "INSERT INTO nodes (id, user_id, parent_id, name, type, size, mime_type, storage_key, created_at, updated_at) VALUES (?, ?, ?, ?, 'file', ?, ?, ?, ?, ?)"
  ).run(id, userId, parentId, name, size, mimeType, storageKey, now, now)
  return getNode(userId, id)!
}

export function permanentDelete(userId: number, id: string): void {
  const rows = db.prepare(
    `WITH RECURSIVE descendants(id) AS (
       SELECT id FROM nodes WHERE id = ? AND user_id = ?
       UNION ALL
       SELECT n.id FROM nodes n JOIN descendants d ON n.parent_id = d.id
     )
     SELECT id, storage_key, type FROM nodes WHERE id IN (SELECT id FROM descendants)`
  ).all(id, userId) as any[]

  const ids: string[] = []
  const dir = getFilesDir()
  for (const r of rows) {
    ids.push(r.id)
    if (r.type === 'file' && r.storage_key) {
      fs.rmSync(path.join(dir, r.storage_key), { force: true })
    }
  }
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',')
    db.prepare(`DELETE FROM nodes WHERE id IN (${placeholders})`).run(...ids)
  }
}

export function purgeTrash(retentionDays: number): number {
  const cutoff = Date.now() - retentionDays * 86400000
  const rows = db.prepare('SELECT id, user_id FROM nodes WHERE deleted_at IS NOT NULL AND deleted_at < ?').all(cutoff) as any[]
  for (const r of rows) {
    permanentDelete(r.user_id, r.id)
  }
  return rows.length
}

export function deleteUserFiles(userId: number): void {
  const rows = db.prepare(
    "SELECT storage_key FROM nodes WHERE user_id = ? AND type = 'file' AND storage_key IS NOT NULL"
  ).all(userId) as any[]
  const dir = getFilesDir()
  for (const r of rows) {
    if (r.storage_key) fs.rmSync(path.join(dir, r.storage_key), { force: true })
  }
}
