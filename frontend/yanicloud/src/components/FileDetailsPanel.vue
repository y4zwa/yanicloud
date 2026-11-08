<template>
  <aside class="details-panel" :class="variant" @click.stop>
    <header class="details-header">
      <div class="overflow-hidden">
        <div class="text-title-medium font-weight-bold text-on-surface">Подробности</div>
        <div class="text-body-2 text-on-surface-variant text-truncate">{{ node.name }}</div>
      </div>
      <v-btn icon="mdi-close" variant="text" size="small" color="on-surface-variant" @click="$emit('close')"></v-btn>
    </header>

    <div class="details-scroll">
      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
      </div>

      <div v-else-if="error" class="details-empty">
        <v-icon icon="mdi-alert-circle-outline" color="error" size="40" class="mb-3"></v-icon>
        <div class="text-body-1 text-on-surface-variant text-center">{{ error }}</div>
      </div>

      <template v-else>
        <section class="details-section">
          <div class="details-section-title">Файл</div>
          <div v-for="row in baseRows" :key="row.label" class="details-row">
            <div class="details-label">{{ row.label }}</div>
            <div class="details-value">{{ row.value }}</div>
            <button class="details-copy" title="Копировать" @click="copy(row.label, row.value)">
              <v-icon :icon="copied === row.label ? 'mdi-check' : 'mdi-content-copy'" size="14"></v-icon>
            </button>
          </div>
        </section>

        <section v-if="imageRows.length" class="details-section">
          <div class="details-section-title">Изображение</div>
          <div v-for="row in imageRows" :key="row.label" class="details-row">
            <div class="details-label">{{ row.label }}</div>
            <div class="details-value">{{ row.value }}</div>
          </div>
        </section>

        <section v-if="exifRows.length" class="details-section">
          <div class="details-section-title">Съёмка</div>
          <div v-for="row in exifRows" :key="row.label" class="details-row">
            <div class="details-label">{{ row.label }}</div>
            <div class="details-value">{{ row.value }}</div>
          </div>
        </section>

        <section v-if="gpsRows.length" class="details-section">
          <div class="details-section-title">Геолокация</div>
          <div v-for="row in gpsRows" :key="row.label" class="details-row">
            <div class="details-label">{{ row.label }}</div>
            <div class="details-value">{{ row.value }}</div>
          </div>
          <a v-if="osmUrl" class="details-map-link" :href="osmUrl" target="_blank" rel="noopener noreferrer">
            <v-icon icon="mdi-map-marker-outline" size="16"></v-icon>
            Открыть на карте
          </a>
        </section>

        <section v-if="audioRows.length" class="details-section">
          <div class="details-section-title">Аудио</div>
          <div v-for="row in audioRows" :key="row.label" class="details-row">
            <div class="details-label">{{ row.label }}</div>
            <div class="details-value">{{ row.value }}</div>
          </div>
        </section>

        <section v-if="videoRows.length" class="details-section">
          <div class="details-section-title">Видео</div>
          <div v-for="row in videoRows" :key="row.label" class="details-row">
            <div class="details-label">{{ row.label }}</div>
            <div class="details-value">{{ row.value }}</div>
          </div>
        </section>

        <section v-if="rawTags.length" class="details-section">
          <div class="details-section-title d-flex align-center justify-space-between">
            <span>Все теги</span>
            <button v-if="hasMoreTags" class="details-toggle" @click="showAllTags = !showAllTags">
              {{ showAllTags ? 'Свернуть' : `Показать все (${rawTags.length})` }}
            </button>
          </div>
          <div v-for="tag in visibleTags" :key="tag.key" class="details-row">
            <div class="details-label">{{ tag.key }}</div>
            <div class="details-value">{{ tag.value }}</div>
          </div>
        </section>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getFileDetails, type FileDetails, type NodeItem } from '@/api'
import { previewKind } from '@/utils/preview'
import { formatBytes } from '@/utils/format'
import {
  aspectRatio,
  formatAperture,
  formatBitrate,
  formatDateTimeFull,
  formatDuration,
  formatExposure,
  formatFocal,
  formatFps,
  formatGeo,
  formatSampleRate,
  kindLabel,
  megapixels,
} from '@/utils/metadata'

interface Row {
  label: string
  value: string
}

const props = withDefaults(defineProps<{ node: NodeItem; variant?: 'drawer' | 'dialog' | 'viewer' }>(), {
  variant: 'drawer',
})
defineEmits<{ (e: 'close'): void }>()

const details = ref<FileDetails | null>(null)
const loading = ref(false)
const error = ref('')
const showAllTags = ref(false)
const copied = ref('')

const kind = computed(() => details.value?.kind ?? previewKind(props.node.name, props.node.mimeType))
const meta = computed<Record<string, any>>(() => details.value?.metadata ?? {})
const exif = computed<Record<string, any>>(() => meta.value.exif ?? {})

