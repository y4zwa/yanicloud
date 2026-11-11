import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const GIB = 1024 ** 3

function env(name: string, fallback: string): string {
  return process.env[name] ?? fallback
}

function numEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return fallback
  const value = Number(raw)
  return Number.isFinite(value) ? value : fallback
}

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase())
}

export const config = {
  host: env('HOST', '0.0.0.0'),
  port: numEnv('PORT', 8080),
  dataDir: env('DATA_DIR', path.join(__dirname, '..', 'data')),
  defaultQuota: numEnv('DEFAULT_QUOTA_BYTES', 70 * GIB),
  trashRetentionDays: numEnv('TRASH_RETENTION_DAYS', 30),
  publicDir: env('PUBLIC_DIR', path.join(__dirname, '..', 'public')),
  // регистрация закрыта по умолчанию: первый пользователь создаётся всегда,
  // остальные — только при REGISTRATION_ENABLED=true (или через админку)
  registrationEnabled: boolEnv('REGISTRATION_ENABLED', false),
  // CORS не нужен, когда фронт раздаётся с того же origin. Пусто — заголовки не отдаём.
  corsOrigin: env('CORS_ORIGIN', '').trim(),
}

export const filesDir = path.join(config.dataDir, 'files')
export const cacheDir = path.join(config.dataDir, 'cache')
export const dbPath = path.join(config.dataDir, 'yanicloud.db')
