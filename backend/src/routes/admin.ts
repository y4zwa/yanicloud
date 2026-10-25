import fs from 'node:fs'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'
import { db, getSetting, setSetting, getFilesDir, getDefaultQuota } from '../db.js'
import { config, filesDir } from '../config.js'
import { requireAdmin, fail, userIdOf } from '../auth.js'
import { hashPassword } from '../password.js'
import { deleteUserFiles } from '../nodes.js'
import { diskInfo } from '../disk.js'

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/admin/users', { preHandler: requireAdmin }, async () => {
    const rows = db
      .prepare(
        `SELECT u.id, u.username, u.is_admin, u.quota_bytes, u.created_at,
          (SELECT COALESCE(SUM(size), 0) FROM nodes n WHERE n.user_id = u.id AND n.type = 'file' AND n.deleted_at IS NULL) AS used
         FROM users u ORDER BY u.id ASC`
      )
      .all() as any[]
    return {
      users: rows.map((r) => ({
        id: r.id,
        username: r.username,
        isAdmin: r.is_admin === 1,
        quotaBytes: r.quota_bytes,
        used: r.used,
        createdAt: r.created_at,
      })),
    }
  })

  app.post('/api/admin/users', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body as any
    const username = String(body?.username ?? '').trim()
    const password = String(body?.password ?? '')
    if (!USERNAME_RE.test(username)) {
      return fail(reply, 400, 'Логин должен быть 3-32 символа (латиница, цифры, _ . -)')
    }
    if (password.length < 6 || password.length > 128) {
      return fail(reply, 400, 'Пароль должен быть от 6 до 128 символов')
    }
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any
    if (exists) return fail(reply, 409, 'Такой пользователь уже существует')

    let quota = getDefaultQuota()
    if (body?.quotaBytes !== undefined && body?.quotaBytes !== null && body?.quotaBytes !== '') {
      quota = Number(body.quotaBytes)
      if (Number.isNaN(quota) || quota < 0) return fail(reply, 400, 'Некорректная квота')
    }
    const isAdmin = body?.isAdmin === true || body?.isAdmin === 1 ? 1 : 0
    const now = Date.now()
    const info = db
      .prepare('INSERT INTO users (username, password_hash, quota_bytes, is_admin, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(username, hashPassword(password), quota, isAdmin, now)
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid) as any
    return { user: { id: row.id, username: row.username, isAdmin: row.is_admin === 1, quotaBytes: row.quota_bytes } }
  })

  app.patch('/api/admin/users/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
    if (!row) return fail(reply, 404, 'Пользователь не найден')

    const body = req.body as any
    const updates: string[] = []
    const params: any[] = []

    if (body.quotaBytes !== undefined && body.quotaBytes !== null) {
      const q = Number(body.quotaBytes)
      if (Number.isNaN(q) || q < 0) return fail(reply, 400, 'Некорректная квота')
      updates.push('quota_bytes = ?')
      params.push(q)
    }
    if (body.isAdmin !== undefined) {
      updates.push('is_admin = ?')
      params.push(body.isAdmin ? 1 : 0)
    }
    if (body.password !== undefined && body.password !== null && body.password !== '') {
      const password = String(body.password)
      if (password.length < 6) return fail(reply, 400, 'Пароль должен быть от 6 символов')
      updates.push('password_hash = ?')
      params.push(hashPassword(password))
    }

    if (updates.length) {
      params.push(id)
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    }
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
    return { user: { id: updated.id, username: updated.username, isAdmin: updated.is_admin === 1, quotaBytes: updated.quota_bytes } }
  })

  app.delete('/api/admin/users/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const id = Number((req.params as any).id)
    if (id === userIdOf(req)) return fail(reply, 400, 'Нельзя удалить собственный аккаунт')
    const row = db.prepare('SELECT id FROM users WHERE id = ?').get(id) as any
    if (!row) return fail(reply, 404, 'Пользователь не найден')
    deleteUserFiles(id)
    db.prepare('DELETE FROM users WHERE id = ?').run(id)
    return { ok: true }
  })

  app.get('/api/admin/disks', { preHandler: requireAdmin }, async () => {
    const currentDir = path.resolve(getFilesDir())
    let currentDev = -1
    try {
      currentDev = fs.statSync(currentDir).dev
    } catch {
      /* ignore */
    }

    const deviceNameByDev = new Map<number, string>()
    const mounts = fs
      .readFileSync('/proc/mounts', 'utf8')
      .split('\n')
      .filter((l) => l.startsWith('/dev/'))
      .map((l) => {
        const parts = l.split(/\s+/)
        return { device: parts[0], mount: parts[1] }
      })

    const candidates: string[] = []
    const seen = new Set<string>()
    const add = (p: string) => {
      const abs = path.resolve(p)
      if (!seen.has(abs)) {
        seen.add(abs)
        candidates.push(abs)
      }
    }

    for (const m of mounts) {
      if (m.mount.startsWith('/etc/')) continue
      add(m.mount)
    }
    for (const base of ['/data', '/mnt', '/media']) {
      add(base)
      try {
        for (const name of fs.readdirSync(base)) add(path.join(base, name))
      } catch {
        /* ignore */
      }
    }

    const byDev = new Map<number, { paths: string[]; total: number; free: number }>()
    for (const c of candidates) {
      try {
        const st = fs.statSync(c)
        if (!st.isDirectory()) continue
        const d = diskInfo(c)
        let g = byDev.get(st.dev)
        if (!g) {
          g = { paths: [], total: d.total, free: d.free }
          byDev.set(st.dev, g)
        }
        g.paths.push(c)
        if (d.total > g.total) {
          g.total = d.total
          g.free = d.free
        }
      } catch {
        /* ignore */
      }
    }

    for (const m of mounts) {
      try {
        const dev = fs.statSync(m.mount).dev
        if (!deviceNameByDev.has(dev)) deviceNameByDev.set(dev, m.device)
      } catch {
        /* ignore */
      }
    }

    const disks: any[] = []
    for (const [dev, g] of byDev) {
      let rep: string
      if (dev === currentDev) {
        const prefix = g.paths
          .filter((p) => currentDir === p || currentDir.startsWith(p + '/'))
          .sort((a, b) => b.length - a.length)[0]
        rep = prefix ?? g.paths.slice().sort((a, b) => a.length - b.length)[0]
      } else {
        rep = g.paths.slice().sort((a, b) => a.length - b.length)[0]
      }
      disks.push({
        device: deviceNameByDev.get(dev) ?? null,
        path: rep,
        total: g.total,
        free: g.free,
        current: dev === currentDev,
      })
    }
    disks.sort((a, b) => Number(b.current) - Number(a.current) || b.free - a.free)
    return { disks }
  })

  app.get('/api/admin/settings', { preHandler: requireAdmin }, async () => {
    const disk = diskInfo(getFilesDir())
    const stored = getSetting('storage_dir')
    return {
      defaultQuota: getDefaultQuota(),
      storageDir: stored && stored.trim() ? stored.trim() : filesDir,
      trashRetentionDays: config.trashRetentionDays,
      diskTotal: disk.total,
      diskFree: disk.free,
      userCount: (db.prepare('SELECT COUNT(*) AS c FROM users').get() as any).c,
    }
  })

  app.put('/api/admin/settings', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body as any

    if (body.defaultQuota !== undefined && body.defaultQuota !== null && body.defaultQuota !== '') {
      const q = Number(body.defaultQuota)
      if (Number.isNaN(q) || q < 0) return fail(reply, 400, 'Некорректная квота по умолчанию')
      setSetting('default_quota', String(q))
    }

    if (body.storageDir !== undefined && body.storageDir !== null && String(body.storageDir).trim() !== '') {
      const newDir = path.resolve(String(body.storageDir).trim())
      const oldDir = path.resolve(getFilesDir())
      
      // Асинхронное перемещение директории
      if (newDir !== oldDir) {
        try {
          await fs.promises.mkdir(newDir, { recursive: true })
          if (fs.existsSync(oldDir)) {
            const files = await fs.promises.readdir(oldDir)
            for (const f of files) {
              const from = path.join(oldDir, f)
              const to = path.join(newDir, f)
              if (fs.existsSync(to)) continue
              try {
                await fs.promises.rename(from, to)
              } catch (e: any) {
                if (e?.code === 'EXDEV') {
                  await fs.promises.copyFile(from, to)
                  await fs.promises.unlink(from)
                } else {
                  throw e
                }
              }
            }
          }
        } catch (e: any) {
          return fail(reply, 400, `Не удалось использовать директорию: ${e.message}`)
        }
      }
      setSetting('storage_dir', newDir)
    }

    const disk = diskInfo(getFilesDir())
    const stored = getSetting('storage_dir')
    return {
      defaultQuota: getDefaultQuota(),
      storageDir: stored && stored.trim() ? stored.trim() : filesDir,
      trashRetentionDays: config.trashRetentionDays,
      diskTotal: disk.total,
      diskFree: disk.free,
      userCount: (db.prepare('SELECT COUNT(*) AS c FROM users').get() as any).c,
    }
  })
}