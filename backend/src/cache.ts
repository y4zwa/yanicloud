import fs from 'node:fs'
import path from 'node:path'
import { cacheDir } from './config.js'

/**
 * Удаляет кэш перечисленных файлов (превью, PDF, обложки, тексты песен).
 * Каталог читается один раз: при удалении большой папки это важно.
 */
export function clearNodesCache(ids: Iterable<string>): void {
  const wanted = new Set(ids)
  if (!wanted.size) return

  let entries: string[]
  try {
    entries = fs.readdirSync(cacheDir)
  } catch {
    return
  }

  for (const name of entries) {
    let nodeId: string | null = null
    if (name.startsWith('lyrics-')) {
      // lyrics-<uuid>-<updatedAt>.json
      const match = /^lyrics-(.+)-\d+\.json$/.exec(name)
      if (match) nodeId = match[1]
    } else {
      // <uuid>.thumb.jpg / <uuid>.pdf / <uuid>.cover.jpg
      const dot = name.indexOf('.')
      if (dot > 0) nodeId = name.slice(0, dot)
    }
    if (nodeId && wanted.has(nodeId)) {
      try {
        fs.rmSync(path.join(cacheDir, name), { force: true })
      } catch {
        /* кэш не критичен */
      }
    }
  }
}

/** Убирает старые файлы кэша, которые больше не нужны. */
export function cleanupCache(maxAgeMs = 30 * 24 * 60 * 60 * 1000): number {
  let entries: string[]
  try {
    entries = fs.readdirSync(cacheDir)
  } catch {
    return 0
  }
  const now = Date.now()
  let removed = 0
  for (const name of entries) {
    const full = path.join(cacheDir, name)
    try {
      const stat = fs.statSync(full)
      if (!stat.isFile()) continue
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.rmSync(full, { force: true })
        removed++
      }
    } catch {
      /* файл мог исчезнуть между readdir и stat */
    }
  }
  return removed
}
