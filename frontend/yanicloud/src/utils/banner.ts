export type BannerFit = 'contain' | 'cover'

export type BannerPosition =
  | 'left top'
  | 'top'
  | 'right top'
  | 'left'
  | 'center'
  | 'right'
  | 'left bottom'
  | 'bottom'
  | 'right bottom'

export interface BannerInfo {
  url: string | null
  fit: BannerFit
  position: BannerPosition
}

export const BANNER_POSITIONS: ReadonlyArray<{ value: BannerPosition; label: string }> = [
  { value: 'left top', label: 'Слева сверху' },
  { value: 'top', label: 'Сверху по центру' },
  { value: 'right top', label: 'Справа сверху' },
  { value: 'left', label: 'Слева по центру' },
  { value: 'center', label: 'По центру' },
  { value: 'right', label: 'Справа по центру' },
  { value: 'left bottom', label: 'Слева снизу' },
  { value: 'bottom', label: 'Снизу по центру' },
  { value: 'right bottom', label: 'Справа снизу' },
]
