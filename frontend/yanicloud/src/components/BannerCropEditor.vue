<template>
  <div
    ref="hostEl"
    class="banner-crop"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <img
      v-if="imageRect"
      class="banner-crop__image"
      :src="url"
      alt=""
      draggable="false"
      :style="imageStyle"
    />

    <div
      v-if="imageRect"
      ref="frameEl"
      class="banner-crop__frame"
      :class="{ 'banner-crop__frame--dragging': !!mode }"
      :style="frameStyle"
      role="group"
      tabindex="0"
      aria-label="Что оставить в кадре баннера"
      @keydown="onKeydown"
    >
      <span
        v-for="handle in HANDLES"
        :key="handle"
        class="banner-crop__handle"
        :class="`banner-crop__handle--${handle}`"
        @pointerdown.stop="startResize($event, handle)"
      ></span>
    </div>

    <div v-if="!imageRect" class="banner-crop__loading">
      <v-progress-circular indeterminate size="28" color="primary"></v-progress-circular>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { BannerCrop, BannerCropRect, BannerPosition } from '@/utils/banner'
import { bannerCropRect } from '@/utils/banner'

type Handle = 'n' | 's' | 'w' | 'e' | 'nw' | 'ne' | 'sw' | 'se'
type DragMode = 'move' | 'resize'

const HANDLES: Handle[] = ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']
const MIN_SIZE = 24

const props = defineProps<{
  url: string
  /** Свободный кадр; null — показываем старый кадр по position/zoom. */
  crop: BannerCrop | null
  position: BannerPosition
  zoom: number
  /** Пропорции плитки — только чтобы построить начальный кадр для старых баннеров. */
  aspect: number
}>()

const emit = defineEmits<{ (e: 'update:crop', value: BannerCrop): void }>()

const hostEl = ref<HTMLDivElement | null>(null)
const frameEl = ref<HTMLDivElement | null>(null)
const box = ref({ w: 0, h: 0 })
const natural = ref<{ w: number; h: number } | null>(null)
const frame = ref<BannerCropRect>({ x: 0, y: 0, w: 0, h: 0 })
const mode = ref<DragMode | null>(null)
const activeHandle = ref<Handle>('se')

let observer: ResizeObserver | null = null
let dragPointer = -1
let grab = { x: 0, y: 0 }
let resizeBase = { x: 0, y: 0, w: 0, h: 0 }

/* Картинка целиком вписана в область — рамка скользит по ней и показывает,
   какая часть попадёт в плитку. */
const imageRect = computed(() => {
  const size = natural.value
  if (!size || !box.value.w || !box.value.h) return null
  const scale = Math.min(box.value.w / size.w, box.value.h / size.h)
  const w = size.w * scale
  const h = size.h * scale
  return { x: (box.value.w - w) / 2, y: (box.value.h - h) / 2, w, h }
})

