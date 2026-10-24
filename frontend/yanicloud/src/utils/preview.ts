export type PreviewKind = 'image' | 'audio' | 'video' | 'pdf' | 'office' | 'text' | 'other'

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

export function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
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

function kindByMime(mime: string): PreviewKind | null {
  const m = mime.toLowerCase().split(';')[0].trim()
  if (m.startsWith('image/')) return 'image'
  if (m.startsWith('audio/')) return 'audio'
  if (m.startsWith('video/')) return 'video'
  if (m === 'application/pdf') return 'pdf'
  if (m.startsWith('text/')) return 'text'
  if (OFFICE_MIME.has(m)) return 'office'
  return null
}

export function previewKind(name: string, mimeType?: string | null): PreviewKind {
  if (mimeType) {
    const k = kindByMime(mimeType)
    if (k) return k
  }
  const ext = extOf(name)
  if (ext === 'pdf') return 'pdf'
  if (IMAGE.has(ext)) return 'image'
  if (AUDIO.has(ext)) return 'audio'
  if (VIDEO.has(ext)) return 'video'
  if (OFFICE.has(ext)) return 'office'
  if (TEXT.has(ext)) return 'text'
  return 'other'
}

export function isImage(name: string, mimeType?: string | null): boolean {
  return previewKind(name, mimeType) === 'image'
}

export function isAudio(name: string, mimeType?: string | null): boolean {
  return previewKind(name, mimeType) === 'audio'
}

export function hasThumbnail(name: string, mimeType?: string | null): boolean {
  const k = previewKind(name, mimeType)
  return k === 'image' || k === 'video' || k === 'audio'
}
