<template>
  <div
    ref="stageEl"
    class="zoom-stage"
    :class="{ grabbing: dragging }"
    @wheel.prevent="onWheel"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @dblclick="onDoubleClick"
  >
    <div v-if="!loaded && !error" class="zoom-spinner">
      <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
    </div>
    <div v-if="error" class="zoom-error">
      <v-icon icon="mdi-image-off-outline" size="48" color="on-surface-variant"></v-icon>
      <div class="mt-3">Не удалось загрузить изображение</div>
    </div>
    <img
      v-show="!error"
      ref="imgEl"
      :src="src"
      class="zoom-img"
      :style="imgStyle"
      alt=""
      draggable="false"
      @load="onLoad"
      @error="error = true"
      @dragstart.prevent
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{ src: string; alt?: string }>()
const emit = defineEmits<{ (e: 'zoom', percent: number): void }>()

const MAX_SCALE = 8

const stageEl = ref<HTMLElement | null>(null)
const imgEl = ref<HTMLImageElement | null>(null)

const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const fitW = ref(0)
const fitH = ref(0)
const naturalW = ref(0)
const loaded = ref(false)
const error = ref(false)
const dragging = ref(false)
const pinching = ref(false)

const imgStyle = computed(() => ({
  transform: `translate3d(${tx.value}px, ${ty.value}px, 0) scale(${scale.value})`,
}))

watch(
  () => props.src,
  () => {
    loaded.value = false
    error.value = false
    reset()
  }
)

watch(scale, (v) => emit('zoom', Math.round(v * 100)))

function measure(): void {
  const im = imgEl.value
  const st = stageEl.value
  if (!im || !st) return
  const nw = im.naturalWidth || 0
  const nh = im.naturalHeight || 0
  naturalW.value = nw
  if (!nw || !nh) return
  const k = Math.min(st.clientWidth / nw, st.clientHeight / nh, 1)
  fitW.value = nw * k
  fitH.value = nh * k
}

function onLoad(): void {
  loaded.value = true
  measure()
  reset()
}

function clampScale(v: number): number {
  return Math.min(MAX_SCALE, Math.max(1, v))
}

function clampPan(): void {
  const st = stageEl.value
  if (!st) return
  const w = fitW.value * scale.value
  const h = fitH.value * scale.value
  const mx = Math.max(0, (w - st.clientWidth) / 2)
  const my = Math.max(0, (h - st.clientHeight) / 2)
  tx.value = Math.min(mx, Math.max(-mx, tx.value))
  ty.value = Math.min(my, Math.max(-my, ty.value))
}

function zoomAt(next: number, clientX: number, clientY: number): void {
  const st = stageEl.value
  if (!st) return
  const ns = clampScale(next)
  const s0 = scale.value
  if (Math.abs(ns - s0) < 0.0001) return
  const r = st.getBoundingClientRect()
  const px = clientX - r.left - r.width / 2
  const py = clientY - r.top - r.height / 2
  tx.value = px - (px - tx.value) * (ns / s0)
  ty.value = py - (py - ty.value) * (ns / s0)
  scale.value = ns
  if (ns <= 1.0001) {
    tx.value = 0
    ty.value = 0
  }
  clampPan()
}

function zoomIn(): void {
  const st = stageEl.value
  if (!st) return
  const r = st.getBoundingClientRect()
  zoomAt(scale.value * 1.4, r.left + r.width / 2, r.top + r.height / 2)
}

function zoomOut(): void {
  const st = stageEl.value
  if (!st) return
  const r = st.getBoundingClientRect()
  zoomAt(scale.value / 1.4, r.left + r.width / 2, r.top + r.height / 2)
}

function reset(): void {
  scale.value = 1
  tx.value = 0
  ty.value = 0
}

function actualSize(): void {
  const st = stageEl.value
  if (!st || !fitW.value) return
  const r = st.getBoundingClientRect()
  zoomAt(naturalW.value / fitW.value, r.left + r.width / 2, r.top + r.height / 2)
}

function onWheel(e: WheelEvent): void {
  zoomAt(scale.value * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY)
}

const pointers = new Map<number, { x: number; y: number }>()
let pinchStart: { dist: number; scale: number } | null = null
let last = { x: 0, y: 0 }

function onPointerDown(e: PointerEvent): void {
  if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  } catch {
    /* ignore */
  }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 1) {
    dragging.value = true
    last = { x: e.clientX, y: e.clientY }
  } else if (pointers.size === 2) {
    dragging.value = false
    pinching.value = true
    const [a, b] = [...pointers.values()]
    pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, scale: scale.value }
  }
}

function onPointerMove(e: PointerEvent): void {
  if (!pointers.has(e.pointerId)) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

  if (pointers.size >= 2 && pinchStart) {
    const [a, b] = [...pointers.values()]
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1
    zoomAt(pinchStart.scale * (dist / pinchStart.dist), (a.x + b.x) / 2, (a.y + b.y) / 2)
    return
  }
  if (!dragging.value) return
  tx.value += e.clientX - last.x
  ty.value += e.clientY - last.y
  last = { x: e.clientX, y: e.clientY }
  clampPan()
}

function onPointerUp(e: PointerEvent): void {
  pointers.delete(e.pointerId)
  if (pointers.size < 2) pinchStart = null
  if (pointers.size === 0) {
    dragging.value = false
    pinching.value = false
  }
}

function onDoubleClick(e: MouseEvent): void {
  if (scale.value > 1.05) reset()
  else zoomAt(2.5, e.clientX, e.clientY)
}

function onResize(): void {
  measure()
  clampPan()
}

onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => window.removeEventListener('resize', onResize))

defineExpose({ zoomIn, zoomOut, reset, actualSize })
</script>

<style scoped>
.zoom-stage {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: none;
  cursor: grab;
  background: var(--md-sys-color-surface-container-lowest, #0f0d13);
}
.zoom-stage.grabbing {
  cursor: grabbing;
}
.zoom-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform-origin: center center;
  user-select: none;
  -webkit-user-drag: none;
  will-change: transform;
}
.zoom-spinner,
.zoom-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 14px;
}
</style>
