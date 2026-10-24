import type { NodeItem } from '@/api'
import { currentPrimary } from '@/utils/theme'

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 Б'
  const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  const rounded = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10
  return `${rounded} ${units[i]}`
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000)
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  if (diffDays === 0) return `Сегодня, ${time}`
  if (diffDays === 1) return `Вчера, ${time}`
  return `${d.getDate()} ${months[d.getMonth()]}, ${time}`
}

const EXT_ICONS: Record<string, string> = {
  pdf: 'mdi-file-pdf-box',
  doc: 'mdi-file-word',
  docx: 'mdi-file-word',
  xls: 'mdi-file-excel',
  xlsx: 'mdi-file-excel',
  ppt: 'mdi-file-powerpoint',
  pptx: 'mdi-file-powerpoint',
  txt: 'mdi-file-document-outline',
  md: 'mdi-language-markdown',
  json: 'mdi-code-json',
  zip: 'mdi-folder-zip',
  rar: 'mdi-folder-zip',
  '7z': 'mdi-folder-zip',
  tar: 'mdi-folder-zip',
  gz: 'mdi-folder-zip',
  iso: 'mdi-disc',
  png: 'mdi-file-image',
  jpg: 'mdi-file-image',
  jpeg: 'mdi-file-image',
  gif: 'mdi-file-image',
  svg: 'mdi-file-image',
  webp: 'mdi-file-image',
  mp3: 'mdi-file-music',
  wav: 'mdi-file-music',
  flac: 'mdi-file-music',
  mp4: 'mdi-file-video',
  mkv: 'mdi-file-video',
  avi: 'mdi-file-video',
  mov: 'mdi-file-video',
  exe: 'mdi-application',
  msi: 'mdi-application',
  apk: 'mdi-android',
  dart: 'mdi-language-dart',
  ts: 'mdi-language-typescript',
  tsx: 'mdi-language-typescript',
  js: 'mdi-language-javascript',
  py: 'mdi-language-python',
  go: 'mdi-language-go',
  rs: 'mdi-language-rust',
  cpp: 'mdi-language-cpp',
  c: 'mdi-language-c',
  cs: 'mdi-language-csharp',
  html: 'mdi-language-html5',
  css: 'mdi-language-css3',
  sh: 'mdi-console',
  sql: 'mdi-database',
}

export function fileIcon(node: NodeItem): string {
  if (node.type === 'folder') return 'mdi-folder'
  const ext = node.name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_ICONS[ext] ?? 'mdi-file-outline'
}

export function fileColor(node: NodeItem): string {
  if (node.type === 'folder') return currentPrimary.value
  const map: Record<string, string> = {
    pdf: '#FF8A80',
    doc: '#82B1FF',
    docx: '#82B1FF',
    xls: '#A5D6A7',
    xlsx: '#A5D6A7',
    zip: '#E57373',
    rar: '#E57373',
    '7z': '#E57373',
    iso: '#FFB74D',
    png: '#4DD0E1',
    jpg: '#4DD0E1',
    jpeg: '#4DD0E1',
    mp3: '#B39DDB',
    mp4: '#FF8A65',
  }
  const ext = node.name.split('.').pop()?.toLowerCase() ?? ''
  return map[ext] ?? '#938F99'
}

export function fileBg(node: NodeItem): string {
  if (node.type === 'folder') {
    const hex = currentPrimary.value
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, 0.12)`
  }
  const hex = fileColor(node)
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.1)`
}

export function initials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}
