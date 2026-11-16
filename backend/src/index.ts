import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import sharp from 'sharp'
import { config } from './config.js'
import { isStorageError, jwtSecret } from './db.js'
import { authRoutes } from './routes/auth.js'
import { filesRoutes } from './routes/files.js'
import { storageRoutes } from './routes/storage.js'
import { adminRoutes } from './routes/admin.js'
import { pinsRoutes } from './routes/pins.js'
import { bannerRoutes } from './routes/banner.js'
import { purgeTrash } from './nodes.js'
import { cleanupCache } from './cache.js'
import { recoverMigrations, resumeRootMove } from './routes/migrations.js'

const GIB = 1024 ** 3

/** Облако из иконок Google — тот же значок, что в шапке приложения. */
const FAVICON_CLOUD =
  'M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.99 5.99 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z'

// Отдаётся только для самой SPA. Токен сессии живёт в localStorage, поэтому без CSP
// любая XSS-точка = угон аккаунта; XFO запрещает встраивать панель в чужой iframe.
const APP_CSP = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  // Nunito и Wix Madefor Display подключаются из Google Fonts прямо из компонентов
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "script-src 'self'",
  "connect-src 'self'",
  "frame-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ')

export function buildApp() {
  const app = Fastify({
    trustProxy: config.trustProxy,
    logger: {
      level: 'info',
      serializers: {
        req(req: any) {
          return {
            method: req.method,
            url: (req.url || '').replace(/([?&]t=)[^&]*/g, '$1[REDACTED]'),
            host: req.headers?.host,
            remoteAddress: req.ip,
            remotePort: req.socket?.remotePort,
          }
        },
      },
    },
    bodyLimit: 16 * 1024 * 1024,
  })

  app.addHook('onRequest', async (req, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff')
    // CORS нужен только если фронт открывают с другого origin (например, в dev без прокси).
    if (config.corsOrigin) {
      reply.header('Access-Control-Allow-Origin', config.corsOrigin)
      reply.header('Vary', 'Origin')
      reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    }
    if (req.method === 'OPTIONS') {
      reply.code(204).send()
    }
  })

  app.addHook('onSend', async (_req, reply, payload) => {
    reply.header('Referrer-Policy', 'no-referrer')
    const contentType = String(reply.getHeader('content-type') ?? '')
    if (contentType.includes('text/html')) {
      // не перетираем точечные заголовки маршрутов (например, `sandbox` у SVG)
      if (!reply.hasHeader('content-security-policy')) reply.header('Content-Security-Policy', APP_CSP)
      if (!reply.hasHeader('x-frame-options')) reply.header('X-Frame-Options', 'SAMEORIGIN')
    }
    return payload
  })

  app.setErrorHandler((err, req, reply) => {
    if ((err as any)?.code === 'ENOSPC') {
      req.log.warn({ err }, 'disk full')
      return reply.code(507).send({
        error: 'На диске закончилось место',
        code: 'ENOSPC',
      })
    }
    if (isStorageError(err)) {
      req.log.warn({ err }, 'storage unavailable')
      return reply.code(503).send({
        error: 'Хранилище недоступно. Проверьте, подключён ли диск с данными на сервере.',
        code: 'STORAGE_UNAVAILABLE',
      })
    }

    const statusCode = (err as any)?.statusCode
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return reply.code(statusCode).send({ error: (err as any).message || 'Ошибка запроса' })
    }

    req.log.error({ err }, 'request failed')
    return reply.code(500).send({ error: 'Внутренняя ошибка сервера' })
  })

  app.register(jwt, { secret: jwtSecret })
  app.register(multipart, {
    limits: { fileSize: 100 * GIB, files: 100, fields: 20 },
  })

  app.get('/api/health', async () => ({ status: 'ok', time: Date.now() }))

  const faviconSvg = (hex: string): string =>
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">' +
    `<path fill="${hex ? `#${hex}` : '#FFFFFF'}" d="${FAVICON_CLOUD}"/></svg>`

  const iconColor = (req: any): { hex: string; fromQuery: boolean } => {
    const fromQuery = String(req.query?.c ?? '').replace(/^#/, '')
    const queryValid = /^[0-9a-fA-F]{6}$/.test(fromQuery)
    const fromCookie = /(?:^|;\s*)yc_accent=([0-9a-fA-F]{6})/.exec(String(req.headers.cookie ?? ''))?.[1] ?? ''
    return { hex: queryValid ? fromQuery : fromCookie, fromQuery: queryValid }
  }

  // Иконка вкладки: облако (Material Icons), цвет — акцент пользователя.
  // Отдаём файл, а не data:-URL: Chrome игнорирует data: в rel=icon и держит старую иконку.
  // Цвет берём из ?c= (тогда URL уникален для цвета и кешируется навсегда) или из cookie
  // yc_accent — её ставит фронт, чтобы самая первая загрузка иконки, которую кешируют
  // закреплённые ярлыки, уже была акцентной. Без цвета в URL ответ не кешируем надолго.
  const favicon = async (req: any, reply: any) => {
    const { hex, fromQuery } = iconColor(req)
    reply.type('image/svg+xml')
    reply.header('Cache-Control', fromQuery ? 'public, max-age=31536000, immutable' : 'no-cache')
    return reply.send(faviconSvg(hex))
  }
  app.get('/icon.svg', favicon)
  // старый адрес: у кого-то он уже закеширован, отдаём то же самое вместо HTML
  app.get('/favicon.svg', favicon)

  // PNG того же облака: Firefox и ярлыки Windows охотнее берут растр, чем SVG.
  const iconPngCache = new Map<string, Buffer>()
  app.get('/icon.png', async (req: any, reply: any) => {
    const { hex, fromQuery } = iconColor(req)
    const rawSize = Number(req.query?.s ?? 180)
    const size = [16, 32, 48, 64, 128, 180, 192, 256, 512].includes(rawSize) ? rawSize : 180
    const key = `${hex || 'default'}:${size}`
    let png = iconPngCache.get(key)
    if (!png) {
      png = await sharp(Buffer.from(faviconSvg(hex)), { density: 384 })
        .resize(size, size)
        .png()
        .toBuffer()
      iconPngCache.set(key, png)
    }
    reply.type('image/png')
    reply.header('Cache-Control', fromQuery ? 'public, max-age=31536000, immutable' : 'no-cache')
    return reply.send(png)
  })

  // Всё то же облако, но в ICO: некоторые браузеры (и ярлыки Windows) для страницы
  // игнорируют объявленные ссылки и просят именно /favicon.ico — его тоже красим в акцент,
  // иначе вкладка остаётся дефолтной навсегда.
  const icoCache = new Map<string, Buffer>()
  const buildIco = (pngs: Buffer[], sizes: number[]): Buffer => {
    const header = Buffer.alloc(6)
    header.writeUInt16LE(0, 0)
    header.writeUInt16LE(1, 2)
    header.writeUInt16LE(sizes.length, 4)
    let offset = 6 + 16 * sizes.length
    const entries = sizes.map((size, i) => {
      const e = Buffer.alloc(16)
      e.writeUInt8(size === 256 ? 0 : size, 0)
      e.writeUInt8(size === 256 ? 0 : size, 1)
      e.writeUInt16LE(1, 4)
      e.writeUInt16LE(32, 6)
      e.writeUInt32LE(pngs[i].length, 8)
      e.writeUInt32LE(offset, 12)
      offset += pngs[i].length
      return e
    })
    return Buffer.concat([header, ...entries, ...pngs])
  }

  app.get('/favicon.ico', async (req: any, reply: any) => {
    const { hex, fromQuery } = iconColor(req)
    const key = hex || 'default'
    let ico = icoCache.get(key)
    if (!ico) {
      const sizes = [16, 32, 48, 256]
      const pngs = await Promise.all(
        sizes.map((s) =>
          sharp(Buffer.from(faviconSvg(hex)), { density: 384 })
            .resize(s, s)
            .png()
            .toBuffer()
        )
      )
      ico = buildIco(pngs, sizes)
      icoCache.set(key, ico)
    }
    reply.type('image/vnd.microsoft.icon')
    reply.header('Cache-Control', fromQuery ? 'public, max-age=31536000, immutable' : 'no-cache')
    return reply.send(ico)
  })

  app.register(authRoutes)
  app.register(filesRoutes)
  app.register(storageRoutes)
  app.register(adminRoutes)
  app.register(pinsRoutes)
  app.register(bannerRoutes)

  if (fs.existsSync(config.publicDir)) {
    app.register(fastifyStatic, {
      root: config.publicDir,
      prefix: '/',
      index: 'index.html',
    })
  }

  // index.html отдаём с подставленным цветом акцента (из cookie yc_accent).
  // Иначе браузер получает дефолтную иконку в первом же ответе и кеширует её:
  // потом он сам её не перезапрашивает, и вкладка остаётся фиолетовой.
  const indexHtmlPath = path.join(config.publicDir, 'index.html')
  const indexHtml = fs.existsSync(indexHtmlPath) ? fs.readFileSync(indexHtmlPath, 'utf8') : null
  const serveIndex = (req: any, reply: any) => {
    if (!indexHtml) return reply.code(404).send({ error: 'Not found' })
    const { hex } = iconColor(req)
    reply.type('text/html').header('Cache-Control', 'no-cache')
    return reply.send(indexHtml.split('@@ACCENT@@').join(hex || 'FFFFFF'))
  }
  app.get('/', serveIndex)
  app.get('/index.html', serveIndex)

  app.setNotFoundHandler((req, reply) => {
    if (req.method === 'GET' && !req.url.startsWith('/api')) {
      return serveIndex(req, reply)
    }
    return reply.code(404).send({ error: 'Not found' })
  })

  return app
}

export function startPurgeLoop(): void {
  const run = () => {
    try {
      const purged = purgeTrash(config.trashRetentionDays)
      if (purged > 0) {
        // logger is inside app; use console for the loop
        console.log(`[trash] purged ${purged} expired item(s)`)
      }
    } catch (err) {
      console.error('[trash] purge failed', err)
    }
    try {
      const removed = cleanupCache()
      if (removed > 0) console.log(`[cache] removed ${removed} stale file(s)`)
    } catch (err) {
      console.error('[cache] cleanup failed', err)
    }
  }
  run()
  setInterval(run, 60 * 60 * 1000)
}

// Запускаем сервер только если файл является точкой входа:
// так модуль можно импортировать в тестах, не поднимая порт.
const isEntrypoint = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url : false

if (isEntrypoint) {
  const app = buildApp()

  const start = async () => {
    // Прерванный перенос общего хранилища докручиваем до того, как сервер начнёт принимать запросы
    await resumeRootMove().catch((err) => app.log.error({ err }, 'перенос хранилища не завершён'))
    await app.listen({ host: config.host, port: config.port })
    await recoverMigrations().catch((err) => app.log.error(err))
    startPurgeLoop()
  }

  start().catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
}
