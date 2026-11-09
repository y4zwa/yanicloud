export type BannerFit = 'contain' | 'cover'

export const BANNER_POSITIONS = [
  'left top',
  'top',
  'right top',
  'left',
  'center',
  'right',
  'left bottom',
  'bottom',
  'right bottom',
] as const

export type BannerPosition = (typeof BANNER_POSITIONS)[number]

export function normalizeBannerFit(value: unknown): BannerFit {
  return value === 'cover' ? 'cover' : 'contain'
}

export function normalizeBannerPosition(value: unknown): BannerPosition {
  return (BANNER_POSITIONS as readonly string[]).includes(String(value))
    ? (value as BannerPosition)
    : 'center'
}