function present(rows: Row[]): Row[] {
  return rows.filter((r) => r.value !== undefined && r.value !== null && r.value !== '')
}

const baseRows = computed<Row[]>(() => {
  const d = details.value
  return present([
    { label: 'Имя', value: d?.name ?? props.node.name },
    { label: 'Тип', value: kindLabel(kind.value) },
    { label: 'Размер', value: formatBytes(d?.size ?? props.node.size) },
    { label: 'MIME-тип', value: d?.mimeType ?? props.node.mimeType ?? '' },
    { label: 'Создан', value: formatDateTimeFull(d?.createdAt) ?? '' },
    { label: 'Изменён', value: formatDateTimeFull(d?.updatedAt) ?? '' },
    { label: 'Избранное', value: d?.isFavorite ? 'Да' : '' },
  ])
})

const ORIENTATION: Record<number, string> = {
  1: 'Обычная',
  2: 'Отражено по горизонтали',
  3: 'Повёрнуто на 180°',
  4: 'Отражено по вертикали',
  5: 'Отражено и повёрнуто на 90°',
  6: 'Повёрнуто на 90°',
  7: 'Отражено и повёрнуто на 270°',
  8: 'Повёрнуто на 270°',
}

const imageRows = computed<Row[]>(() => {
  const m = meta.value
  if (kind.value !== 'image' || !m.width || !m.height) return []
  return present([
    { label: 'Разрешение', value: `${m.width} × ${m.height} px` },
    { label: 'Мегапиксели', value: megapixels(m.width, m.height) ?? '' },
    { label: 'Соотношение', value: aspectRatio(m.width, m.height) ?? '' },
    { label: 'Формат', value: m.format ? String(m.format).toUpperCase() : '' },
    { label: 'Цветовое пространство', value: m.colorSpace ?? '' },
    { label: 'Глубина цвета', value: m.depth ? String(m.depth) : '' },
    { label: 'Альфа-канал', value: m.hasAlpha ? 'Да' : '' },
    { label: 'Ориентация', value: m.orientation ? (ORIENTATION[m.orientation] ?? `#${m.orientation}`) : '' },
    { label: 'Плотность', value: m.density ? `${m.density} dpi` : '' },
  ])
})

const exifRows = computed<Row[]>(() => {
  const e = exif.value
  if (!e || !Object.keys(e).length) return []
  const camera = [e.make, e.model].filter(Boolean).join(' ')
  return present([
    { label: 'Камера', value: camera },
    { label: 'Объектив', value: e.lens ?? '' },
    { label: 'Снято', value: formatDateTimeFull(e.dateTaken) ?? '' },
    { label: 'Выдержка', value: formatExposure(e.exposureTime) ?? '' },
    { label: 'Диафрагма', value: formatAperture(e.fNumber) ?? '' },
    { label: 'ISO', value: e.iso !== undefined ? String(e.iso) : '' },
    { label: 'Фокусное расстояние', value: formatFocal(e.focalLength) ?? '' },
    { label: 'Эквивалент 35 мм', value: formatFocal(e.focalLength35) ?? '' },
    { label: 'Программа съёмки', value: e.exposureProgram ?? '' },
    { label: 'Экспокоррекция', value: e.exposureBias !== undefined ? `${e.exposureBias} EV` : '' },
    { label: 'Вспышка', value: e.flash ?? '' },
    { label: 'Баланс белого', value: e.whiteBalance ?? '' },
    { label: 'Режим замера', value: e.meteringMode ?? '' },
    { label: 'ПО', value: e.software ?? '' },
    { label: 'Автор', value: e.artist ?? '' },
    { label: 'Копирайт', value: e.copyright ?? '' },
  ])
})

const gpsRows = computed<Row[]>(() => {
  const g = exif.value?.gps
  if (!g) return []
  return present([
    { label: 'Широта', value: formatGeo(g.latitude) ?? '' },
    { label: 'Долгота', value: formatGeo(g.longitude) ?? '' },
    { label: 'Высота', value: g.altitude !== undefined ? `${Math.round(g.altitude)} м` : '' },
  ])
})

