<template>
  <div ref="scrollEl" class="lyrics-view" :class="{ unsynced: !lyrics.synced }" @wheel="pauseAutoScroll" @touchmove="pauseAutoScroll">
    <div v-if="loading" class="lyrics-state">
      <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
    </div>

    <div v-else-if="!lyrics.lines.length" class="lyrics-state lyrics-empty">
      <v-icon icon="mdi-text-box-search-outline" size="56" class="mb-3"></v-icon>
      <div class="text-title-medium">Текст не найден</div>
      <div class="lyrics-hint">Положите файл .lrc рядом с треком или добавьте текст в теги</div>
    </div>

    <template v-else>
      <button
        v-for="(line, i) in lyrics.lines"
        :key="i"
        class="lyrics-line"
        :class="{
          active: lyrics.synced && i === activeIndex,
          past: lyrics.synced && i < activeIndex,
          'active-solo': lyrics.synced && i === activeIndex && !(line.w && line.w.length),
        }"
        :disabled="line.t === null"
        @click="line.t !== null && $emit('seek', line.t)"
      >
        <template v-if="lyrics.synced && i === activeIndex && line.w && line.w.length">
          <span v-for="(word, wi) in line.w" :key="wi" class="lyrics-word" :class="{ sung: nowMs >= word.t }">{{ word.text }}</span>
        </template>
        <template v-else>{{ line.text }}</template>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { LyricsResult } from '@/api'

const props = defineProps<{
  lyrics: LyricsResult
  loading: boolean
  activeIndex: number
  nowMs: number
}>()
defineEmits<{ (e: 'seek', ms: number): void }>()

const scrollEl = ref<HTMLElement | null>(null)
const autoScroll = ref(true)
let timer: number | undefined

function pauseAutoScroll(): void {
  autoScroll.value = false
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    autoScroll.value = true
  }, 4000)
}

function scrollToActive(): void {
  const box = scrollEl.value
  if (!box || props.activeIndex < 0 || !autoScroll.value) return
  const line = box.querySelectorAll<HTMLElement>('.lyrics-line')[props.activeIndex]
  if (!line) return
  const top = line.offsetTop - box.clientHeight / 2 + line.clientHeight / 2
  box.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}

watch(
  () => props.activeIndex,
  () => nextTick(scrollToActive)
)

onMounted(() => nextTick(scrollToActive))
onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<style scoped>
.lyrics-view {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 12px 40px;
  text-align: left;
  scroll-behavior: smooth;
  scroll-padding: 24px 0;
}
.lyrics-line {
  display: block;
  width: 100%;
  margin: 1px 0;
  padding: 6px 12px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  font-family: inherit;
  font-size: clamp(15px, 0.9vw, 17px);
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s var(--m3-ease-standard), color 0.2s var(--m3-ease-standard);
}
.lyrics-line:hover {
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
}
.lyrics-line.past {
  color: var(--md-sys-color-outline);
}
.lyrics-line.active {
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  font-weight: 700;
  animation: lyrics-pop 0.35s var(--m3-ease-spring);
}
@keyframes lyrics-pop {
  0% { transform: scale(0.985); }
  60% { transform: scale(1.012); }
  100% { transform: scale(1); }
}
/* Строка без word-таймкодов целиком выделяется акцентом */
.lyrics-line.active-solo {
  color: var(--md-sys-color-primary);
  background: rgba(var(--md-sys-color-primary-rgb, 208, 188, 255), 0.1);
}
.lyrics-word {
  display: inline-block;
  margin-right: 0.26em;
  transition: color 0.2s var(--m3-ease-standard);
}
.lyrics-word:last-child {
  margin-right: 0;
}
.lyrics-word.sung {
  color: var(--md-sys-color-primary);
}
.lyrics-line:disabled {
  cursor: default;
}
.lyrics-view.unsynced .lyrics-line {
  cursor: default;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant);
}
.lyrics-view.unsynced .lyrics-line:hover {
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
}
.lyrics-state {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--md-sys-color-on-surface-variant);
  text-align: center;
  padding: 0 16px;
}
.lyrics-hint {
  font-size: 13px;
  opacity: 0.7;
  margin-top: 4px;
}
</style>
