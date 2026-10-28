import type { FastifyInstance } from 'fastify'
import { requireAuth, userIdOf } from '../auth.js'
import { getQuota, usedBytes } from '../nodes.js'
import { getFilesDir, getUserFilesDir, reservedQuotaBytes } from '../db.js'
import { diskInfo } from '../disk.js'

export async function storageRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/storage', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    const used = usedBytes(userId)
    const quota = getQuota(userId)
    const percent = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0

    // Диск считаем по тому, где РЕАЛЬНО лежат файлы пользователя,
    // а не по глобальному storage_dir
    let dir = getFilesDir()
    try {
      dir = getUserFilesDir(userId)
    } catch {
      /* нет личной папки — остаёмся на общем хранилище */
    }
    let disk
    try {
      disk = diskInfo(dir)
    } catch {
      dir = getFilesDir()
      disk = diskInfo(dir)
    }

    const reservedByOthers = reservedQuotaBytes(userId)
    return {
      used,
      quota,
      percent,
      dir,
      diskTotal: disk.total,
      diskFree: disk.free,
      reservedByOthers,
      availableTotal: Math.max(0, disk.total - reservedByOthers),
    }
  })
}