import { ref } from 'vue'

export interface AccentPalette {
  id: string
  name: string
  primary: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
}

export interface AccentScheme {
  background: string
  onBackground: string
  surface: string
  surfaceContainerLowest: string
  surfaceContainerLow: string
  surfaceContainer: string
  surfaceContainerHigh: string
  surfaceContainerHighest: string
  onSurface: string
  onSurfaceVariant: string
  outline: string
  outlineVariant: string
  primary: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
  backgroundRgb: string
  surfaceContainerLowRgb: string
  surfaceContainerRgb: string
  surfaceContainerHighRgb: string
  onSurfaceRgb: string
  onSurfaceVariantRgb: string
  outlineRgb: string
  primaryRgb: string
}

export const ACCENTS: AccentPalette[] = [
  { id: 'purple', name: 'Фиолетовый', primary: '#D0BCFF', onPrimary: '#381E72', primaryContainer: '#4F378B', onPrimaryContainer: '#EADDFF' },
  { id: 'blue', name: 'Синий', primary: '#ADC6FF', onPrimary: '#002E69', primaryContainer: '#284777', onPrimaryContainer: '#D8E2FF' },
  { id: 'cyan', name: 'Голубой', primary: '#80D6EE', onPrimary: '#00363F', primaryContainer: '#004E5A', onPrimaryContainer: '#B5EBF7' },
  { id: 'green', name: 'Зелёный', primary: '#A1F1C5', onPrimary: '#0A3B21', primaryContainer: '#2A5538', onPrimaryContainer: '#C3F7D7' },
  { id: 'orange', name: 'Оранжевый', primary: '#FFB68C', onPrimary: '#4A2700', primaryContainer: '#6C3C00', onPrimaryContainer: '#FFDCC3' },
  { id: 'pink', name: 'Розовый', primary: '#FFB1C8', onPrimary: '#5F1133', primaryContainer: '#7C2A4A', onPrimaryContainer: '#FFD9E2' },
  { id: 'red', name: 'Красный', primary: '#FFB4AB', onPrimary: '#690005', primaryContainer: '#93000A', onPrimaryContainer: '#FFDAD6' },
]

const KEY = 'yanicloud_accent'
const DEFAULT = 'purple'

export const currentPrimary = ref<string>(getAccent(DEFAULT).primary)

export function getAccent(id: string): AccentPalette {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]
}

export function getAccentId(): string {
  return localStorage.getItem(KEY) || DEFAULT
}

export function setAccentId(id: string): AccentScheme {
  localStorage.setItem(KEY, id)
  return applyAccent(id)
}

/* ── Цветовые преобразования ──────────────────────────────────────────── */

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