const osmUrl = computed(() => {
  const g = exif.value?.gps
  if (!g) return ''
  const lat = Number(g.latitude)
  const lon = Number(g.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return ''
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`
})

const audioRows = computed<Row[]>(() => {
  const a = meta.value
  if (kind.value !== 'audio') return []
  return present([
    { label: 'Название', value: a.title ?? '' },
    { label: 'Исполнитель', value: a.artist ?? '' },
    { label: 'Альбом', value: a.album ?? '' },
    { label: 'Год', value: a.year ? String(a.year) : '' },
    { label: 'Жанр', value: a.genre ?? '' },
    { label: 'Трек', value: a.track ?? '' },
    { label: 'Длительность', value: formatDuration(a.duration) ?? '' },
    { label: 'Битрейт', value: formatBitrate(a.bitrate) ?? '' },
    { label: 'Частота дискретизации', value: formatSampleRate(a.sampleRate) ?? '' },
    { label: 'Каналы', value: a.channels ? String(a.channels) : '' },
    { label: 'Кодек', value: a.codec ?? '' },
    { label: 'Без потерь', value: a.lossless ? 'Да' : '' },
    { label: 'Обложка', value: a.hasCover ? 'Есть' : '' },
  ])
})

const videoRows = computed<Row[]>(() => {
  if (kind.value !== 'video') return []
  const m = meta.value
  const v = m.video ?? {}
  const a = m.audio ?? {}
  return present([
    { label: 'Разрешение', value: v.width && v.height ? `${v.width} × ${v.height} px` : '' },
    { label: 'Длительность', value: formatDuration(m.duration) ?? '' },
    { label: 'Формат', value: m.container ?? m.format ?? '' },
    { label: 'Кодек видео', value: v.codec ?? '' },
    { label: 'Частота кадров', value: formatFps(v.fps) ?? '' },
    { label: 'Битрейт', value: formatBitrate(m.bitrate) ?? '' },
    { label: 'Аудиокодек', value: a.codec ?? '' },
    { label: 'Частота аудио', value: formatSampleRate(a.sampleRate) ?? '' },
    { label: 'Каналы', value: a.channels ? String(a.channels) : '' },
    { label: 'Заголовок', value: m.tags?.title ?? '' },
  ])
})

const rawTags = computed<{ key: string; value: string }[]>(() => {
  const tags = meta.value.tags
  if (!tags || typeof tags !== 'object') return []
  return Object.entries(tags).map(([key, value]) => ({ key, value: String(value) }))
})
const TAGS_PREVIEW = 10
const hasMoreTags = computed(() => rawTags.value.length > TAGS_PREVIEW)
const visibleTags = computed(() => (showAllTags.value ? rawTags.value : rawTags.value.slice(0, TAGS_PREVIEW)))

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  details.value = null
  showAllTags.value = false
  try {
    details.value = await getFileDetails(props.node.id)
  } catch (e: any) {
    error.value = e?.message || 'Не удалось получить подробности'
  } finally {
    loading.value = false
  }
}

async function copy(label: string, value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = label
    window.setTimeout(() => {
      if (copied.value === label) copied.value = ''
    }, 1200)
  } catch {
    /* clipboard может быть недоступен */
  }
}

watch(() => props.node.id, load, { immediate: true })
</script>

<style scoped>
.details-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  max-width: 92vw;
  display: flex;
  flex-direction: column;
  background: rgba(var(--md-sys-color-surface-container-low-rgb, 29, 27, 32), 0.96);
  backdrop-filter: blur(18px);
  border-left: 1px solid var(--md-sys-color-outline-variant);
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.45);
  z-index: 3;
  color: var(--md-sys-color-on-surface);
  animation: details-in 0.2s cubic-bezier(0.2, 0, 0, 1);
}
@keyframes details-in {
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.details-panel.dialog {
  position: relative;
  inset: auto;
  width: 460px;
  border-radius: 28px;
  border: 1px solid var(--md-sys-color-outline-variant);
  box-shadow: var(--md-sys-elevation-3);
  max-height: 82vh;
}
/* В полноэкранном просмотре фото — боковая плашка поверх кнопок и затемнения */
.details-panel.viewer {
  position: absolute;
  top: 16px;
  right: 16px;
  bottom: 16px;
  width: 420px;
  max-width: calc(100vw - 32px);
  z-index: 30;
  border-radius: 28px;
  border: 1px solid var(--md-sys-color-outline-variant);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
}
.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 16px 14px 22px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  flex-shrink: 0;
}
.details-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px 22px 32px;
  scrollbar-width: thin;
  scrollbar-color: var(--md-sys-color-outline-variant) transparent;
}
.details-section {
  padding: 16px 0 4px;
  border-bottom: 1px solid rgba(var(--md-sys-color-outline-rgb, 147, 143, 153), 0.2);
}
.details-section:last-child {
  border-bottom: none;
}
.details-section-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--md-sys-color-primary);
  margin-bottom: 10px;
}
.details-row {
  display: grid;
  grid-template-columns: 1fr 1.25fr 20px;
  gap: 10px;
  align-items: start;
  padding: 5px 0;
}
.details-label {
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.35;
}
.details-value {
  font-size: 13px;
  color: var(--md-sys-color-on-surface);
  line-height: 1.35;
  word-break: break-word;
  text-align: right;
}
.details-copy {
  opacity: 0;
  border: none;
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: opacity 0.15s;
}
.details-row:hover .details-copy {
  opacity: 1;
}
.details-map-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 10px;
  font-size: 13px;
  color: var(--md-sys-color-primary);
  text-decoration: none;
}
.details-toggle {
  border: none;
  background: transparent;
  color: var(--md-sys-color-primary);
  font-size: 12px;
  cursor: pointer;
  text-transform: none;
  letter-spacing: 0;
}
.details-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 12px;
}
</style>
