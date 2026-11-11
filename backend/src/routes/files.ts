import fs from 'node:fs'
import path from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { randomUUID } from 'node:crypto'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { db, rowToNode, toPublic, getCacheDir, getUserFilesDir, isStorageError } from '../db.js'
import { requireAuth, fail, userIdOf, isUserToken } from '../auth.js'
import { classify } from '../filekind.js'
import { convertToPdf } from '../convert.js'
import { generateThumb } from '../thumbs.js'
import { readFileMetadata } from '../metadata.js'
import { getLyrics } from '../lyrics.js'
import { extractCover } from '../covers.js'
import {
  getNode,
  getQuota,
  usedBytes,
  resolveParent,
  sanitizeName,
  uniqueName,
  isDescendant,
  createFolder,
  createFile,
  permanentDelete,
  trashNode,
  restoreNode,
} from '../nodes.js'

const LIST_SQL = `
  SELECT n.*,
    (SELECT COUNT(*) FROM nodes c WHERE c.parent_id = n.id AND c.deleted_at IS NULL) AS items
  FROM nodes n
  WHERE n.user_id = ? AND n.deleted_at IS NULL AND n.parent_id IS ?
  ORDER BY CASE WHEN n.type = 'folder' THEN 0 ELSE 1 END, n.name COLLATE NOCASE ASC
`

/**
 * Content-Disposition с поддержкой не-ASCII имён (RFC 5987).
 * В `filename` допускается только ASCII, иначе Node/Fastify падает с ERR_INVALID_CHAR.
 * Кириллица и прочие символы передаются в `filename*` в percent-encoding.
 */
