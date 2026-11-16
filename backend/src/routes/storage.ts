import type { FastifyInstance } from 'fastify'
import { requireAuth, userIdOf } from '../auth.js'
import { getQuota, usedBytes } from '../nodes.js'
import { ensureStorageDir, resolveUserFilesDir, reservedQuotaBytes, isStorageError } from '../db.js'
import { diskInfo } from '../disk.js'

export async function storageRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/storage', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    const used = usedBytes(userId)
    const quota = getQuota(userId)

    // Диск считаем по тому, где РЕАЛЬНО лежат файлы пользователя,
    // а не по глобальному storage_dir
    const dir = resolveUserFilesDir(userId)
    let available = true
    let disk = { total: 0, free: 0 }
    try {
      ensureStorageDir(dir)
      disk = diskInfo(dir)
    } catch (err) {
      if (!isStorageError(err)) throw err
      // Диск отключён/недоступен: отдаём статистику по БД, чтобы интерфейс
      // мог показать предупреждение, а не падать с 500.
      available = false
    }

    const reservedByOthers = reservedQuotaBytes(userId)

    // Ёмкость для пользователя без квоты — то, что он реально может занять: свободное место
    // на диске плюс его собственные файлы. Раньше отдавали весь диск, и рядом с «свободно 384 из 457»
    // «16 из 457» читалось как ошибка: 73 ГБ заняты не пользователем, а другими данными на диске.
    // Если пользователю задана квота, знаменателем всё равно будет она (см. percent и фронт).
    const availableTotal = available ? disk.free + used : 0

    return {
      used,
      quota,
      percent:
        quota > 0
          ? Math.min(100, Math.round((used / quota) * 100))
          : availableTotal > 0
            ? Math.min(100, Math.round((used / availableTotal) * 100))
            : 0,
      dir,
      available,
      diskTotal: disk.total,
      diskFree: disk.free,
      reservedByOthers,
      availableTotal,
    }
  })
}
