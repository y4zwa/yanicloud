
import fs from 'node:fs'
import type { Dirent, Stats } from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { db, getUserFilesDir, resolveFilesDir } from '../db.js'
import { diskInfo } from '../disk.js'           

export type MigrationStatus =
  | 'preparing'
  | 'copying'
  | 'verifying'
  | 'switching'
  | 'resyncing'
  | 'cleaning'
  | 'done'
  | 'failed'

export interface MigrationJob {
  userId: number
  fromDir: string
  toDir: string
  status: MigrationStatus
  totalBytes: number
  copiedBytes: number
  error: string | null
  backupDir: string | null
  startedAt: number
  finishedAt: number | null
}

const ACTIVE_STATUSES: MigrationStatus[] = ['preparing', 'copying', 'verifying', 'switching', 'resyncing', 'cleaning']

const jobs = new Map<number, MigrationJob>()

export function getMigrationJob(userId: number): MigrationJob | null {
  return jobs.get(userId) ?? null
}

export function isMigrationActive(userId: number): boolean {
  const job = jobs.get(userId)
  return !!job && ACTIVE_STATUSES.includes(job.status)
}

export function forgetMigrationJob(userId: number): void {
  jobs.delete(userId)
}

export function serializeMigration(job: MigrationJob | null | undefined) {
  if (!job) return null
  return {
    userId: job.userId,
    status: job.status,
    active: ACTIVE_STATUSES.includes(job.status),
    fromDir: job.fromDir,
    toDir: job.toDir,
    totalBytes: job.totalBytes,
    copiedBytes: job.copiedBytes,
    progress: job.totalBytes > 0 ? Math.min(1, job.copiedBytes / job.totalBytes) : null,
    error: job.error,
    backupDir: job.backupDir,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
  }
}

// ---------- вспомогательные функции ----------

function isWithin(child: string, parent: string): boolean {
  const c = path.resolve(child)
  const p = path.resolve(parent)
  return c === p || c.startsWith(p + path.sep)
}

async function walkFiles(
  root: string,
  cb: (rel: string, abs: string, st: Stats) => Promise<void>,
): Promise<void> {
  const rootSt = await fsp.stat(root).catch(() => null)
  if (!rootSt) return
  if (rootSt.isFile()) {
    await cb(path.basename(root), root, rootSt)
    return
  }
  const stack = [root]
  while (stack.length > 0) {
    const dir = stack.pop()!
    let entries: Dirent[]
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true })
    } catch (err: any) {
      if (err?.code === 'ENOENT') continue 
      throw err
    }
    for (const e of entries) {
      const abs = path.join(dir, e.name)
      if (e.isDirectory()) {
        stack.push(abs)
      } else if (e.isFile()) {
        const st = await fsp.stat(abs).catch(() => null)
        if (st) await cb(path.relative(root, abs), abs, st)
      }
    }
  }
}

export async function dirSize(root: string): Promise<number> {
  let total = 0
  await walkFiles(root, async (_rel, _abs, st) => {
    total += st.size
  })
  return total
}

type UserFile = { key: string; size: number }

/** Только файлы этого пользователя: общий каталог может содержать чужие UUID. */
function userFiles(userId: number): UserFile[] {
  const rows = db
    .prepare(
      "SELECT storage_key, size FROM nodes WHERE user_id = ? AND type = 'file' AND storage_key IS NOT NULL"
    )
    .all(userId) as any[]
  return rows.map((row) => ({ key: row.storage_key, size: Number(row.size) || 0 }))
}

async function copyUserFiles(
  fromDir: string,
  toDir: string,
  files: UserFile[],
  job: MigrationJob,
  copied: Set<string>
): Promise<void> {
  job.copiedBytes = 0
  for (const file of files) {
    const src = path.join(fromDir, file.key)
    const dst = path.join(toDir, file.key)
    const st = await fsp.stat(src)
    const existing = await fsp.stat(dst).catch(() => null)
    if (existing && existing.size === st.size && Math.abs(existing.mtimeMs - st.mtimeMs) <= 1000) {
      job.copiedBytes += st.size
      continue
    }
    const tmp = `${dst}.mig-tmp`
    await fsp.copyFile(src, tmp)
    await fsp.utimes(tmp, st.atime, st.mtime)
    await fsp.rename(tmp, dst)
    copied.add(file.key)
    job.copiedBytes += st.size
  }
}

