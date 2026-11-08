function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** Полная дата и время: «24 окт 2026, 17:09». */
export function formatDateTimeFull(value?: number | string | null): string | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const d = typeof value === 'number' ? new Date(value) : new Date(String(value))
  if (Number.isNaN(d.getTime())) return undefined
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Длительность: 3:45 или 1:02:03. */
export function formatDuration(seconds?: number | null): string | undefined {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return undefined
  const total = Math.max(0, Math.round(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/** Выдержка: 1/125 с или 2.5 с. */
export function formatExposure(t?: number | null): string | undefined {
  if (t === null || t === undefined || !Number.isFinite(t) || t <= 0) return undefined
  if (t >= 1) return `${Math.round(t * 10) / 10} с`
  return `1/${Math.round(1 / t)} с`
}

export function formatAperture(n?: number | null): string | undefined {
  if (n === null || n === undefined || !Number.isFinite(n) || n <= 0) return undefined
  return `ƒ/${Math.round(n * 10) / 10}`
}

export function formatFocal(n?: number | null): string | undefined {
  if (n === null || n === undefined || !Number.isFinite(n) || n <= 0) return undefined
  return `${Math.round(n * 10) / 10} мм`
}

export function formatFps(n?: number | null): string | undefined {
  if (n === null || n === undefined || !Number.isFinite(n) || n <= 0) return undefined
  return `${Math.round(n * 100) / 100} к/с`
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/** Соотношение сторон: 16:9. */
export function aspectRatio(w?: number | null, h?: number | null): string | undefined {
  if (!w || !h || !Number.isFinite(w) || !Number.isFinite(h)) return undefined
  const d = gcd(Math.round(w), Math.round(h))
  if (!d) return undefined
  return `${Math.round(w) / d}:${Math.round(h) / d}`
}

export function megapixels(w?: number | null, h?: number | null): string | undefined {
  if (!w || !h) return undefined
  const mp = (w * h) / 1_000_000
  return `${Math.round(mp * 10) / 10} Мп`
}

export function kindLabel(kind?: string): string {
  switch (kind) {
    case 'image':
      return 'Изображение'
    case 'video':
      return 'Видео'
    case 'audio':
      return 'Аудио'
    case 'pdf':
      return 'PDF-документ'
    case 'office':
      return 'Офисный документ'
    case 'text':
      return 'Текст'
    default:
      return 'Файл'
  }
}

export function formatBitrate(bps?: number | null): string | undefined {
  if (!bps || !Number.isFinite(bps)) return undefined
  if (bps >= 1_000_000) return `${Math.round((bps / 1_000_000) * 10) / 10} Мбит/с`
  return `${Math.round(bps / 1000)} кбит/с`
}

export function formatSampleRate(hz?: number | null): string | undefined {
  if (!hz || !Number.isFinite(hz)) return undefined
  return `${Math.round((hz / 1000) * 10) / 10} кГц`
}

export function formatGeo(n?: number | null): string | undefined {
  if (n === null || n === undefined || !Number.isFinite(n)) return undefined
  return n.toFixed(6)
}
