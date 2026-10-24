export type FileKind = 'image' | 'audio' | 'video' | 'pdf' | 'office' | 'text' | 'other'

const IMAGE = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif', 'tif', 'tiff'])
const AUDIO = new Set(['mp3', 'wav', 'ogg', 'oga', 'flac', 'm4a', 'aac', 'opus', 'wma'])
const VIDEO = new Set(['mp4', 'webm', 'ogv', 'mov', 'm4v', 'mkv', 'avi', 'mpeg', 'mpg', '3gp', 'ts'])
const OFFICE = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf'])
const TEXT = new Set([
  'txt', 'md', 'markdown', 'csv', 'json', 'xml', 'yml', 'yaml', 'toml', 'log', 'ini', 'conf', 'cfg',
  'env', 'properties', 'gitignore', 'editorconfig', 'lock',
  'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'py', 'go', 'rs', 'c', 'h', 'cpp', 'hpp', 'cc', 'hh',
  'java', 'kt', 'kts', 'sh', 'bash', 'zsh', 'bat', 'ps1', 'rb', 'php', 'swift', 'r', 'scala',
  'lua', 'pl', 'sql', 'html', 'htm', 'css', 'scss', 'sass', 'less', 'vue', 'svelte', 'graphql', 'proto',
])

const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  svg: 'image/svg+xml', bmp: 'image/bmp', ico: 'image/x-icon', avif: 'image/avif',
  tif: 'image/tiff', tiff: 'image/tiff',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', flac: 'audio/flac',
  m4a: 'audio/mp4', aac: 'audio/aac', opus: 'audio/opus', wma: 'audio/x-ms-wma',
  mp4: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg', mov: 'video/quicktime', m4v: 'video/mp4',
  mkv: 'video/x-matroska', avi: 'video/x-msvideo', mpeg: 'video/mpeg', mpg: 'video/mpeg',
  '3gp': 'video/3gpp', ts: 'video/mp2t',
  pdf: 'application/pdf',
}

const OFFICE_MIME = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'application/rtf',
])

export function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

function classifyByMime(mime: string): { kind: FileKind; mime: string } | null {
  const m = mime.toLowerCase().split(';')[0].trim()
  if (m.startsWith('image/')) return { kind: 'image', mime: m }
  if (m.startsWith('audio/')) return { kind: 'audio', mime: m }
  if (m.startsWith('video/')) return { kind: 'video', mime: m }
  if (m === 'application/pdf') return { kind: 'pdf', mime: 'application/pdf' }
  if (m.startsWith('text/')) return { kind: 'text', mime: 'text/plain; charset=utf-8' }
  if (OFFICE_MIME.has(m)) return { kind: 'office', mime: 'application/pdf' }
  return null
}

export function classify(name: string, mimeType?: string | null): { kind: FileKind; mime: string } {
  if (mimeType) {
    const c = classifyByMime(mimeType)
    if (c) return c
  }
  const ext = extOf(name)
  if (ext === 'pdf') return { kind: 'pdf', mime: 'application/pdf' }
  if (IMAGE.has(ext)) return { kind: 'image', mime: MIME[ext] ?? 'image/*' }
  if (AUDIO.has(ext)) return { kind: 'audio', mime: MIME[ext] ?? 'audio/mpeg' }
  if (VIDEO.has(ext)) return { kind: 'video', mime: MIME[ext] ?? 'video/mp4' }
  if (OFFICE.has(ext)) return { kind: 'office', mime: 'application/pdf' }
  if (TEXT.has(ext)) return { kind: 'text', mime: 'text/plain; charset=utf-8' }
  return { kind: 'other', mime: 'application/octet-stream' }
}

export function isOfficeExt(ext: string): boolean {
  return OFFICE.has(ext.toLowerCase())
}
