<template>
  <div ref="rootEl" class="viewer-root" :class="{ 'is-dragging': dragging, 'no-anim': dragging || pinching }">
    <header class="viewer-toolbar" @pointerdown.stop @dblclick.stop>
      <div class="viewer-title-group">
        <div class="viewer-title">{{ node.name }}</div>
        <div v-if="canStepPreview" class="viewer-counter">{{ previewIndex + 1 }} / {{ previewList.length }}</div>
      </div>

      <div class="viewer-actions">
        <v-btn icon="mdi-rotate-left" variant="text" size="small" title="Повернуть (R)" @click="rotate(-90)"></v-btn>
        <v-btn icon="mdi-download" variant="text" size="small" title="Скачать" @click="download"></v-btn>
        <v-btn
          icon="mdi-information-outline"
          variant="text"
          size="small"
          title="Подробности"
          :color="previewShowDetails ? 'primary' : undefined"
          @click="previewShowDetails = !previewShowDetails"
        ></v-btn>
        <v-btn
          :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
          variant="text"
          size="small"
          title="Во весь экран (F)"
          @click="toggleFullscreen"
        ></v-btn>
        <v-btn icon="mdi-close" variant="text" size="small" title="Закрыть (Esc)" @click="closePreview"></v-btn>
      </div>
    </header>

    <div
      ref="stageEl"
      class="viewer-stage"
      :class="{ grabbing: dragging }"
      @wheel.prevent="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @dblclick="onDoubleClick"
    >
      <div v-if="loading || !loaded" class="viewer-spinner">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
      </div>

      <img
        ref="imgEl"
        :src="url"
        class="viewer-img"
        :style="imgStyle"
        alt=""
        draggable="false"
        @load="onLoad"
        @dragstart.prevent
      />

      <button v-if="hasPrevPreview" class="viewer-nav prev" title="Предыдущее (←)" @pointerdown.stop @click.stop="stepPreview(-1)">
        <v-icon icon="mdi-chevron-left" size="40"></v-icon>
      </button>
      <button v-if="hasNextPreview" class="viewer-nav next" title="Следующее (→)" @pointerdown.stop @click.stop="stepPreview(1)">
        <v-icon icon="mdi-chevron-right" size="40"></v-icon>
      </button>
    </div>

    <div v-if="previewShowDetails" class="viewer-details-scrim" @click="previewShowDetails = false"></div>

    <FileDetailsPanel v-if="previewShowDetails" :node="node" variant="viewer" @close="previewShowDetails = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { NodeItem } from '@/api'
import { downloadFile } from '@/api'
import FileDetailsPanel from '@/components/FileDetailsPanel.vue'
import {
  canStepPreview,
  closePreview,
  hasNextPreview,
  hasPrevPreview,
  previewIndex,
  previewList,
  previewShowDetails,
  stepPreview,
} from '@/store/preview'

const props = defineProps<{ node: NodeItem; url: string; loading?: boolean }>()

const MAX_SCALE = 8

const rootEl = ref<HTMLElement | null>(null)
const stageEl = ref<HTMLElement | null>(null)
const imgEl = ref<HTMLImageElement | null>(null)

const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const rotation = ref(0)
const fitW = ref(0)
const fitH = ref(0)
const loaded = ref(false)
const dragging = ref(false)
const pinching = ref(false)
const isFullscreen = ref(false)

const imgStyle = computed(() => ({
  transform: `translate3d(${tx.value}px, ${ty.value}px, 0) scale(${scale.value}) rotate(${rotation.value}deg)`,
}))

watch(
  () => props.node.id,
  () => {
    loaded.value = false
    resetView()
  }
)

function resetView(): void {
  scale.value = fitScale()
  tx.value = 0
  ty.value = 0
  rotation.value = 0
}

function measure(): void {
  const im = imgEl.value
  const st = stageEl.value
  if (!im || !st) return
  const nw = im.naturalWidth || 0
  const nh = im.naturalHeight || 0
  if (!nw || !nh) return
  const k = Math.min(st.clientWidth / nw, st.clientHeight / nh, 1)
  fitW.value = nw * k
  fitH.value = nh * k
}

function onLoad(): void {
  loaded.value = true
  measure()
  resetView()
}

function clampScale(v: number): number {
  return Math.min(MAX_SCALE, Math.max(fitScale(), v))
}

/** Минимальный масштаб, при котором картинка целиком влезает с учётом поворота. */
function fitScale(): number {
  const st = stageEl.value
  if (!st || !fitW.value || !fitH.value) return 1
  const rot = ((rotation.value % 360) + 360) % 360
  const swap = rot === 90 || rot === 270
  const w = swap ? fitH.value : fitW.value
  const h = swap ? fitW.value : fitH.value
  return Math.min(1, st.clientWidth / w, st.clientHeight / h)
}

function dims(): { w: number; h: number } {
  const rot = ((rotation.value % 360) + 360) % 360
  const swap = rot === 90 || rot === 270
  return {
    w: (swap ? fitH.value : fitW.value) * scale.value,
    h: (swap ? fitW.value : fitH.value) * scale.value,
  }
}

function clampPan(): void {
  const st = stageEl.value
  if (!st) return
  const { w, h } = dims()
  const mx = Math.max(0, (w - st.clientWidth) / 2)
  const my = Math.max(0, (h - st.clientHeight) / 2)
  tx.value = Math.min(mx, Math.max(-mx, tx.value))
  ty.value = Math.min(my, Math.max(-my, ty.value))
}

/** Зум с сохранением точки под курсором (координаты — клиентские, в px). */
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
  if (ns <= fitScale() + 0.0001) {
    tx.value = 0
    ty.value = 0
  }
  clampPan()
}

