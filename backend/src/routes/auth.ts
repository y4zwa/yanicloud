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
import { normalizeAccentId } from '../accent-settings.js'

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/
const SESSION_TTL = '30d'

/**
 * Хеш-заглушка для несуществующего логина: без неё ответ на неизвестный логин приходил бы
 * за миллисекунду, а на известный — за время scrypt, и логины можно было бы перебирать по таймингу.
 */
const DUMMY_PASSWORD_HASH =
  '59ac7aba7798b3df5c36ae4ab60b1d6d:35ee89d886ec8b1df1b555e2fdd63298e3fbe4deb4dec8169be7d39a2bed9e47' +
  'b956d92e4168fb6966e3ba4b62620d4ad9576b5612e4da8eba3cb63b723525cd'

/** Полезная нагрузка сессии: `tv` — версия пароля, по ней старые токены отзываются. */
function sessionPayload(row: any) {
  return { sub: String(row.id), username: row.username, tv: Number(row.token_version ?? 0) }
}

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
    accentId: normalizeAccentId(row.accent_id),
  }
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/auth/config', async () => {
    const row = db.prepare('SELECT COUNT(*) AS c FROM users').get() as any
    const hasUsers = (row?.c ?? 0) > 0
    // первый пользователь может зарегистрироваться всегда, дальше — только по флагу
    return { hasUsers, registrationOpen: !hasUsers || config.registrationEnabled }
  })

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
    const token = app.jwt.sign(sessionPayload(row), { expiresIn: SESSION_TTL })
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
    // Проверяем хеш даже для неизвестного логина, иначе существование аккаунта видно по времени ответа
    const passwordOk = await verifyPassword(password, row?.password_hash ?? DUMMY_PASSWORD_HASH)
    if (!row || !passwordOk) {
      return fail(reply, 401, 'Неверный логин или пароль')
    }

    const token = app.jwt.sign(sessionPayload(row), { expiresIn: SESSION_TTL })
    return { token, user: publicUser(row) }
  })

  app.get('/api/auth/me', { preHandler: requireAuth }, async (req, reply) => {
    const sub = (req as any).user?.sub
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(sub)) as any
    if (!row) return fail(reply, 404, 'Пользователь не найден')
    return { user: publicUser(row) }
  })

  // Личные настройки пользователя (сейчас — только акцентная тема).
  app.patch('/api/auth/preferences', { preHandler: requireAuth }, async (req, reply) => {
    const id = Number((req as any).user?.sub)
    const body = req.body as any

    if (body?.accentId === undefined) return fail(reply, 400, 'Нет настроек для сохранения')

    const accentId = normalizeAccentId(body.accentId)
    if (!accentId) return fail(reply, 400, 'Неизвестная акцентная тема')

    const row = db.prepare('SELECT id FROM users WHERE id = ?').get(id) as any
    if (!row) return fail(reply, 404, 'Пользователь не найден')

    db.prepare('UPDATE users SET accent_id = ? WHERE id = ?').run(accentId, id)
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
    return { user: publicUser(updated) }
  })
}