function attachmentDisposition(filename: string): string {
  const fallback = filename
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_')
    .slice(0, 200) || 'download'
  const encoded = encodeURIComponent(filename).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  )
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`
}

function streamInline(reply: FastifyReply, req: FastifyRequest, filePath: string, contentType: string): FastifyReply {
  const stat = fs.statSync(filePath)
  reply.header('Accept-Ranges', 'bytes')
  reply.header('Content-Type', contentType)
  reply.header('Content-Disposition', 'inline')
  // SVG, открытый как документ, может исполнить скрипт на нашем origin.
  if (contentType === 'image/svg+xml') {
    reply.header('Content-Security-Policy', 'sandbox')
  }

  const range = req.headers.range
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range)
    let start = m && m[1] ? parseInt(m[1], 10) : 0
    let end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1
    if (Number.isNaN(start)) start = 0
    if (Number.isNaN(end) || end >= stat.size) end = stat.size - 1
    if (start > end) {
      reply.code(416).header('Content-Range', `bytes */${stat.size}`)
      return reply.send()
    }
    reply.code(206)
    reply.header('Content-Range', `bytes ${start}-${end}/${stat.size}`)
    reply.header('Content-Length', end - start + 1)
    return reply.send(fs.createReadStream(filePath, { start, end }))
  }
  reply.header('Content-Length', stat.size)
  return reply.send(fs.createReadStream(filePath))
}

async function mediaAuth(
  app: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply
): Promise<number | null> {
  const t = (req.query as any)?.t
  if (t) {
    try {
      const payload = app.jwt.verify(t) as any
      if (
        payload &&
        (payload.kind === 'stream' || payload.kind === 'thumb' || payload.kind === 'download' || payload.kind === 'cover') &&
        payload.id === (req.params as any).id
      ) {
        return Number(payload.sub)
      }
    } catch {
      /* fallthrough */
    }
    fail(reply, 401, 'Unauthorized')
    return null
  }
  try {
    await req.jwtVerify()
  } catch {
    fail(reply, 401, 'Unauthorized')
    return null
  }
  // медиа-токен не должен работать как обычный Bearer даже на медиа-ручках
  if (!isUserToken(req)) {
    fail(reply, 401, 'Unauthorized')
    return null
  }
  return userIdOf(req)
}

export async function filesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/files', { preHandler: requireAuth }, async (req, reply) => {
    const userId = userIdOf(req)
    const query = req.query as any
    let parentId: string | null = null
    if (query.parent) {
      try {
        parentId = resolveParent(userId, query.parent)
      } catch (e: any) {
        return fail(reply, 400, e.message)
      }
    }
    const rows = db.prepare(LIST_SQL).all(userId, parentId)
    return { parent: parentId, items: rows.map(rowToNode).map(toPublic) }
  })

  app.get('/api/files/favorites', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    const rows = db
      .prepare(
        `SELECT n.*,
          (SELECT COUNT(*) FROM nodes c WHERE c.parent_id = n.id AND c.deleted_at IS NULL) AS items
         FROM nodes n
         WHERE n.user_id = ? AND n.is_favorite = 1 AND n.deleted_at IS NULL
         ORDER BY n.updated_at DESC`
      )
      .all(userId)
    return { items: rows.map(rowToNode).map(toPublic) }
  })

  app.get('/api/files/recent', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    const rows = db
      .prepare(
        "SELECT * FROM nodes WHERE user_id = ? AND type = 'file' AND deleted_at IS NULL AND hidden_recent = 0 ORDER BY updated_at DESC LIMIT 12"
      )
      .all(userId)
    return { items: rows.map(rowToNode).map(toPublic) }
  })

  app.get('/api/files/search', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    const q = String((req.query as any).q ?? '').trim()
    if (!q) return { items: [] }
    // % и _ в запросе — обычные символы, а не wildcard
    const escaped = q.replace(/[\\%_]/g, (char) => `\\${char}`)
    const rows = db
      .prepare(
        "SELECT * FROM nodes WHERE user_id = ? AND deleted_at IS NULL AND name LIKE ? ESCAPE '\\' ORDER BY updated_at DESC LIMIT 50"
      )
      .all(userId, `%${escaped}%`)
    return { items: rows.map(rowToNode).map(toPublic) }
  })

  app.get('/api/files/trash', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    // показываем только корни корзины: дети удалённой папки не должны висеть отдельными строками
    const rows = db
      .prepare(
        `SELECT n.* FROM nodes n
         WHERE n.user_id = ? AND n.deleted_at IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM nodes p WHERE p.id = n.parent_id AND p.deleted_at IS NOT NULL
           )
         ORDER BY n.deleted_at DESC`
      )
      .all(userId)
    return { items: rows.map(rowToNode).map(toPublic) }
  })

  app.delete('/api/files/trash', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    const rows = db
      .prepare(
        `SELECT n.id FROM nodes n
         WHERE n.user_id = ? AND n.deleted_at IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM nodes p WHERE p.id = n.parent_id AND p.deleted_at IS NOT NULL
           )`
      )
      .all(userId) as any[]
    for (const r of rows) permanentDelete(userId, r.id)
    return { ok: true }
  })

  app.post('/api/files/folders', { preHandler: requireAuth }, async (req, reply) => {
    const userId = userIdOf(req)
    const body = req.body as any
    const name = sanitizeName(String(body?.name ?? ''))
    if (name === 'Без названия' && !String(body?.name ?? '').trim()) {
      return fail(reply, 400, 'Укажите имя папки')
    }
    let parentId: string | null = null
    try {
      parentId = resolveParent(userId, body?.parentId)
    } catch (e: any) {
      return fail(reply, 400, e.message)
    }
    return toPublic(createFolder(userId, parentId, name))
  })

  app.post('/api/files/upload', { preHandler: requireAuth }, async (req, reply) => {
    const userId = userIdOf(req)
    const query = req.query as any
    let parentId: string | null = null
    try {
      parentId = resolveParent(userId, query?.parent)
    } catch (e: any) {
      return fail(reply, 400, e.message)
    }

    const created: any[] = []
    let quotaErr: string | null = null

    try {
      const parts = req.parts()
      for await (const part of parts) {
        if (part.type !== 'file') continue
        const name = uniqueName(userId, parentId, sanitizeName(part.filename || 'file'))
        const storageKey = randomUUID()
        const fullPath = path.join(getUserFilesDir(userId), storageKey)
        let size = 0
        let quotaExceeded = false
        
        const used = usedBytes(userId)
        const quota = getQuota(userId)

        const counter = new Transform({
          transform(chunk: Buffer, _enc, cb) {
            size += chunk.length
            if (quota > 0 && used + size > quota) {
              quotaExceeded = true
              return cb(new Error('QUOTA_EXCEEDED'))
            }
            cb(null, chunk)
          },
        })

        try {
          await pipeline(part.file, counter, fs.createWriteStream(fullPath))
        } catch (err: any) {
          fs.rmSync(fullPath, { force: true })
          if (err?.code === 'ENOSPC') {
            quotaErr = 'На диске закончилось место'
            break
          }
          if (err.message === 'QUOTA_EXCEEDED' || quotaExceeded) {
            quotaErr = 'Недостаточно места в хранилище'
            break 
          }
          throw err
        }

        // повторная проверка после записи: параллельные загрузки не должны пробивать квоту
        if (quota > 0 && usedBytes(userId) + size > quota) {
          fs.rmSync(fullPath, { force: true })
          quotaErr = 'Недостаточно места в хранилище'
          break
        }

        const node = createFile(userId, parentId, name, size, part.mimetype || null, storageKey)
        created.push(toPublic(node))
      }
    } catch (err: any) {
      // Ошибки диска должны уходить в общий обработчик (503), а не превращаться в 400
      if (isStorageError(err)) throw err
      return fail(reply, 400, err.message || 'Ошибка загрузки')
    }

    if (quotaErr) return fail(reply, 507, quotaErr)
    return { files: created }
  })

  app.post('/api/files/:id/stream-url', { preHandler: requireAuth }, async (req, reply) => {
    const userId = userIdOf(req)
    const { id } = req.params as any
    const node = getNode(userId, id)
    if (!node || node.type !== 'file' || node.deletedAt) return fail(reply, 404, 'Файл не найден')
    const token = app.jwt.sign({ sub: String(userId), kind: 'stream', id }, { expiresIn: '12h' })
    return { url: `/api/files/${id}/stream?t=${token}` }
  })

  app.get('/api/files/:id/stream', async (req, reply) => {
    const userId = await mediaAuth(app, req, reply)
    if (userId === null) return reply
    const { id } = req.params as any
    const node = getNode(userId, id)
    if (!node || node.type !== 'file' || node.deletedAt || !node.storageKey) {
      return fail(reply, 404, 'Файл не найден')
    }
    const fullPath = path.join(getUserFilesDir(userId), node.storageKey)
    if (!fs.existsSync(fullPath)) return fail(reply, 404, 'Файл не найден')

    const { kind, mime } = classify(node.name, node.mimeType)
    if (kind === 'office') {
      const pdfPath = path.join(getCacheDir(), `${node.id}.pdf`)
      if (!fs.existsSync(pdfPath)) {
        try {
          await convertToPdf(fullPath, pdfPath, path.extname(node.name).toLowerCase())
        } catch (err) {
          console.error('[office] convert failed:', err)
          return fail(reply, 422, 'Не удалось сформировать предпросмотр')
        }
      }
      return streamInline(reply, req, pdfPath, 'application/pdf')
    }

    return streamInline(reply, req, fullPath, mime)
  })

  app.post('/api/files/thumb-urls', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    const body = (req.body || {}) as any
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : []
    const urls: Record<string, string> = {}
    for (const id of ids) {
      const node = getNode(userId, id)
      if (node && node.type === 'file' && !node.deletedAt) {
        const kind = classify(node.name, node.mimeType).kind
        if (kind === 'image' || kind === 'video' || kind === 'audio') {
          const token = app.jwt.sign({ sub: String(userId), kind: 'thumb', id }, { expiresIn: '12h' })
          urls[id] = `/api/files/${id}/thumbnail?t=${token}`
        }
      }
    }
    return { urls }
  })

  app.get('/api/files/:id/thumbnail', async (req, reply) => {
    const userId = await mediaAuth(app, req, reply)
    if (userId === null) return reply
    const { id } = req.params as any
    const node = getNode(userId, id)
    if (!node || node.type !== 'file' || node.deletedAt || !node.storageKey) {
      return fail(reply, 404, 'Файл не найден')
    }
    const kind = classify(node.name, node.mimeType).kind
    if (kind !== 'image' && kind !== 'video' && kind !== 'audio') {
      return fail(reply, 415, 'Миниатюра недоступна')
    }
    const fullPath = path.join(getUserFilesDir(userId), node.storageKey)
    if (!fs.existsSync(fullPath)) return fail(reply, 404, 'Файл не найден')

    const thumbPath = path.join(getCacheDir(), `${node.id}.thumb.jpg`)
    if (!fs.existsSync(thumbPath)) {
      const tmpPath = `${thumbPath}.tmp.jpg`
      const result = await generateThumb(kind, fullPath, tmpPath)
      if (result === 'ok') {
        try {
          fs.renameSync(tmpPath, thumbPath)
        } catch {
          fs.rmSync(tmpPath, { force: true })
          return fail(reply, 422, 'Не удалось создать миниатюру')
        }
      } else {
        fs.rmSync(tmpPath, { force: true })
        return fail(reply, 404, 'Миниатюра недоступна')
      }
    }
    return streamInline(reply, req, thumbPath, 'image/jpeg')
  })

  app.post('/api/files/:id/cover-url', { preHandler: requireAuth }, async (req, reply) => {
    const userId = userIdOf(req)
    const { id } = req.params as any
    const node = getNode(userId, id)
    if (!node || node.type !== 'file' || node.deletedAt) return fail(reply, 404, 'Файл не найден')
    const token = app.jwt.sign({ sub: String(userId), kind: 'cover', id }, { expiresIn: '12h' })
    return { url: `/api/files/${id}/cover?t=${token}` }
  })

  app.get('/api/files/:id/cover', async (req, reply) => {
    const userId = await mediaAuth(app, req, reply)
    if (userId === null) return reply
    const { id } = req.params as any
    const node = getNode(userId, id)
    if (!node || node.type !== 'file' || node.deletedAt || !node.storageKey) {
      return fail(reply, 404, 'Файл не найден')
    }
    const fullPath = path.join(getUserFilesDir(userId), node.storageKey)
    if (!fs.existsSync(fullPath)) return fail(reply, 404, 'Файл не найден')

    const coverPath = path.join(getCacheDir(), `${node.id}.cover.jpg`)
    if (!fs.existsSync(coverPath)) {
      const tmpPath = `${coverPath}.tmp.jpg`
      const ok = await extractCover(fullPath, tmpPath)
      if (!ok) {
        fs.rmSync(tmpPath, { force: true })
        return fail(reply, 404, 'Обложка не найдена')
      }
      try {
        fs.renameSync(tmpPath, coverPath)
      } catch {
        fs.rmSync(tmpPath, { force: true })
        return fail(reply, 422, 'Не удалось сохранить обложку')
      }
    }
    return streamInline(reply, req, coverPath, 'image/jpeg')
  })

  app.post('/api/files/:id/download-url', { preHandler: requireAuth }, async (req, reply) => {
    const userId = userIdOf(req)
    const { id } = req.params as any
    const node = getNode(userId, id)
    if (!node || node.type !== 'file' || node.deletedAt) return fail(reply, 404, 'Файл не найден')
    const token = app.jwt.sign({ sub: String(userId), kind: 'download', id }, { expiresIn: '12h' })
    return { url: `/api/files/${id}/download?t=${token}` }
  })

  app.get('/api/files/:id/download', async (req, reply) => {
    const userId = await mediaAuth(app, req, reply)
    if (userId === null) return reply
    const { id } = req.params as any
    const node = getNode(userId, id)
    if (!node || node.type !== 'file' || node.deletedAt || !node.storageKey) {
      return fail(reply, 404, 'Файл не найден')
    }
    const fullPath = path.join(getUserFilesDir(userId), node.storageKey)
    if (!fs.existsSync(fullPath)) return fail(reply, 404, 'Файл не найден')

    reply.header('Content-Type', node.mimeType || 'application/octet-stream')
    reply.header('Content-Length', node.size)
    reply.header('Content-Disposition', attachmentDisposition(node.name))
    return reply.send(fs.createReadStream(fullPath))
  })

  app.get('/api/files/:id/details', { preHandler: requireAuth }, async (req, reply) => {    const userId = userIdOf(req)
    const { id } = req.params as any
    const node = getNode(userId, id)
    if (!node || node.deletedAt) return fail(reply, 404, 'Не найдено')

    const { kind } = classify(node.name, node.mimeType)
    let metadata: Record<string, unknown> = {}

    if (node.type === 'file' && node.storageKey) {
      const fullPath = path.join(getUserFilesDir(userId), node.storageKey)
      if (fs.existsSync(fullPath)) {
        try {
          metadata = await readFileMetadata(kind, fullPath)
        } catch (err) {
          console.error('[details] metadata failed:', err)
          metadata = { error: 'Не удалось прочитать метаданные' }
        }
      }
    }

    return { ...toPublic(node), kind, metadata }
  })

  app.get('/api/files/:id/lyrics', { preHandler: requireAuth }, async (req, reply) => {
    const userId = userIdOf(req)
    const { id } = req.params as any
    const node = getNode(userId, id)
    if (!node || node.type !== 'file' || node.deletedAt || !node.storageKey) {
      return fail(reply, 404, 'Файл не найден')
    }
    if (classify(node.name, node.mimeType).kind !== 'audio') {
      return fail(reply, 415, 'Текст доступен только для аудио')
    }
    const fullPath = path.join(getUserFilesDir(userId), node.storageKey)
    if (!fs.existsSync(fullPath)) return fail(reply, 404, 'Файл не найден')
    return getLyrics(userId, node, fullPath)
  })

  app.patch('/api/files/:id', { preHandler: requireAuth }, async (req, reply) => {
    const userId = userIdOf(req)
    const { id } = req.params as any
    const node = getNode(userId, id)
    if (!node || node.deletedAt) return fail(reply, 404, 'Не найдено')

    const body = req.body as any
    const updates: string[] = []
    const params: any[] = []

    if (body.name !== undefined) {
      const name = sanitizeName(String(body.name))
      if (name !== node.name) {
        updates.push('name = ?')
        params.push(uniqueName(userId, node.parentId, name))
      }
    }
    if (body.isFavorite !== undefined) {
      updates.push('is_favorite = ?')
      params.push(body.isFavorite ? 1 : 0)
    }
    if (body.hiddenRecent !== undefined) {
      updates.push('hidden_recent = ?')
      params.push(body.hiddenRecent ? 1 : 0)
    }
    if (body.parentId !== undefined && body.parentId !== node.parentId) {
      let parentId: string | null = null
      try {
        parentId = resolveParent(userId, body.parentId)
      } catch (e: any) {
        return fail(reply, 400, e.message)
      }
      if (parentId && isDescendant(userId, parentId, node.id)) {
        return fail(reply, 400, 'Нельзя переместить папку внутрь самой себя')
      }
      updates.push('parent_id = ?')
      params.push(parentId)
    }

    if (updates.length) {
      updates.push('updated_at = ?')
      params.push(Date.now())
      params.push(id)
      db.prepare(`UPDATE nodes SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    }
    return toPublic(getNode(userId, id))
  })

  app.delete('/api/files/:id', { preHandler: requireAuth }, async (req, reply) => {
    const userId = userIdOf(req)
    const { id } = req.params as any
    const node = getNode(userId, id)
    if (!node) return fail(reply, 404, 'Не найдено')
    trashNode(userId, id, Date.now())
    return { ok: true }
  })

  app.delete('/api/files/:id/permanent', { preHandler: requireAuth }, async (req, reply) => {
    const userId = userIdOf(req)
    const { id } = req.params as any
    const node = getNode(userId, id)
    if (!node) return fail(reply, 404, 'Не найдено')
    permanentDelete(userId, id)
    return { ok: true }
  })

  app.post('/api/files/:id/restore', { preHandler: requireAuth }, async (req, reply) => {
    const userId = userIdOf(req)
    const { id } = req.params as any
    const node = getNode(userId, id)
    if (!node || !node.deletedAt) return fail(reply, 404, 'Не найдено')
    restoreNode(userId, id)
    return { ok: true }
  })
}