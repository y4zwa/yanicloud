export type BannerFit = 'contain' | 'cover'

/** Положение кадра: проценты по свободной оси картинки (object-position). */
export type BannerPosition = string

/** Старые якоря из сетки 3×3: переводим в проценты, чтобы всё жило в одной шкале. */
const ANCHOR_POSITIONS: Record<string, string> = {
  'left top': '0% 0%',
  top: '50% 0%',
  'right top': '100% 0%',
  left: '0% 50%',
  center: '50% 50%',
  right: '100% 50%',
  'left bottom': '0% 100%',
  bottom: '50% 100%',
  'right bottom': '100% 100%',
}

const PERCENT_POSITION = /^(\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)%$/
const PERCENT_CROP = /^(\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)%$/

export const MAX_BANNER_ZOOM = 8

export function normalizeBannerFit(value: unknown): BannerFit {
  return value === 'cover' ? 'cover' : 'contain'
}

export function normalizeBannerCrop(value: unknown): string | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const match = PERCENT_CROP.exec(raw)
  if (!match) return null
  const num = (part: string) => Math.min(100, Math.max(0, parseFloat(part)))
  let x = num(match[1])
  let y = num(match[2])
  const w = Math.max(2, num(match[3]))
  const h = Math.max(2, num(match[4]))
  x = Math.min(x, 100 - w)
  y = Math.min(y, 100 - h)
  const round = (n: number) => Math.round(n * 10) / 10
  return `${round(x)}% ${round(y)}% ${round(w)}% ${round(h)}%`
}

export function normalizeBannerZoom(value: unknown): number {
  const zoom = Number(value)
  if (!Number.isFinite(zoom) || zoom <= 0) return 1
  return Math.min(MAX_BANNER_ZOOM, Math.max(1, Math.round(zoom * 1000) / 1000))
}

export function normalizeBannerPosition(value: unknown): BannerPosition {
  const raw = String(value ?? '').trim()
  const match = PERCENT_POSITION.exec(raw)
  if (match) {
    const x = Math.min(100, Math.max(0, parseFloat(match[1])))
    const y = Math.min(100, Math.max(0, parseFloat(match[2])))
    return `${x}% ${y}%`
  }
  return ANCHOR_POSITIONS[raw] ?? ANCHOR_POSITIONS.center
}
