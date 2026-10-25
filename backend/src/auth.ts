import type { FastifyReply, FastifyRequest } from 'fastify'
import { db } from './db.js'

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify()
  } catch {
    reply.code(401).send({ error: 'Unauthorized' })
  }
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
    return reply.code(401).send({ error: 'Unauthorized' })
  }
  const id = userIdOf(req)
  const row = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(id) as any
  if (!row?.is_admin) {
    return reply.code(403).send({ error: 'Требуются права администратора' })
  }
}

export function fail(reply: FastifyReply, code: number, error: string): FastifyReply {
  return reply.code(code).send({ error })
}
