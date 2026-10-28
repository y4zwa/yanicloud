import type { FastifyInstance } from 'fastify'
import { db, getDefaultQuota } from '../db.js'
import { hashPassword, verifyPassword } from '../password.js'
import { requireAuth, fail } from '../auth.js'

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/

function publicUser(row: any) {
  return {
    id: row.id,
    username: row.username,
    quotaBytes: row.quota_bytes,
    isAdmin: row.is_admin === 1,
    banner: row.banner === 1,
  }
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/register', async (req, reply) => {
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

    const hash = hashPassword(password)
    const now = Date.now()
    const info = db
      .prepare('INSERT INTO users (username, password_hash, quota_bytes, created_at) VALUES (?, ?, ?, ?)')
      .run(username, hash, getDefaultQuota(), now)

    const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get() as any
    if (userCount?.c === 1) {
      db.prepare('UPDATE users SET is_admin = 1, quota_bytes = 0 WHERE id = ?').run(info.lastInsertRowid)
    }

    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid) as any
    const token = app.jwt.sign({ sub: String(row.id), username: row.username })
    return { token, user: publicUser(row) }
  })

  app.post('/api/auth/login', async (req, reply) => {
    const body = req.body as any
    const username = String(body?.username ?? '').trim()
    const password = String(body?.password ?? '')

    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!row || !verifyPassword(password, row.password_hash)) {
      return fail(reply, 401, 'Неверный логин или пароль')
    }

    const token = app.jwt.sign({ sub: String(row.id), username: row.username })
    return { token, user: publicUser(row) }
  })

  app.get('/api/auth/me', { preHandler: requireAuth }, async (req, reply) => {
    const sub = (req as any).user?.sub
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(sub)) as any
    if (!row) return fail(reply, 404, 'Пользователь не найден')
    return { user: publicUser(row) }
  })
}