const imageStyle = computed(() => {
  const rect = imageRect.value
  if (!rect) return {}
  return { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.w}px`, height: `${rect.h}px` }
})

const frameStyle = computed(() => ({
  left: `${(imageRect.value?.x ?? 0) + frame.value.x}px`,
  top: `${(imageRect.value?.y ?? 0) + frame.value.y}px`,
  width: `${frame.value.w}px`,
  height: `${frame.value.h}px`,
}))

watch(
  () => props.url,
  (url) => {
    natural.value = null
    if (!url) return
    const img = new Image()
    img.onload = () => {
      if (props.url !== url) return
      if (img.naturalWidth && img.naturalHeight) {
        natural.value = { w: img.naturalWidth, h: img.naturalHeight }
      }
    }
    img.src = url
  },
  { immediate: true }
)

// Держим рамку там, где записано в настройках (и пересчитываем при смене области).
watch(
  [() => props.crop, () => props.position, () => props.zoom, () => props.aspect, imageRect],
  () => {
    if (mode.value) return
    const rect = imageRect.value
    if (!rect) return
    const crop = props.crop
    frame.value = crop
      ? { x: crop.x * rect.w, y: crop.y * rect.h, w: crop.w * rect.w, h: crop.h * rect.h }
      : bannerCropRect(rect.w, rect.h, props.aspect, props.position, props.zoom)
  },
  { immediate: true, flush: 'post' }
)

onMounted(() => {
  const el = hostEl.value
  if (!el) return
  const measure = () => {
    box.value = { w: el.clientWidth, h: el.clientHeight }
  }
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(el)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

function localPoint(event: PointerEvent): { x: number; y: number } | null {
  const el = hostEl.value
  const rect = imageRect.value
  if (!el || !rect) return null
  const bounds = el.getBoundingClientRect()
  return { x: event.clientX - bounds.left - rect.x, y: event.clientY - bounds.top - rect.y }
}

function onPointerDown(event: PointerEvent): void {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  const point = localPoint(event)
  const rect = imageRect.value
  if (!point || !rect) return
  if (point.x < 0 || point.y < 0 || point.x > rect.w || point.y > rect.h) return

  const current = frame.value
  const inside =
    point.x >= current.x &&
    point.x <= current.x + current.w &&
    point.y >= current.y &&
    point.y <= current.y + current.h

  if (inside) {
    grab = { x: point.x - current.x, y: point.y - current.y }
  } else {
    // клик мимо рамки — сразу переносим её центром в это место
    grab = { x: current.w / 2, y: current.h / 2 }
    moveTo(point.x - grab.x, point.y - grab.y)
  }

  mode.value = 'move'
  beginDrag(event)
}

function startResize(event: PointerEvent, handle: Handle): void {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  if (!imageRect.value) return
  resizeBase = { ...frame.value }
  activeHandle.value = handle
  mode.value = 'resize'
  beginDrag(event)
}

function beginDrag(event: PointerEvent): void {
  dragPointer = event.pointerId
  hostEl.value?.setPointerCapture(event.pointerId)
  frameEl.value?.focus({ preventScroll: true })
  event.preventDefault()
}

function onPointerMove(event: PointerEvent): void {
  if (!mode.value || event.pointerId !== dragPointer) return
  const point = localPoint(event)
  if (!point) return
  if (mode.value === 'resize') {
    resizeTo(point)
  } else {
    moveTo(point.x - grab.x, point.y - grab.y)
  }
}

function onPointerUp(event: PointerEvent): void {
  if (event.pointerId !== dragPointer) return
  mode.value = null
  dragPointer = -1
  if (hostEl.value?.hasPointerCapture(event.pointerId)) {
    hostEl.value.releasePointerCapture(event.pointerId)
  }
}

function onKeydown(event: KeyboardEvent): void {
  const step = event.shiftKey ? 1 : 10
  let dx = 0
  let dy = 0
  if (event.key === 'ArrowLeft') dx = -step
  else if (event.key === 'ArrowRight') dx = step
  else if (event.key === 'ArrowUp') dy = -step
  else if (event.key === 'ArrowDown') dy = step
  else return
  event.preventDefault()
  moveTo(frame.value.x + dx, frame.value.y + dy)
}

function moveTo(x: number, y: number): void {
  const rect = imageRect.value
  if (!rect) return
  const current = frame.value
  frame.value = {
    ...current,
    x: Math.min(rect.w - current.w, Math.max(0, x)),
    y: Math.min(rect.h - current.h, Math.max(0, y)),
  }
  emitCrop()
}

function resizeTo(point: { x: number; y: number }): void {
  const rect = imageRect.value
  if (!rect) return
  const base = resizeBase
  const handle = activeHandle.value
  let { x, y, w, h } = base

  // каждая сторона двигается независимо: ширина и высота не связаны
  if (handle.includes('e')) {
    w = Math.min(rect.w, Math.max(base.x + MIN_SIZE, point.x)) - base.x
  }
  if (handle.includes('w')) {
    const right = base.x + base.w
    x = Math.max(0, Math.min(right - MIN_SIZE, point.x))
    w = right - x
  }
  if (handle.includes('s')) {
    h = Math.min(rect.h, Math.max(base.y + MIN_SIZE, point.y)) - base.y
  }
  if (handle.includes('n')) {
    const bottom = base.y + base.h
    y = Math.max(0, Math.min(bottom - MIN_SIZE, point.y))
    h = bottom - y
  }

  frame.value = { x, y, w, h }
  emitCrop()
}

function emitCrop(): void {
  const rect = imageRect.value
  if (!rect) return
  const current = frame.value
  const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
  emit('update:crop', {
    x: clamp01(current.x / rect.w),
    y: clamp01(current.y / rect.h),
    w: clamp01(current.w / rect.w),
    h: clamp01(current.h / rect.h),
  })
}
</script>

<style scoped>
.banner-crop {
  position: relative;
  height: 320px;
  border-radius: 24px;
  overflow: hidden;
  background: var(--md-sys-color-surface-container-highest);
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.banner-crop:active {
  cursor: grabbing;
}
.banner-crop__image {
  position: absolute;
  display: block;
  pointer-events: none;
}
.banner-crop__frame {
  position: absolute;
  box-sizing: border-box;
  border: 2px solid #ffffff;
  border-radius: 16px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.35),
    0 0 0 9999px rgba(0, 0, 0, 0.52);
  cursor: grab;
  outline: none;
}
.banner-crop__frame--dragging {
  cursor: grabbing;
}
.banner-crop__frame:focus-visible {
  border-color: var(--md-sys-color-primary);
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--md-sys-color-primary) 55%, transparent),
    0 0 0 9999px rgba(0, 0, 0, 0.52);
}
.banner-crop__handle {
  position: absolute;
  box-sizing: border-box;
  border: 2px solid rgba(0, 0, 0, 0.28);
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}
.banner-crop__handle--n,
.banner-crop__handle--s {
  left: calc(50% - 14px);
  width: 28px;
  height: 10px;
  cursor: ns-resize;
}
.banner-crop__handle--n {
  top: -6px;
}
.banner-crop__handle--s {
  bottom: -6px;
}
.banner-crop__handle--w,
.banner-crop__handle--e {
  top: calc(50% - 14px);
  width: 10px;
  height: 28px;
  cursor: ew-resize;
}
.banner-crop__handle--w {
  left: -6px;
}
.banner-crop__handle--e {
  right: -6px;
}
.banner-crop__handle--nw,
.banner-crop__handle--ne,
.banner-crop__handle--sw,
.banner-crop__handle--se {
  width: 16px;
  height: 16px;
}
.banner-crop__handle--nw {
  top: -8px;
  left: -8px;
  cursor: nwse-resize;
}
.banner-crop__handle--ne {
  top: -8px;
  right: -8px;
  cursor: nesw-resize;
}
.banner-crop__handle--sw {
  bottom: -8px;
  left: -8px;
  cursor: nesw-resize;
}
.banner-crop__handle--se {
  bottom: -8px;
  right: -8px;
  cursor: nwse-resize;
}
.banner-crop__loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}
</style>