async function verifyUserFiles(fromDir: string, toDir: string, files: UserFile[]): Promise<void> {
  for (const file of files) {
    const src = await fsp.stat(path.join(fromDir, file.key)).catch(() => null)
    const dst = await fsp.stat(path.join(toDir, file.key)).catch(() => null)
    if (!src || !dst) throw new Error(`Файл не скопирован: ${file.key}`)
    if (dst.size !== src.size || Math.abs(dst.mtimeMs - src.mtimeMs) > 1000) {
      throw new Error(`Файл скопирован не полностью: ${file.key}`)
    }
  }
}

/** Удаляет только файлы этого пользователя. Каталог (в т.ч. общий) не трогаем. */
async function removeUserFiles(fromDir: string, files: UserFile[]): Promise<void> {
  for (const file of files) {
    await fsp.rm(path.join(fromDir, file.key), { force: true })
  }
}


async function verifyTree(from: string, to: string): Promise<void> {
  const src = new Map<string, { size: number; mtimeMs: number }>()
  await walkFiles(from, async (rel, _abs, st) => {
    src.set(rel, { size: st.size, mtimeMs: st.mtimeMs })
  })
  const dst = new Map<string, { size: number; mtimeMs: number }>()
  await walkFiles(to, async (rel, _abs, st) => {
    dst.set(rel, { size: st.size, mtimeMs: st.mtimeMs })
  })
  for (const [rel, want] of src) {
    const got = dst.get(rel)
    if (got === undefined) throw new Error(`Файл не скопирован: ${rel}`)
    if (got.size !== want.size) throw new Error(`Файл скопирован не полностью: ${rel}`)
    if (Math.abs(got.mtimeMs - want.mtimeMs) > 1000) {
      throw new Error(`У файла не совпадает время изменения: ${rel}`)
    }
  }
}


// ---------- перенос файлов пользователя ----------

export async function startUserMigration(userId: number, newStoragePath: string | null): Promise<MigrationJob> {
  if (isMigrationActive(userId)) throw new Error('Для этого пользователя миграция уже выполняется')

  const user = db.prepare('SELECT id, storage_path FROM users WHERE id = ?').get(userId) as any
  if (!user) throw new Error('Пользователь не найден')

  const fromDir = path.resolve(getUserFilesDir(userId))
  const target = newStoragePath?.trim() ? newStoragePath.trim() : resolveFilesDir()
  const toDir = path.resolve(target)

  if (fromDir === toDir) throw new Error('Старая и новая директории совпадают')
  if (isWithin(toDir, fromDir) || isWithin(fromDir, toDir)) {
    throw new Error('Новая директория не может быть внутри старой (или наоборот)')
  }

  const fromSt = await fsp.stat(fromDir).catch(() => null)
  if (!fromSt?.isDirectory()) throw new Error(`Директория пользователя не найдена: ${fromDir}`)

  // Список файлов берём из БД: в общем каталоге лежат UUID всех пользователей,
  // переносить и удалять можно только свои.
  const files = userFiles(userId)
  let totalBytes = 0
  for (const file of files) {
    const st = await fsp.stat(path.join(fromDir, file.key)).catch(() => null)
    if (!st?.isFile()) throw new Error(`Файл из базы не найден на диске: ${file.key}`)
    totalBytes += st.size
  }

  await fsp.mkdir(toDir, { recursive: true })
  const free = diskInfo(toDir).free
  if (files.length && free > 0 && free < totalBytes + 64 * 1024 * 1024) {
    throw new Error(
      `Недостаточно места в целевой папке: нужно ${totalBytes} байт, свободно ${free} байт`
    )
  }

  const job: MigrationJob = {
    userId,
    fromDir,
    toDir,
    status: 'preparing',
    totalBytes,
    copiedBytes: 0,
    error: null,
    backupDir: null,
    startedAt: Date.now(),
    finishedAt: null,
  }
  jobs.set(userId, job)

  void runMigration(job, files, newStoragePath, user.storage_path ?? null).catch(() => {})
  return job
}