function zoomBy(factor: number): void {
  const st = stageEl.value
  if (!st) return
  const r = st.getBoundingClientRect()
  zoomAt(scale.value * factor, r.left + r.width / 2, r.top + r.height / 2)
}

function zoomIn(): void {
  zoomBy(1.5)
}

function zoomOut(): void {
  zoomBy(1 / 1.5)
}

function rotate(deg: number): void {
  rotation.value += deg
  tx.value = 0
  ty.value = 0
  scale.value = fitScale()
}

function onWheel(e: WheelEvent): void {
  const factor = Math.exp(-e.deltaY * 0.0015)
  zoomAt(scale.value * factor, e.clientX, e.clientY)
}

/* ── Панорамирование и pinch-зум ──────────────────────────────────────── */
const pointers = new Map<number, { x: number; y: number }>()
let pinchStart: { dist: number; scale: number } | null = null
let last = { x: 0, y: 0 }
let dragStart = { x: 0, y: 0 }
let movedX = 0
let movedY = 0
let dragged = false
let downOnImage = false

function onPointerDown(e: PointerEvent): void {
  if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  } catch {
    /* синтетические события и отпущенный указатель могут не поддерживать capture */
  }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 1) {
    downOnImage = !!(e.target as HTMLElement | null)?.closest?.('.viewer-img')
  }

  if (pointers.size === 1) {
    dragging.value = true
    dragged = true
    last = { x: e.clientX, y: e.clientY }
    dragStart = { x: e.clientX, y: e.clientY }
    movedX = 0
    movedY = 0
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
  const dx = e.clientX - last.x
  const dy = e.clientY - last.y
  last = { x: e.clientX, y: e.clientY }
  movedX = e.clientX - dragStart.x
  movedY = e.clientY - dragStart.y
  if (scale.value > fitScale() + 0.0001) {
    tx.value += dx
    ty.value += dy
    clampPan()
  }
}

function onPointerUp(e: PointerEvent): void {
  pointers.delete(e.pointerId)
  if (pointers.size < 2) pinchStart = null
  if (pointers.size === 0) {
    dragging.value = false
    pinching.value = false
    const tapped = dragged && Math.abs(movedX) < 6 && Math.abs(movedY) < 6
    // Свайп при масштабе «вписано» — переключение фото
    if (dragged && scale.value <= fitScale() + 0.0001 && Math.abs(movedX) > 80 && Math.abs(movedX) > Math.abs(movedY) * 1.4) {
      stepPreview(movedX < 0 ? 1 : -1)
    } else if (tapped && !downOnImage) {
      // Клик по пустому фону: сбрасываем зум, а если он и так вписан — закрываем
      if (scale.value > fitScale() + 0.0001) resetView()
      else closePreview()
    }
    dragged = false
  }
}

function onDoubleClick(e: MouseEvent): void {
  if (scale.value > fitScale() * 1.05) {
    resetView()
  } else {
    zoomAt(2.5, e.clientX, e.clientY)
  }
}

/* ── Полноэкранный режим ──────────────────────────────────────────────── */
async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else if (rootEl.value) {
      await rootEl.value.requestFullscreen()
    }
  } catch {
    /* браузер может запретить */
  }
}

function onFullscreenChange(): void {
  isFullscreen.value = !!document.fullscreenElement
}

/* ── Клавиатура ───────────────────────────────────────────────────────── */
function onKey(e: KeyboardEvent): void {
  const t = e.target as HTMLElement | null
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return

  switch (e.key) {
    case 'Escape':
      if (previewShowDetails.value) previewShowDetails.value = false
      else closePreview()
      e.preventDefault()
      break
    case 'ArrowLeft':
      stepPreview(-1)
      e.preventDefault()
      break
    case 'ArrowRight':
      stepPreview(1)
      e.preventDefault()
      break
    case '+':
    case '=':
      zoomIn()
      e.preventDefault()
      break
    case '-':
    case '_':
      zoomOut()
      e.preventDefault()
      break
    case '0':
      resetView()
      e.preventDefault()
      break
    case 'r':
    case 'R':
      rotate(90)
      e.preventDefault()
      break
    case 'f':
    case 'F':
      toggleFullscreen()
      e.preventDefault()
      break
  }
}

function onResize(): void {
  measure()
  clampPan()
}

function download(): void {
  downloadFile(props.node).catch(() => undefined)
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<style scoped>
.viewer-root {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #000;
  color: #fff;
}
.viewer-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px 40px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0));
  opacity: 1;
  transition: opacity 0.2s;
}
.viewer-title-group {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.viewer-title {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 44vw;
}
.viewer-counter {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.66);
  white-space: nowrap;
}
.viewer-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.viewer-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: none;
  cursor: grab;
}
.viewer-stage.grabbing {
  cursor: grabbing;
}
.viewer-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform-origin: center center;
  transition: transform 0.18s cubic-bezier(0.2, 0, 0, 1);
  will-change: transform;
  user-select: none;
  -webkit-user-drag: none;
}
.no-anim .viewer-img {
  transition: none;
}
.viewer-spinner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.viewer-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 18, 24, 0.55);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: background 0.15s, opacity 0.15s;
  opacity: 0.5;
  z-index: 2;
}
.viewer-nav:hover {
  background: rgba(20, 18, 24, 0.85);
  opacity: 1;
}
.viewer-nav.prev {
  left: 20px;
}
.viewer-nav.next {
  right: 20px;
}
.viewer-details-scrim {
  position: absolute;
  inset: 0;
  z-index: 29;
  background: rgba(0, 0, 0, 0.4);
  animation: m3-fade-in 0.2s var(--m3-ease-standard) both;
}
</style>
