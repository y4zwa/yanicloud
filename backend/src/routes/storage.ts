import type { FastifyInstance } from 'fastify'
import { requireAuth, userIdOf } from '../auth.js'
import { getQuota, usedBytes } from '../nodes.js'
import { getFilesDir, reservedQuotaBytes } from '../db.js'
import { diskInfo } from '../disk.js'

export async function storageRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/storage', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    const used = usedBytes(userId)
    const quota = getQuota(userId)
    const percent = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0
    const disk = diskInfo(getFilesDir())
    const reservedByOthers = reservedQuotaBytes(userId)
    return {
      used,
      quota,
      percent,
      diskTotal: disk.total,
      diskFree: disk.free,
      reservedByOthers,
      availableTotal: Math.max(0, disk.total - reservedByOthers),
    }
  })
}
