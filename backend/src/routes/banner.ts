import fs from 'node:fs'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'
import sharp from 'sharp'
import { db } from '../db.js'
import { config } from '../config.js'
import { requireAuth, fail, userIdOf } from '../auth.js'

function bannerPath(userId: number): string {
  return path.join(config.dataDir, `banner-${userId}.jpg`)
}

export async function bannerRoutes(app: FastifyInstance): Promise<void> {
  app.put('/api/banner', { preHandler: requireAuth }, async (req, reply) => {
    const userId = userIdOf(req)
    const parts = req.parts()
    let buf: Buffer | null = null
    for await (const part of parts) {
      if (part.type !== 'file') continue
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of part.file) {
        const b = chunk as Buffer
        chunks.push(b)
        size += b.length
        if (size > 25 * 1024 * 1024) break
      }
      if (size <= 25 * 1024 * 1024) buf = Buffer.concat(chunks)
      break
    }
    if (!buf) return fail(reply, 400, 'Файл не найден')

    const dst = bannerPath(userId)
    const tmp = `${dst}.tmp`
    try {
      await sharp(buf)
        .rotate()
        .resize(2560, 2560, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 88 })
        .toFile(tmp)
      fs.renameSync(tmp, dst)
      db.prepare('UPDATE users SET banner = 1 WHERE id = ?').run(userId)
      return { ok: true }
    } catch {
      fs.rmSync(tmp, { force: true })
      return fail(reply, 422, 'Не удалось обработать изображение')
    }
  })

  app.get('/api/banner', async (req, reply) => {
    let userId: number | null = null
    const t = (req.query as any)?.t
    if (t) {
      try {
        const payload = app.jwt.verify(t) as any
        if (payload?.kind === 'banner') userId = Number(payload.sub)
      } catch {
        /* ignore */
      }
    } else {
      try {
        await req.jwtVerify()
        userId = userIdOf(req)
      } catch {
        /* ignore */
      }
    }
    if (!userId) return fail(reply, 401, 'Unauthorized')

    const row = db.prepare('SELECT banner FROM users WHERE id = ?').get(userId) as any
    const p = bannerPath(userId)
    if (!row?.banner || !fs.existsSync(p)) return fail(reply, 404, 'Баннер не найден')
    reply.header('Content-Type', 'image/jpeg')
    reply.header('Cache-Control', 'public, max-age=3600')
    return reply.send(fs.createReadStream(p))
  })

  app.delete('/api/banner', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    fs.rmSync(bannerPath(userId), { force: true })
    db.prepare('UPDATE users SET banner = 0 WHERE id = ?').run(userId)
    return { ok: true }
  })

  app.post('/api/banner-url', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    const row = db.prepare('SELECT banner FROM users WHERE id = ?').get(userId) as any
    if (!row?.banner || !fs.existsSync(bannerPath(userId))) return { url: null }
    const token = app.jwt.sign({ sub: String(userId), kind: 'banner' }, { expiresIn: '12h' })
    return { url: `/api/banner?t=${token}` }
  })
}
