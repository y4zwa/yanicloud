import fs from 'node:fs'
import path from 'node:path'
import { parseFile } from 'music-metadata'
import { db, getCacheDir, resolveUserFilesDir } from './db.js'
import type { Node } from './types.js'

export interface LyricsWord {
  t: number
  text: string
}

export interface LyricsLine {
  /** Время в миллисекундах или null для несинхронизированного текста. */
  t: number | null
  text: string
  /** Разбивка по словам (word-level LRC), если есть. */
  w?: LyricsWord[]
}

export interface LyricsResult {
  lines: LyricsLine[]
  synced: boolean
  source: 'lrc' | 'tags' | 'lrclib' | 'none'
}

const MAX_LRC_BYTES = 512 * 1024
const NONE_TTL = 24 * 60 * 60 * 1000

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function dedupe(lines: LyricsLine[]): LyricsLine[] {
  const out: LyricsLine[] = []
  const seen = new Set<string>()
  for (const line of lines) {
    const text = line.text.replace(/\u0000/g, '').trim()
    if (!text) continue
    const key = `${line.t ?? 'x'}|${text}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(line.w?.length ? { t: line.t, text, w: line.w } : { t: line.t, text })
  }
  return out
}

const WORD_TAG = /<(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?>/g

function tagToMs(min: string, sec: string, frac?: string): number {
  return Number(min) * 60_000 + Number(sec) * 1000 + Number((frac ?? '0').padEnd(3, '0').slice(0, 3))
}

/** Убирает v1:, word-level метки <00:12.34> и лишние пробелы. */
export function cleanLyricText(input: string): string {
  return input
    .replace(/^\s*v\d+\s*:\s*/i, '')
    .replace(new RegExp(WORD_TAG.source, 'g'), ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Разбирает word-level разметку <mm:ss.xxx>слово в список слов с таймкодами. */
export function parseWords(input: string): LyricsWord[] {
  const cleaned = input.replace(/^\s*v\d+\s*:\s*/i, '')
  const words: LyricsWord[] = []
  const re = new RegExp(WORD_TAG.source, 'g')
  let m: RegExpExecArray | null
  let current: number | null = null
  let last = 0

  while ((m = re.exec(cleaned))) {
    if (current !== null) {
      const text = cleaned.slice(last, m.index).trim()
      if (text) words.push({ t: current, text })
    }
    current = tagToMs(m[1], m[2], m[3])
    last = re.lastIndex
  }
  if (current !== null) {
    const tail = cleaned.slice(last).trim()
    if (tail) words.push({ t: current, text: tail })
  }
  return words
}

/** Разбор LRC: [mm:ss.xx], несколько меток на строку, [offset:±ms]. */
export function parseLrc(input: string): LyricsLine[] {
  const lines: LyricsLine[] = []
  let offset = 0
  const tag = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g

  for (const raw of input.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const row = raw.trim()
    if (!row) continue

    const meta = /^\[(ti|ar|al|by|offset|re|ve|length|au|encoding):(.*)\]$/i.exec(row)
    if (meta) {
      if (meta[1].toLowerCase() === 'offset') {
        const n = parseInt(meta[2], 10)
        if (Number.isFinite(n)) offset = n
      }
      continue
    }

    const times: number[] = []
    let end = 0
    tag.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = tag.exec(row))) {
      if (m.index !== end) break
      const min = Number(m[1])
      const sec = Number(m[2])
      const frac = (m[3] ?? '0').padEnd(3, '0').slice(0, 3)
      times.push(min * 60_000 + sec * 1000 + Number(frac))
      end = tag.lastIndex
    }
    if (!times.length) continue

    const text = cleanLyricText(row.slice(end))
    if (!text) continue
    const words = parseWords(row.slice(end))
    for (const t of times) {
      lines.push(words.length >= 2 ? { t: Math.max(0, t + offset), text, w: words } : { t: Math.max(0, t + offset), text })
    }
  }

  lines.sort((a, b) => (a.t ?? 0) - (b.t ?? 0))
  return lines
}

function lyricsFromTags(common: any): LyricsLine[] {
  const list = Array.isArray(common?.lyrics) ? common.lyrics : []
  const lines: LyricsLine[] = []

  for (const item of list) {
    if (Array.isArray(item?.syncText) && item.syncText.length) {
      // Настоящий SYLT: каждая запись — строка с таймкодом (может быть word-level)
      for (const s of item.syncText) {
        const raw = typeof s?.text === 'string' ? s.text : ''
        const text = cleanLyricText(raw)
        if (!text) continue
        const t = typeof s.timestamp === 'number' ? s.timestamp : null
        const words = parseWords(raw)
        lines.push(words.length >= 2 ? { t, text, w: words } : { t, text })
      }
      continue
    }

    if (typeof item?.text !== 'string') continue
    const raw = item.text

    if (/<\d{1,3}:\d{1,2}/.test(raw)) {
      // Word-level LRC прямо в тексте: v1:<00:17.776>слово <00:18.602>...
      for (const row of raw.split(/\r?\n/)) {
        const text = cleanLyricText(row)
        if (!text) continue
        const words = parseWords(row)
        const t = words.length ? words[0].t : null
        lines.push(words.length >= 2 ? { t, text, w: words } : { t, text })
      }
    } else if (/\[\d{1,3}:\d{1,2}/.test(raw)) {
      lines.push(...parseLrc(raw))
    } else {
      for (const row of raw.split(/\r?\n/)) {
        const text = cleanLyricText(row)
        if (text) lines.push({ t: null, text })
      }
    }
  }

  return lines
}

function lastItem<T>(v: T | T[] | undefined): T | undefined {
  return Array.isArray(v) ? v[v.length - 1] : v
}

function sidecarLyrics(userId: number, node: Node): string | null {
  if (!node.parentId) return null
  const base = node.name.replace(/\.[^.]+$/, '')
  const row = db
    .prepare(
      "SELECT storage_key, size FROM nodes WHERE user_id = ? AND parent_id = ? AND deleted_at IS NULL AND type = 'file' AND lower(name) = lower(?) LIMIT 1"
    )
    .get(userId, node.parentId, `${base}.lrc`) as any
  if (!row?.storage_key) return null
  if (typeof row.size === 'number' && row.size > MAX_LRC_BYTES) return null
  const p = path.join(resolveUserFilesDir(userId), row.storage_key)
  try {
    const st = fs.statSync(p)
    if (!st.isFile() || st.size > MAX_LRC_BYTES) return null
    return fs.readFileSync(p, 'utf8')
  } catch {
    return null
  }
}

interface LrclibItem {
  trackName?: string
  artistName?: string
  albumName?: string
  duration?: number
  instrumental?: boolean
  syncedLyrics?: string | null
  plainLyrics?: string | null
}

async function fromLrclib(
  title: string,
  artist: string,
  duration?: number
): Promise<LyricsLine[] | null> {
  const cleanTitle =
    artist && title.toLowerCase().startsWith(artist.toLowerCase())
      ? title.slice(artist.length).replace(/^[\s\-–—:.]+/, '')
      : title

  const query = [artist, cleanTitle].filter(Boolean).join(' ') || cleanTitle
  if (!query) return null

  const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`, {
    headers: { 'User-Agent': 'YaniCloud/1.0 (self-hosted)' },
    signal: AbortSignal.timeout(7000),
  })
  if (!res.ok) return null

  const raw = await res.json().catch(() => null)
  const list: LrclibItem[] = Array.isArray(raw) ? raw : []

  const wantedTitle = normalize(cleanTitle)
  const wantedArtist = normalize(artist)
  const words = wantedTitle.split(' ').filter((w) => w.length > 2)

  let bestSynced: LrclibItem | null = null
  let bestSyncedScore = -Infinity
  let bestPlain: LrclibItem | null = null
  let bestPlainScore = -Infinity

  for (const item of list) {
    if (item?.instrumental) continue
    if (!item?.syncedLyrics && !item?.plainLyrics) continue

    let score = 0
    const rt = normalize(String(item.trackName ?? ''))
    const ra = normalize(String(item.artistName ?? ''))

    if (wantedTitle && rt) {
      if (rt === wantedTitle) score += 60
      else if (rt.includes(wantedTitle) || wantedTitle.includes(rt)) score += 40
      else if (words.length) {
        const hits = words.filter((w) => rt.includes(w)).length
        score += Math.round((30 * hits) / words.length)
      }
    }
    if (wantedArtist && ra) {
      if (ra === wantedArtist) score += 40
      else if (ra.includes(wantedArtist) || wantedArtist.includes(ra)) score += 25
    }
    if (duration && typeof item.duration === 'number') {
      const diff = Math.abs(item.duration - duration)
      if (diff <= 1) score += 45
      else if (diff <= 3) score += 35
      else if (diff <= 10) score += 15
      else score -= 15
    }

    if (item.syncedLyrics) {
      if (score > bestSyncedScore) {
        bestSyncedScore = score
        bestSynced = item
      }
    } else if (score > bestPlainScore) {
      bestPlainScore = score
      bestPlain = item
    }
  }

  // Синхронизированный текст всегда предпочтительнее обычного
  if (bestSynced && bestSyncedScore >= 45) return parseLrc(bestSynced.syncedLyrics!)
  if (bestPlain && bestPlainScore >= 45) {
    return bestPlain.plainLyrics!.split(/\r?\n/).map((text) => ({ t: null, text }))
  }
  return null
}

