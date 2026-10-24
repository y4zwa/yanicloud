import fs from 'node:fs'
import path from 'node:path'
import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { config } from './config.js'
import { jwtSecret } from './db.js'
import { authRoutes } from './routes/auth.js'
import { filesRoutes } from './routes/files.js'
import { storageRoutes } from './routes/storage.js'
import { adminRoutes } from './routes/admin.js'
import { pinsRoutes } from './routes/pins.js'
import { bannerRoutes } from './routes/banner.js'
import { purgeTrash } from './nodes.js'

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
    reply.header('Access-Control-Allow-Origin', '*')
    reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    if (req.method === 'OPTIONS') {
      reply.code(204).send()
    }
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
  }
  run()
  setInterval(run, 60 * 60 * 1000)
}

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
