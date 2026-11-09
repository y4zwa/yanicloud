import fs from 'node:fs'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'
import sharp from 'sharp'
import { db } from '../db.js'
import { config } from '../config.js'
import { requireAuth, fail, userIdOf } from '../auth.js'
import { normalizeBannerFit, normalizeBannerPosition } from '../banner-settings.js'

const MAX_BANNER_BYTES = 25 * 1024 * 1024
const MAX_BANNER_DIMENSION = 2560

function jpegPath(userId: number): string {
  return path.join(config.dataDir, `banner-${userId}.jpg`)
}

function gifPath(userId: number): string {
  return path.join(config.dataDir, `banner-${userId}.gif`)
}

function isGif(buf: Buffer): boolean {
  const signature = buf.subarray(0, 6).toString('ascii')
  return signature === 'GIF87a' || signature === 'GIF89a'
}

/** Обычная картинка: приводим к JPEG, как и раньше. */
async function saveStill(buf: Buffer, dst: string): Promise<void> {
  const tmp = `${dst}.tmp`
  try {
    await sharp(buf)
      .rotate()
      .resize(MAX_BANNER_DIMENSION, MAX_BANNER_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toFile(tmp)
    fs.renameSync(tmp, dst)
  } catch (err) {
    fs.rmSync(tmp, { force: true })
    throw err
  }
}

/**
 * Анимированный GIF: sharp с `animated: true` перекодирует все кадры,
 * поэтому анимация не теряется. Если сборка sharp не умеет писать GIF,
 * кладём оригинал без изменений — лучше тяжёлый баннер, чем статичная гифка.
 */
async function saveAnimated(buf: Buffer, dst: string): Promise<void> {
  const tmp = `${dst}.tmp`
  try {
    await sharp(buf, { animated: true })
      .resize(MAX_BANNER_DIMENSION, MAX_BANNER_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .gif({ effort: 3 })
      .toFile(tmp)
    fs.renameSync(tmp, dst)
  } catch (err) {
    fs.rmSync(tmp, { force: true })
    if (buf.length <= MAX_BANNER_BYTES) {
      fs.writeFileSync(tmp, buf)
      fs.renameSync(tmp, dst)
      return
    }
    throw err
  }
}

function existingBanner(userId: number): { file: string; contentType: string } | null {
  const gif = gifPath(userId)
  if (fs.existsSync(gif)) return { file: gif, contentType: 'image/gif' }
  const jpg = jpegPath(userId)
  if (fs.existsSync(jpg)) return { file: jpg, contentType: 'image/jpeg' }
  return null
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
        if (size > MAX_BANNER_BYTES) break
      }
      if (size <= MAX_BANNER_BYTES) buf = Buffer.concat(chunks)
      break
    }
    if (!buf) return fail(reply, 400, 'Файл не найден или больше 25 МБ')

    const dstJpeg = jpegPath(userId)
    const dstGif = gifPath(userId)
    try {
      if (isGif(buf)) {
        await saveAnimated(buf, dstGif)
        fs.rmSync(dstJpeg, { force: true })
      } else {
        await saveStill(buf, dstJpeg)
        fs.rmSync(dstGif, { force: true })
      }
      db.prepare('UPDATE users SET banner = 1 WHERE id = ?').run(userId)
      return { ok: true }
    } catch {
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
    const banner = existingBanner(userId)
    if (!row?.banner || !banner) return fail(reply, 404, 'Баннер не найден')
    reply.header('Content-Type', banner.contentType)
    reply.header('Content-Length', fs.statSync(banner.file).size)
    reply.header('Cache-Control', 'public, max-age=3600')
    return reply.send(fs.createReadStream(banner.file))
  })

  app.patch('/api/banner', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    const body = (req.body || {}) as any
    const current = db
      .prepare('SELECT banner_fit, banner_position FROM users WHERE id = ?')
      .get(userId) as any
    const fit = normalizeBannerFit(body.fit === undefined ? current?.banner_fit : body.fit)
    const position = normalizeBannerPosition(
      body.position === undefined ? current?.banner_position : body.position
    )
    db.prepare('UPDATE users SET banner_fit = ?, banner_position = ? WHERE id = ?').run(fit, position, userId)
    return { ok: true, fit, position }
  })

  app.delete('/api/banner', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    fs.rmSync(jpegPath(userId), { force: true })
    fs.rmSync(gifPath(userId), { force: true })
    db.prepare('UPDATE users SET banner = 0 WHERE id = ?').run(userId)
    return { ok: true }
  })

  app.post('/api/banner-url', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    const row = db
      .prepare('SELECT banner, banner_fit, banner_position FROM users WHERE id = ?')
      .get(userId) as any
    const fit = normalizeBannerFit(row?.banner_fit)
    const position = normalizeBannerPosition(row?.banner_position)
    if (!row?.banner || !existingBanner(userId)) return { url: null, fit, position }
    const token = app.jwt.sign({ sub: String(userId), kind: 'banner' }, { expiresIn: '12h' })
    return { url: `/api/banner?t=${token}`, fit, position }
  })
}
