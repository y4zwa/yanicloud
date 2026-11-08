import { execFile } from 'node:child_process'
import sharp from 'sharp'
import { parseFile } from 'music-metadata'
import exifr from 'exifr'
import type { FileKind } from './filekind.js'

export type FileMetadata = Record<string, unknown>

function strOrUndef(v: unknown, max = 300): string | undefined {
  if (v === null || v === undefined) return undefined
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v.toISOString()
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : undefined
  if (typeof v === 'string') {
    const s = v.trim()
    return s ? s.slice(0, max) : undefined
  }
  return undefined
}

function numOrUndef(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'))
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

function isoOrUndef(v: unknown): string | undefined {
  if (!v) return undefined
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v.toISOString()
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? strOrUndef(v) : d.toISOString()
}

function clean<T extends FileMetadata>(obj: T): T {
  for (const k of Object.keys(obj)) {
    if (obj[k] === undefined || obj[k] === null || obj[k] === '') delete obj[k]
  }
  return obj
}

/* ── Изображения ───────────────────────────────────────────────────────── */

const KNOWN_EXIF = new Set([
  'Make', 'Model', 'LensModel', 'Lens', 'LensInfo', 'LensMake',
  'DateTimeOriginal', 'CreateDate', 'ModifyDate', 'DateTimeDigitized',
  'ExposureTime', 'FNumber', 'ISO', 'ISOSpeedRatings', 'PhotographicSensitivity',
  'FocalLength', 'FocalLengthIn35mmFormat', 'ExposureProgram', 'ExposureCompensation',
  'Flash', 'WhiteBalance', 'MeteringMode', 'Software', 'Artist', 'Copyright',
  'latitude', 'longitude', 'GPSLatitude', 'GPSLongitude', 'GPSAltitude',
  'GPSLatitudeRef', 'GPSLongitudeRef', 'GPSAltitudeRef', 'GPSVersionID',
  'ExifImageWidth', 'ExifImageHeight', 'ImageWidth', 'ImageHeight',
  'Orientation', 'ColorSpace', 'XResolution', 'YResolution',
  'ResolutionUnit', 'YCbCrPositioning', 'Compression', 'BitsPerSample',
  'ThumbnailOffset', 'ThumbnailLength', 'MakerNote', 'UserComment', 'BodySerialNumber',
  'SceneCaptureType', 'Contrast', 'Saturation', 'Sharpness', 'DigitalZoomRatio',
])

function depthLabel(d?: unknown): string | undefined {
  const s = strOrUndef(d)
  if (!s) return undefined
  const map: Record<string, string> = {
    uchar: '8 бит',
    char: '8 бит',
    ushort: '16 бит',
    short: '16 бит',
    uint: '32 бит',
    int: '32 бит',
    float: '32 бит',
    double: '64 бит',
    half: '16 бит',
    complex: '64 бит',
    dpcomplex: '128 бит',
  }
  return map[s] ?? s
}

async function imageMetadata(filePath: string): Promise<FileMetadata> {
  const meta: FileMetadata = {}

  try {
    const m = await sharp(filePath).metadata()
    Object.assign(
      meta,
      clean({
        format: strOrUndef(m.format),
        width: m.width,
        height: m.height,
        colorSpace: strOrUndef(m.space),
        channels: m.channels,
        depth: depthLabel(m.depth),
        hasAlpha: typeof m.hasAlpha === 'boolean' ? m.hasAlpha : undefined,
        orientation: m.orientation,
        density: m.density,
      })
    )
  } catch {
    /* SVG/битые файлы — просто без технических полей */
  }

  let ex: Record<string, any> | undefined
  try {
    ex = (await exifr.parse(filePath, {
      tiff: true,
      exif: true,
      gps: true,
      iptc: false,
      xmp: false,
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
    })) as Record<string, any> | undefined
  } catch {
    ex = undefined
  }

  if (ex && typeof ex === 'object') {
    const exif: FileMetadata = clean({
      make: strOrUndef(ex.Make),
      model: strOrUndef(ex.Model),
      lens: strOrUndef(ex.LensModel ?? ex.Lens),
      dateTaken: isoOrUndef(ex.DateTimeOriginal ?? ex.CreateDate ?? ex.DateTimeDigitized ?? ex.ModifyDate),
      exposureTime: numOrUndef(ex.ExposureTime),
      fNumber: numOrUndef(ex.FNumber),
      iso: numOrUndef(ex.ISO ?? ex.ISOSpeedRatings ?? ex.PhotographicSensitivity),
      focalLength: numOrUndef(ex.FocalLength),
      focalLength35: numOrUndef(ex.FocalLengthIn35mmFormat),
      exposureProgram: strOrUndef(ex.ExposureProgram),
      exposureBias: numOrUndef(ex.ExposureCompensation),
      flash: strOrUndef(ex.Flash),
      whiteBalance: strOrUndef(ex.WhiteBalance),
      meteringMode: strOrUndef(ex.MeteringMode),
      software: strOrUndef(ex.Software),
      artist: strOrUndef(ex.Artist),
      copyright: strOrUndef(ex.Copyright),
    })

    const lat = numOrUndef(ex.latitude ?? ex.GPSLatitude)
    const lon = numOrUndef(ex.longitude ?? ex.GPSLongitude)
    if (lat !== undefined && lon !== undefined && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      exif.gps = clean({
        latitude: lat,
        longitude: lon,
        altitude: numOrUndef(ex.GPSAltitude),
      })
    }

    if (Object.keys(exif).length) meta.exif = exif

    // Все остальные простые теги — чтобы можно было «поковыряться»
    const tags: Record<string, string> = {}
    for (const [k, v] of Object.entries(ex)) {
      if (KNOWN_EXIF.has(k)) continue
      if (v === null || v === undefined) continue
      const t = typeof v
      if (t === 'object' && !(v instanceof Date)) continue
      const s = strOrUndef(v, 200)
      if (s) tags[k] = s
      if (Object.keys(tags).length >= 60) break
    }
    if (Object.keys(tags).length) meta.tags = tags
  }

  return meta
}

/* ── Аудио ─────────────────────────────────────────────────────────────── */

function trackLabel(t?: { no: number | null; of: number | null }): string | undefined {
  if (!t || t.no === null || t.no === undefined) return undefined
  return t.of ? `${t.no} / ${t.of}` : String(t.no)
}

function textOf(v: unknown): string | undefined {
  if (Array.isArray(v)) return v.filter(Boolean).join(', ') || undefined
  return strOrUndef(v)
}

async function audioMetadata(filePath: string): Promise<FileMetadata> {
  try {
    const parsed = await parseFile(filePath, { duration: true })
    const c = parsed.common
    const f = parsed.format
    return clean({
      title: textOf(c.title),
      artist: textOf(c.artist),
      album: textOf(c.album),
      albumArtist: textOf(c.albumartist),
      year: numOrUndef(c.year),
      genre: textOf(c.genre),
      track: trackLabel(c.track),
      disk: trackLabel(c.disk),
      composer: textOf(c.composer),
      comment: textOf(c.comment),
      duration: numOrUndef(f.duration),
      bitrate: numOrUndef(f.bitrate),
      sampleRate: numOrUndef(f.sampleRate),
      channels: numOrUndef(f.numberOfChannels),
      bitsPerSample: numOrUndef(f.bitsPerSample),
      codec: strOrUndef(f.codec),
      codecProfile: strOrUndef(f.codecProfile),
      container: strOrUndef(f.container),
      lossless: typeof f.lossless === 'boolean' ? f.lossless : undefined,
      hasCover: Array.isArray(c.picture) && c.picture.length > 0,
    })
  } catch {
    return {}
  }
}

/* ── Видео ─────────────────────────────────────────────────────────────── */

function ffprobe(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    execFile(
      'ffprobe',
      ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', filePath],
      { timeout: 20000, maxBuffer: 8 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(err)
        try {
          resolve(JSON.parse(stdout))
        } catch (e) {
          reject(e as Error)
        }
      }
    )
  })
}