function rgbToHue(r: number, g: number, b: number): number {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  if (d === 0) return 0
  let h: number
  if (max === rn) h = ((gn - bn) / d) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  h *= 60
  return h < 0 ? h + 360 : h
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = clamp(s, 0, 100) / 100
  const ln = clamp(l, 0, 100) / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0
  let g = 0
  let b = 0
  if (hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = ln - c / 2
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

function hex(rgb: [number, number, number]): string {
  return `#${rgb.map((v) => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('')}`
}

function rgbTriplet(rgb: [number, number, number]): string {
  return rgb.join(', ')
}

/* ── Тональная схема из оттенка акцента ───────────────────────────────── */

export function buildScheme(palette: AccentPalette): AccentScheme {
  const [pr, pg, pb] = hexToRgb(palette.primary)
  const hue = rgbToHue(pr, pg, pb)

  const tone = (s: number, l: number): string => hex(hslToRgb(hue, s, l))
  const rgbOf = (s: number, l: number): string => rgbTriplet(hslToRgb(hue, s, l))

  return {
    background: tone(12, 8),
    onBackground: tone(8, 90),
    surface: tone(12, 8),
    surfaceContainerLowest: tone(12, 6),
    surfaceContainerLow: tone(9, 11),
    surfaceContainer: tone(9, 13.5),
    surfaceContainerHigh: tone(8, 18),
    surfaceContainerHighest: tone(8, 22.5),
    onSurface: tone(8, 90),
    onSurfaceVariant: tone(7, 80),
    outline: tone(5, 60),
    outlineVariant: tone(7, 30),
    primary: palette.primary,
    onPrimary: palette.onPrimary,
    primaryContainer: palette.primaryContainer,
    onPrimaryContainer: palette.onPrimaryContainer,
    backgroundRgb: rgbOf(12, 8),
    surfaceContainerLowRgb: rgbOf(9, 11),
    surfaceContainerRgb: rgbOf(9, 13.5),
    surfaceContainerHighRgb: rgbOf(8, 18),
    onSurfaceRgb: rgbOf(8, 90),
    onSurfaceVariantRgb: rgbOf(7, 80),
    outlineRgb: rgbOf(5, 60),
    primaryRgb: `${pr}, ${pg}, ${pb}`,
  }
}

export function applyAccent(id: string): AccentScheme {
  const palette = getAccent(id)
  const scheme = buildScheme(palette)
  currentPrimary.value = palette.primary

  const r = document.documentElement.style
  r.setProperty('--md-sys-color-background', scheme.background)
  r.setProperty('--md-sys-color-on-background', scheme.onBackground)
  r.setProperty('--md-sys-color-surface', scheme.surface)
  r.setProperty('--md-sys-color-surface-container-lowest', scheme.surfaceContainerLowest)
  r.setProperty('--md-sys-color-surface-container-low', scheme.surfaceContainerLow)
  r.setProperty('--md-sys-color-surface-container', scheme.surfaceContainer)
  r.setProperty('--md-sys-color-surface-container-high', scheme.surfaceContainerHigh)
  r.setProperty('--md-sys-color-surface-container-highest', scheme.surfaceContainerHighest)
  r.setProperty('--md-sys-color-on-surface', scheme.onSurface)
  r.setProperty('--md-sys-color-on-surface-variant', scheme.onSurfaceVariant)
  r.setProperty('--md-sys-color-outline', scheme.outline)
  r.setProperty('--md-sys-color-outline-variant', scheme.outlineVariant)
  r.setProperty('--md-sys-color-primary', scheme.primary)
  r.setProperty('--md-sys-color-on-primary', scheme.onPrimary)
  r.setProperty('--md-sys-color-primary-container', scheme.primaryContainer)
  r.setProperty('--md-sys-color-on-primary-container', scheme.onPrimaryContainer)

  r.setProperty('--md-sys-color-background-rgb', scheme.backgroundRgb)
  r.setProperty('--md-sys-color-surface-container-low-rgb', scheme.surfaceContainerLowRgb)
  r.setProperty('--md-sys-color-surface-container-rgb', scheme.surfaceContainerRgb)
  r.setProperty('--md-sys-color-surface-container-high-rgb', scheme.surfaceContainerHighRgb)
  r.setProperty('--md-sys-color-on-surface-rgb', scheme.onSurfaceRgb)
  r.setProperty('--md-sys-color-on-surface-variant-rgb', scheme.onSurfaceVariantRgb)
  r.setProperty('--md-sys-color-outline-rgb', scheme.outlineRgb)
  r.setProperty('--md-sys-color-primary-rgb', scheme.primaryRgb)

  return scheme
}

/** Цвета для Vuetify: оба варианта ключей, чтобы компоненты не оставались фиолетовыми. */
export function vuetifyThemeColors(scheme: AccentScheme): Record<string, string> {
  return {
    primary: scheme.primary,
    'on-primary': scheme.onPrimary,
    'primary-container': scheme.primaryContainer,
    'on-primary-container': scheme.onPrimaryContainer,
    primaryContainer: scheme.primaryContainer,
    onPrimaryContainer: scheme.onPrimaryContainer,
    background: scheme.background,
    surface: scheme.surface,
    'on-background': scheme.onBackground,
    'on-surface': scheme.onSurface,
    onSurface: scheme.onSurface,
    'on-surface-variant': scheme.onSurfaceVariant,
    onSurfaceVariant: scheme.onSurfaceVariant,
    'surface-variant': scheme.surfaceContainerHigh,
    surfaceVariant: scheme.surfaceContainerHigh,
    'secondary-container': scheme.surfaceContainerHigh,
    'on-secondary-container': scheme.onSurface,
    secondaryContainer: scheme.surfaceContainerHigh,
    onSecondaryContainer: scheme.onSurface,
    outline: scheme.outline,
    'outline-variant': scheme.outlineVariant,
  }
}
