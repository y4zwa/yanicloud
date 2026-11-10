export type BannerFit = 'contain' | 'cover'

/** Старое положение кадра из сетки 3×3 (для баннеров, сохранённых до рамки). */
export type BannerAnchor =
  | 'left top'
  | 'top'
  | 'right top'
  | 'left'
  | 'center'
  | 'right'
  | 'left bottom'
  | 'bottom'
  | 'right bottom'

/** Положение кадра: проценты по свободной оси картинки или старый якорь 3×3. */
export type BannerPosition = BannerAnchor | `${number}% ${number}%`

/**
 * Свободный кадр: доли картинки 0…1. Ширина и высота независимы,
 * в плитке кадр растягивается на её размер.
 */
export interface BannerCrop {
  x: number
  y: number
  w: number
  h: number
}

export interface BannerInfo {
  url: string | null
  fit: BannerFit
  position: BannerPosition
  /** Старое приближение относительно масштаба «Заполнить». 1 — без приближения. */
  zoom: number
  /** Свободный кадр в процентах картинки; null — баннер сохранён до свободной рамки. */
  crop: string | null
}

export interface BannerCropRect {
  x: number
  y: number
  w: number
  h: number
}

export const BANNER_MIN_ZOOM = 1
export const BANNER_MAX_ZOOM = 8

const ANCHORS: Record<BannerAnchor, { x: number; y: number }> = {
  'left top': { x: 0, y: 0 },
  top: { x: 50, y: 0 },
  'right top': { x: 100, y: 0 },
  left: { x: 0, y: 50 },
  center: { x: 50, y: 50 },
  right: { x: 100, y: 50 },
  'left bottom': { x: 0, y: 100 },
  bottom: { x: 50, y: 100 },
  'right bottom': { x: 100, y: 100 },
}

const PERCENT_POSITION = /^(\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)%$/
const PERCENT_CROP = /^(\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)%$/

/** Превращает сохранённое положение в проценты 0…100 по каждой оси. */
export function parseBannerPosition(position: BannerPosition): { x: number; y: number } {
  const match = PERCENT_POSITION.exec(position)
  if (match) {
    return { x: clamp01to100(parseFloat(match[1])), y: clamp01to100(parseFloat(match[2])) }
  }
  return ANCHORS[position as BannerAnchor] ?? ANCHORS.center
}

/** Собирает положение для CSS `object-position` из процентов по осям. */
export function formatBannerPosition(x: number, y: number): BannerPosition {
  const round = (value: number) => Math.round(clamp01to100(value) * 10) / 10
  return `${round(x)}% ${round(y)}%`
}

/** Разбирает сохранённый свободный кадр. */
export function parseBannerCrop(value: string | null | undefined): BannerCrop | null {
  if (!value) return null
  const match = PERCENT_CROP.exec(value)
  if (!match) return null
  const crop = {
    x: parseFloat(match[1]) / 100,
    y: parseFloat(match[2]) / 100,
    w: parseFloat(match[3]) / 100,
    h: parseFloat(match[4]) / 100,
  }
  if (!(crop.w > 0) || !(crop.h > 0)) return null
  return crop
}

export function formatBannerCrop(crop: BannerCrop): string {
  const pct = (value: number) => Math.round(clamp01(value) * 1000) / 10
  return `${pct(crop.x)}% ${pct(crop.y)}% ${pct(crop.w)}% ${pct(crop.h)}%`
}

export function clampBannerZoom(value: unknown): number {
  const zoom = Number(value)
  if (!Number.isFinite(zoom)) return BANNER_MIN_ZOOM
  return Math.min(BANNER_MAX_ZOOM, Math.max(BANNER_MIN_ZOOM, Math.round(zoom * 1000) / 1000))
}

/** Максимальный кадр пропорций плитки, который целиком влезает в картинку. */
export function bannerBaseCrop(
  imageW: number,
  imageH: number,
  aspect: number
): { w: number; h: number } {
  const w = Math.min(imageW, imageH * aspect)
  return { w, h: w / aspect }
}

/** Область картинки, которая попадёт в плитку при старых положении и приближении. */
export function bannerCropRect(
  imageW: number,
  imageH: number,
  aspect: number,
  position: BannerPosition,
  zoom: unknown
): BannerCropRect {
  const base = bannerBaseCrop(imageW, imageH, aspect)
  const factor = clampBannerZoom(zoom)
  const w = base.w / factor
  const h = base.h / factor
  const pct = parseBannerPosition(position)
  return {
    x: (pct.x / 100) * (imageW - w),
    y: (pct.y / 100) * (imageH - h),
    w,
    h,
  }
}

function clamp01to100(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}
