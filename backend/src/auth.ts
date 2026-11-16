import type { FastifyReply, FastifyRequest } from 'fastify'
import { db } from './db.js'

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify()
  } catch {
    return void reply.code(401).send({ error: 'Unauthorized' })
  }
  if (!activeSession(req)) return void reply.code(401).send({ error: 'Unauthorized' })
}

/**
 * Проверка, что сессия ещё жива: пользователь существует и токен не отозван.
 * Без этого удалённый пользователь продолжал бы ходить по API до истечения 30-дневного токена,
 * а смена пароля не выкидывала бы старые сессии.
 */
export function activeSession(req: FastifyRequest): { id: number; isAdmin: boolean } | null {
  const payload = (req as any).user
  if (!payload || payload.kind) return null
  const id = Number(payload.sub)
  if (!Number.isInteger(id) || id <= 0) return null

  const row = db.prepare('SELECT is_admin, token_version FROM users WHERE id = ?').get(id) as any
  if (!row) return null
  // У токенов, выпущенных до появления token_version, поля нет — считаем их версией 0,
  // чтобы обновление не выкинуло всех из аккаунтов.
  if (Number(payload.tv ?? 0) !== Number(row.token_version ?? 0)) return null
  return { id, isAdmin: !!row.is_admin }
}

export function userIdOf(req: FastifyRequest): number {
  const sub = (req as any).user?.sub
  if (!sub) return 0
  return Number(sub)
}

export function isAdminOf(req: FastifyRequest): boolean {
  const id = userIdOf(req)
  if (!id) return false
  const row = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(id) as any
  return !!row?.is_admin
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify()
  } catch {
    return void reply.code(401).send({ error: 'Unauthorized' })
  }
  const session = activeSession(req)
  if (!session) return void reply.code(401).send({ error: 'Unauthorized' })
  if (!session.isAdmin) {
    return void reply.code(403).send({ error: 'Требуются права администратора' })
  }
}

export function fail(reply: FastifyReply, code: number, error: string): FastifyReply {
  return reply.code(code).send({ error })
}
