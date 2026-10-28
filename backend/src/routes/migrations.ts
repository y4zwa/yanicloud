
import fs from 'node:fs'
import type { Dirent, Stats } from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { db, getUserFilesDir } from '../db.js'   
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

const MARKER = '.storage-migration.json'
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

async function copyTree(from: string, to: string, job: MigrationJob): Promise<void> {
  await fsp.mkdir(to, { recursive: true })
  await walkFiles(from, async (rel, abs, st) => {
    const dst = path.join(to, rel)
    await fsp.mkdir(path.dirname(dst), { recursive: true })
    let alreadyCopied = false
    try {
      const d = await fsp.stat(dst)
      alreadyCopied = d.size === st.size && Math.abs(d.mtimeMs - st.mtimeMs) < 1000
    } catch {

    }
    if (!alreadyCopied) {
      const tmp = `${dst}.mig-tmp`
      await fsp.copyFile(abs, tmp)
      await fsp.utimes(tmp, st.atime, st.mtime) 
      await fsp.rename(tmp, dst)
    }
    job.copiedBytes += st.size
  })
}


async function verifyTree(from: string, to: string): Promise<void> {
  const src = new Map<string, number>()
  await walkFiles(from, async (rel, _abs, st) => {
    src.set(rel, st.size)
  })
  const dst = new Map<string, number>()
  await walkFiles(to, async (rel, _abs, st) => {
    dst.set(rel, st.size)
  })
  for (const [rel, size] of src) {
    const got = dst.get(rel)
    if (got === undefined) throw new Error(`Файл не скопирован: ${rel}`)
    if (got !== size) throw new Error(`Файл скопирован не полностью: ${rel}`)
  }
}


async function syncTrees(from: string, to: string, job: MigrationJob, attempts = 3): Promise<void> {
  for (let i = 1; ; i++) {
    await copyTree(from, to, job)
    try {
      await verifyTree(from, to)
      return
    } catch (err) {
      if (i >= attempts) throw err
      await new Promise((r) => setTimeout(r, 1000 * i))
    }
  }
}


function peekUserFilesDir(userId: number, storagePath: string | null): string {
  const row = db.prepare('SELECT storage_path FROM users WHERE id = ?').get(userId) as any
  db.prepare('UPDATE users SET storage_path = ? WHERE id = ?').run(storagePath, userId)
  try {
    return path.resolve(getUserFilesDir(userId))
  } finally {
    db.prepare('UPDATE users SET storage_path = ? WHERE id = ?').run(row?.storage_path ?? null, userId)
  }
}

async function readMarker(toDir: string): Promise<{ userId: number; fromDir: string } | null> {
  try {
    return JSON.parse(await fsp.readFile(path.join(toDir, MARKER), 'utf8'))
  } catch {
    return null
  }
}

// ---------- перенос файлов пользователя ----------

export async function startUserMigration(userId: number, newStoragePath: string | null): Promise<MigrationJob> {
  if (isMigrationActive(userId)) throw new Error('Для этого пользователя миграция уже выполняется')

  const user = db.prepare('SELECT id, storage_path FROM users WHERE id = ?').get(userId) as any
  if (!user) throw new Error('Пользователь не найден')

  const fromDir = path.resolve(getUserFilesDir(userId))
  const toDir = path.resolve(peekUserFilesDir(userId, newStoragePath))

  if (fromDir === toDir) throw new Error('Старая и новая директории совпадают')
  if (isWithin(toDir, fromDir) || isWithin(fromDir, toDir)) {
    throw new Error('Новая директория не может быть внутри старой (или наоборот)')
  }

  const fromSt = await fsp.stat(fromDir).catch(() => null)
  if (!fromSt?.isDirectory()) throw new Error(`Директория пользователя не найдена: ${fromDir}`)


  let resume = false
  const existing = await fsp.readdir(toDir).catch((err: any) => {
    if (err?.code === 'ENOENT') return null
    throw new Error(`Целевая директория недоступна: ${err?.message ?? err}`)
  })
  if (existing !== null && existing.length > 0) {
    const marker = await readMarker(toDir)
    if (!marker || marker.userId !== userId || marker.fromDir !== fromDir) {
      throw new Error(`Целевая директория не пуста: ${toDir}`)
    }
    resume = true
  }
  await fsp.mkdir(toDir, { recursive: true })

  const job: MigrationJob = {
    userId,
    fromDir,
    toDir,
    status: 'preparing',
    totalBytes: 0,
    copiedBytes: 0,
    error: null,
    backupDir: null,
    startedAt: Date.now(),
    finishedAt: null,
  }
  jobs.set(userId, job)


  void runMigration(job, newStoragePath, resume).catch(() => { })
  return job
}

async function runMigration(job: MigrationJob, newPathValue: string | null, resume: boolean): Promise<void> {
  const { userId } = job
  let switched = false
  try {
    job.status = 'preparing'


    const fromDir = await fsp.realpath(job.fromDir)
    const toDir = await fsp.realpath(job.toDir)
    if (fromDir === toDir || isWithin(toDir, fromDir) || isWithin(fromDir, toDir)) {
      throw new Error('Целевая директория совпадает с исходной или вложена в неё')
    }
    job.fromDir = fromDir
    job.toDir = toDir

    job.totalBytes = await dirSize(fromDir)

    if (!resume) {

      const sameDev = (await fsp.stat(path.dirname(toDir))).dev === (await fsp.stat(fromDir)).dev
      if (sameDev && (await fsp.readdir(toDir)).length === 0) {
        await fsp.rename(fromDir, toDir)
        db.prepare('UPDATE users SET storage_path = ? WHERE id = ?').run(newPathValue, userId)
        switched = true
        job.copiedBytes = job.totalBytes
        job.status = 'done'
        return
      }

      await fsp.writeFile(
        path.join(toDir, MARKER),
        JSON.stringify({ userId, fromDir, startedAt: Date.now() }),
        'utf8',
      )
    }

    job.status = 'copying'
    await syncTrees(fromDir, toDir, job)

    job.status = 'switching'
    db.prepare('UPDATE users SET storage_path = ? WHERE id = ?').run(newPathValue, userId)
    switched = true

    job.status = 'resyncing'
    await syncTrees(fromDir, toDir, job)

    job.status = 'cleaning'
    await fsp.rm(fromDir, { recursive: true, force: true })
    await fsp.unlink(path.join(toDir, MARKER)).catch(() => {})

    job.status = 'done'
  } catch (err: any) {
    job.error = err?.message ?? String(err)
    job.status = 'failed'
    console.error(`[migration] Перенос файлов пользователя ${userId} не удался:`, err)
    if (switched) {
      job.backupDir = job.fromDir
    } else {
      await fsp.rm(job.toDir, { recursive: true, force: true }).catch(() => {})
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