function parseFps(v?: string): number | undefined {
  if (!v) return undefined
  const [a, b] = v.split('/').map(Number)
  if (!Number.isFinite(a)) return undefined
  const val = b && Number.isFinite(b) && b !== 0 ? a / b : a
  return Number.isFinite(val) && val > 0 ? Math.round(val * 100) / 100 : undefined
}

async function videoMetadata(filePath: string): Promise<FileMetadata> {
  try {
    const data = await ffprobe(filePath)
    const streams: any[] = Array.isArray(data?.streams) ? data.streams : []
    const v = streams.find((s) => s.codec_type === 'video')
    const a = streams.find((s) => s.codec_type === 'audio')
    const fmt = data?.format ?? {}
    const tags = fmt.tags && typeof fmt.tags === 'object' ? fmt.tags : {}

    return clean({
      duration: numOrUndef(fmt.duration),
      bitrate: numOrUndef(fmt.bit_rate),
      format: strOrUndef(fmt.format_name)?.split(',')[0],
      container: strOrUndef(fmt.format_long_name),
      video: v
        ? clean({
            codec: strOrUndef(v.codec_long_name ?? v.codec_name),
            width: numOrUndef(v.width),
            height: numOrUndef(v.height),
            fps: parseFps(v.avg_frame_rate) ?? parseFps(v.r_frame_rate),
            bitrate: numOrUndef(v.bit_rate),
            pixelFormat: strOrUndef(v.pix_fmt),
            profile: strOrUndef(v.profile),
          })
        : undefined,
      audio: a
        ? clean({
            codec: strOrUndef(a.codec_long_name ?? a.codec_name),
            sampleRate: numOrUndef(a.sample_rate),
            channels: numOrUndef(a.channels),
            bitrate: numOrUndef(a.bit_rate),
            profile: strOrUndef(a.profile),
          })
        : undefined,
      tags: clean({
        title: strOrUndef(tags.title),
        artist: strOrUndef(tags.artist),
        comment: strOrUndef(tags.comment),
        creationTime: isoOrUndef(tags.creation_time),
        encoder: strOrUndef(tags.encoder),
      }),
    })
  } catch {
    return {}
  }
}

/* ── Точка входа ───────────────────────────────────────────────────────── */

export async function readFileMetadata(kind: FileKind, filePath: string): Promise<FileMetadata> {
  switch (kind) {
    case 'image':
      return imageMetadata(filePath)
    case 'audio':
      return audioMetadata(filePath)
    case 'video':
      return videoMetadata(filePath)
    default:
      return {}
  }
}
