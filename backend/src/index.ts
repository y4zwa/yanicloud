import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
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

const GIB = 1024 ** 3

export function buildApp() {
  const app = Fastify({
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

  app.setNotFoundHandler((req, reply) => {
    if (req.method === 'GET' && !req.url.startsWith('/api')) {
      const indexPath = path.join(config.publicDir, 'index.html')
      if (fs.existsSync(indexPath)) {
        return reply.type('text/html').send(fs.createReadStream(indexPath))
      }
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
const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false

if (isEntrypoint) {
  const app = buildApp()

  app
    .listen({ host: config.host, port: config.port })
    .then(() => {
      startPurgeLoop()
    })
    .catch((err) => {
      app.log.error(err)
      process.exit(1)
    })
}
