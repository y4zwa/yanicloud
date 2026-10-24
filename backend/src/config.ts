import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const GIB = 1024 ** 3

function env(name: string, fallback: string): string {
  return process.env[name] ?? fallback
}

export const config = {
  host: env('HOST', '0.0.0.0'),
  port: Number(env('PORT', '8080')),
  dataDir: env('DATA_DIR', path.join(__dirname, '..', 'data')),
  defaultQuota: Number(env('DEFAULT_QUOTA_BYTES', String(70 * GIB))),
  trashRetentionDays: Number(env('TRASH_RETENTION_DAYS', '30')),
  publicDir: env('PUBLIC_DIR', path.join(__dirname, '..', 'public')),
}

export const filesDir = path.join(config.dataDir, 'files')
export const cacheDir = path.join(config.dataDir, 'cache')
export const dbPath = path.join(config.dataDir, 'yanicloud.db')
