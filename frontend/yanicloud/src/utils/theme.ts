import { ref } from 'vue'

export interface AccentPalette {
  id: string
  name: string
  primary: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
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

export function setAccentId(id: string): void {
  localStorage.setItem(KEY, id)
  applyAccent(id)
}

export function applyAccent(id: string): void {
  const p = getAccent(id)
  currentPrimary.value = p.primary
  const r = document.documentElement.style
  r.setProperty('--md-sys-color-primary', p.primary)
  r.setProperty('--md-sys-color-on-primary', p.onPrimary)
  r.setProperty('--md-sys-color-primary-container', p.primaryContainer)
  r.setProperty('--md-sys-color-on-primary-container', p.onPrimaryContainer)
}