async function runMigration(
  job: MigrationJob,
  files: UserFile[],
  newPathValue: string | null,
  previousPathValue: string | null
): Promise<void> {
  const { userId } = job
  let switched = false
  let cleaning = false
  const copied = new Set<string>()
  try {
    job.status = 'preparing'

    const fromDir = await fsp.realpath(job.fromDir)
    const toDir = await fsp.realpath(job.toDir)
    if (fromDir === toDir || isWithin(toDir, fromDir) || isWithin(fromDir, toDir)) {
      throw new Error('Целевая директория совпадает с исходной или вложена в неё')
    }
    job.fromDir = fromDir
    job.toDir = toDir

    job.status = 'copying'
    await copyUserFiles(fromDir, toDir, files, job, copied)
    await verifyUserFiles(fromDir, toDir, files)

    job.status = 'switching'
    db.prepare('UPDATE users SET storage_path = ? WHERE id = ?').run(newPathValue, userId)
    switched = true

    job.status = 'resyncing'
    // пока шла копия, могли дописаться файлы — добираем их по свежему списку из БД
    const latest = userFiles(userId)
    await copyUserFiles(fromDir, toDir, latest, job, copied)
    await verifyUserFiles(fromDir, toDir, latest)

    job.status = 'cleaning'
    cleaning = true
    // удаляем только файлы этого пользователя, а не весь (возможно общий) каталог
    await removeUserFiles(fromDir, latest)

    job.status = 'done'
  } catch (err: any) {
    job.error = err?.message ?? String(err)
    job.status = 'failed'
    console.error(`[migration] Перенос файлов пользователя ${userId} не удался:`, err)
    if (switched) {
      if (cleaning) {
        // копия уже проверена, чистим только источник — оставляем БД на новом месте
        job.backupDir = job.fromDir
      } else {
        // до очистки не дошли: возвращаем пользователя на старый каталог, он цел
        db.prepare('UPDATE users SET storage_path = ? WHERE id = ?').run(previousPathValue, userId)
        job.backupDir = job.toDir
      }
    } else {
      // убираем только свои копии; чужое содержимое и целевую папку не трогаем
      for (const key of copied) {
        await fsp.rm(path.join(job.toDir, key), { force: true }).catch(() => {})
        await fsp.rm(path.join(job.toDir, `${key}.mig-tmp`), { force: true }).catch(() => {})
      }
    }
  } finally {
    job.finishedAt = Date.now()
  }
}

export async function moveStorageRoot(from: string, to: string): Promise<void> {
  if (isWithin(to, from) || isWithin(from, to)) {
    throw new Error('Новая директория не может быть внутри старой (или наоборот)')
  }
  const fromSt = await fsp.stat(from).catch(() => null)
  if (!fromSt?.isDirectory()) return // переносить нечего

  // если у кого-то личный каталог лежит внутри общего, перенос общего его сломает
  const personal = db
    .prepare("SELECT id, storage_path FROM users WHERE storage_path IS NOT NULL AND TRIM(storage_path) != ''")
    .all() as any[]
  for (const user of personal) {
    if (isWithin(path.resolve(user.storage_path), from)) {
      throw new Error(
        `Нельзя перенести общее хранилище: у пользователя ${user.id} личный каталог внутри него. ` +
          'Сначала перенесите или очистите его личный путь.'
      )
    }
  }

  await fsp.mkdir(to, { recursive: true })
  const toSt = await fsp.stat(to)

  if (toSt.dev === fromSt.dev) {
    if ((await fsp.readdir(to)).length === 0) {
      try {
        await fsp.rename(from, to)
        return
      } catch {
      }
    }
  } else {
    const used = await dirSize(from)
    const free = diskInfo(to).free
    if (free < used + 64 * 1024 * 1024) {
      throw new Error(`Недостаточно места: нужно ${used} байт, свободно ${free} байт`)
    }
  }

  const entries = await fsp.readdir(from, { withFileTypes: true }).catch(() => [] as Dirent[])
  for (const e of entries) {
    const src = path.join(from, e.name)
    const dst = path.join(to, e.name)
    if (fs.existsSync(dst)) continue // уже перенесено при предыдущем запуске
    try {
      await fsp.rename(src, dst)
      continue
    } catch (err: any) {
      if (err?.code !== 'EXDEV') throw err
    }
    
    await fsp.cp(src, dst, { recursive: true, force: true })
    await verifyTree(src, dst)
    await fsp.rm(src, { recursive: true, force: true })
  }
  await fsp.rmdir(from).catch(() => {})
}