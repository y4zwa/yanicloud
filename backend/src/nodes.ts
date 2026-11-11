import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { db, rowToNode, resolveUserFilesDir } from './db.js'
import { clearNodesCache } from './cache.js'
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
       SELECT n.id FROM nodes n JOIN descendants d ON n.parent_id = d.id WHERE n.user_id = ?
     )
     SELECT id, storage_key, type FROM nodes WHERE id IN (SELECT id FROM descendants)`
  ).all(id, userId, userId) as any[]

  const ids: string[] = []
  // Файлы пользователя могут лежать в его собственном каталоге (storage_path),
  // а не в глобальном storage_dir — удалять нужно именно оттуда.
  const dir = resolveUserFilesDir(userId)
  
  for (const r of rows) {
    ids.push(r.id)
    if (r.type === 'file' && r.storage_key) {
      fs.rmSync(path.join(dir, r.storage_key), { force: true })
    }
  }

  clearNodesCache(ids)
  
  if (ids.length) {
    const deleteStmt = db.prepare('DELETE FROM nodes WHERE id = ?')
    const deleteTx = db.transaction((items: string[]) => {
      for (const itemId of items) deleteStmt.run(itemId)
    })
    deleteTx(ids)
  }
}

/** Мягко удаляет узел вместе со всем поддеревом — дети не остаются «живыми». */
export function trashNode(userId: number, id: string, at: number): void {
  db.prepare(
    `WITH RECURSIVE descendants(id) AS (
       SELECT id FROM nodes WHERE id = ? AND user_id = ?
       UNION ALL
       SELECT n.id FROM nodes n JOIN descendants d ON n.parent_id = d.id WHERE n.user_id = ?
     )
     UPDATE nodes SET deleted_at = ?, updated_at = ? WHERE id IN (SELECT id FROM descendants)`
  ).run(id, userId, userId, at, at)
}

export function restoreNode(userId: number, id: string): void {
  const node = getNode(userId, id)
  if (!node) return

  let parentId = node.parentId
  if (parentId) {
    const parent = getNode(userId, parentId)
    if (!parent || parent.deletedAt) parentId = null
  }

  const now = Date.now()
  const restore = db.transaction(() => {
    db.prepare(
      `WITH RECURSIVE descendants(id) AS (
         SELECT id FROM nodes WHERE id = ? AND user_id = ?
         UNION ALL
         SELECT n.id FROM nodes n JOIN descendants d ON n.parent_id = d.id WHERE n.user_id = ?
       )
       UPDATE nodes SET deleted_at = NULL, updated_at = ? WHERE id IN (SELECT id FROM descendants)`
    ).run(id, userId, userId, now)

    if (parentId !== node.parentId) {
      db.prepare('UPDATE nodes SET parent_id = ? WHERE id = ?').run(parentId, id)
    }
  })
  restore()
}

export function purgeTrash(retentionDays: number): number {
  const cutoff = Date.now() - retentionDays * 86400000
  // удаляем только корни корзины: permanentDelete сам обойдёт всё поддерево
  const rows = db
    .prepare(
      `SELECT n.id, n.user_id FROM nodes n
       WHERE n.deleted_at IS NOT NULL AND n.deleted_at < ?
         AND NOT EXISTS (
           SELECT 1 FROM nodes p WHERE p.id = n.parent_id AND p.deleted_at IS NOT NULL
         )`
    )
    .all(cutoff) as any[]
  let purged = 0
  for (const r of rows) {
    try {
      permanentDelete(r.user_id, r.id)
      purged++
    } catch (err) {
      // Диск может быть временно недоступен — не теряем остальные элементы
      // и не удаляем записи из БД, пока файлы не удалены с диска.
      console.error(`[trash] не удалось удалить ${r.id}:`, err)
    }
  }
  return purged
}

export function deleteUserFiles(userId: number): void {
  const rows = db.prepare(
    "SELECT id, storage_key FROM nodes WHERE user_id = ? AND type = 'file' AND storage_key IS NOT NULL"
  ).all(userId) as any[]
  const dir = resolveUserFilesDir(userId)
  for (const r of rows) {
    if (r.storage_key) fs.rmSync(path.join(dir, r.storage_key), { force: true })
  }
  clearNodesCache(rows.map((r) => r.id))
}
