import type { FastifyInstance } from 'fastify'
import { db, getDefaultQuota } from '../db.js'
import { hashPassword, verifyPassword } from '../password.js'
import { requireAuth, fail } from '../auth.js'
import { config } from '../config.js'
import { allowRequest } from '../rate-limit.js'
import {
  normalizeBannerCrop,
  normalizeBannerFit,
  normalizeBannerPosition,
  normalizeBannerZoom,
} from '../banner-settings.js'

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/
const SESSION_TTL = '30d'

function publicUser(row: any) {
  return {
    id: row.id,
    username: row.username,
    quotaBytes: row.quota_bytes,
    isAdmin: row.is_admin === 1,
    banner: row.banner === 1,
    bannerFit: normalizeBannerFit(row.banner_fit),
    bannerPosition: normalizeBannerPosition(row.banner_position),
    bannerZoom: normalizeBannerZoom(row.banner_zoom),
    bannerCrop: normalizeBannerCrop(row.banner_crop),
  }
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/register', async (req, reply) => {
    if (!allowRequest(`register:${req.ip}`, 5, 10 * 60_000)) {
      return fail(reply, 429, 'Слишком много попыток регистрации, попробуйте позже')
    }

    const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get() as any
    // первый пользователь создаётся всегда, иначе нужен явный флаг
    if ((userCount?.c ?? 0) > 0 && !config.registrationEnabled) {
      return fail(reply, 403, 'Регистрация закрыта. Новых пользователей создаёт администратор.')
    }
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

    const hash = await hashPassword(password)
    const now = Date.now()
    const info = db
      .prepare('INSERT INTO users (username, password_hash, quota_bytes, created_at) VALUES (?, ?, ?, ?)')
      .run(username, hash, getDefaultQuota(), now)

    // пересчитываем после вставки: при гонке двух первых регистраций админом станет только один
    const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM users').get() as any
    if (totalUsers?.c === 1) {
      db.prepare('UPDATE users SET is_admin = 1, quota_bytes = 0 WHERE id = ?').run(info.lastInsertRowid)
    }

    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid) as any
    const token = app.jwt.sign({ sub: String(row.id), username: row.username }, { expiresIn: SESSION_TTL })
    return { token, user: publicUser(row) }
  })

  app.post('/api/auth/login', async (req, reply) => {
    if (!allowRequest(`login:${req.ip}`, 20, 5 * 60_000)) {
      return fail(reply, 429, 'Слишком много попыток входа, попробуйте через несколько минут')
    }

    const body = req.body as any
    const username = String(body?.username ?? '').trim()
    const password = String(body?.password ?? '')

    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      return fail(reply, 401, 'Неверный логин или пароль')
    }

    const token = app.jwt.sign({ sub: String(row.id), username: row.username }, { expiresIn: SESSION_TTL })
    return { token, user: publicUser(row) }
  })

  app.get('/api/auth/me', { preHandler: requireAuth }, async (req, reply) => {
    const sub = (req as any).user?.sub
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(sub)) as any
    if (!row) return fail(reply, 404, 'Пользователь не найден')
    return { user: publicUser(row) }
  })
}