function cachePath(node: Node): string {
  return path.join(getCacheDir(), `lyrics-${node.id}.json`)
}

function readCache(node: Node): LyricsResult | null {
  try {
    const raw = JSON.parse(fs.readFileSync(cachePath(node), 'utf8'))
    const result = raw?.result as LyricsResult | undefined
    if (!result) return null
    if (result.source === 'none' && Date.now() - Number(raw?.at ?? 0) > NONE_TTL) return null
    return result
  } catch {
    return null
  }
}

function writeCache(node: Node, result: LyricsResult): void {
  try {
    fs.mkdirSync(getCacheDir(), { recursive: true })
    fs.writeFileSync(cachePath(node), JSON.stringify({ at: Date.now(), result }))
  } catch {
    /* кэш не критичен */
  }
}

export async function getLyrics(userId: number, node: Node, fullPath: string): Promise<LyricsResult> {
  // 1. .lrc-файл рядом с треком — он всегда важнее кэша и внешних источников
  const lrc = sidecarLyrics(userId, node)
  if (lrc) {
    const lines = dedupe(parseLrc(lrc))
    if (lines.length) {
      const result: LyricsResult = { lines, synced: lines.some((l) => typeof l.t === 'number'), source: 'lrc' }
      return result
    }
  }

  const cached = readCache(node)
  if (cached) return cached

  let lines: LyricsLine[] = []
  let source: LyricsResult['source'] = 'none'

  // 2. Текст в тегах файла
  let track: any = null
  if (!lines.length) {
    try {
      track = await parseFile(fullPath, { duration: true })
      lines = dedupe(lyricsFromTags(track?.common))
      if (lines.length) source = 'tags'
    } catch {
      track = null
    }
  }

  // 3. LRCLIB (внешний каталог синхронизированных текстов)
  if (!lines.length) {
    try {
      if (!track) track = await parseFile(fullPath, { duration: true }).catch(() => null)
      const title = String(lastItem(track?.common?.title) ?? '').trim()
      const artist = String(lastItem(track?.common?.artist) ?? '').trim()
      if (title) {
        const remote = await fromLrclib(title, artist, track?.format?.duration)
        if (remote?.length) {
          lines = dedupe(remote)
          source = 'lrclib'
        }
      }
    } catch {
      /* сеть недоступна — просто нет текста */
    }
  }

  const result: LyricsResult = { lines, synced: lines.some((l) => typeof l.t === 'number'), source }
  writeCache(node, result)
  return result
}
