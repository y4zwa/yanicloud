<template>
  <transition name="bar-fade">
    <div v-if="isOpen && track" class="player-bar">
      <div class="player-seek" ref="seekEl" @click="onSeekClick">
        <div class="player-seek-fill" :style="{ width: progressPct + '%' }"></div>
      </div>

      <div class="player-row">
        <div class="player-cover" :class="{ clickable: !!coverUrl }" @click="openCover">
          <img v-if="coverUrl" :src="coverUrl" class="player-cover-img" alt="" draggable="false" />
          <v-icon v-else icon="mdi-music-note" color="on-primary-container" size="28"></v-icon>
          <div v-if="coverUrl" class="player-cover-hint">
            <v-icon icon="mdi-magnify-plus-outline" size="20"></v-icon>
          </div>
        </div>

        <div class="player-info">
          <div class="text-title-medium font-weight-medium text-on-surface text-truncate">{{ track.name }}</div>
          <div class="text-body-2 text-on-surface-variant">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>
        </div>

        <div class="player-controls">
          <v-btn icon="mdi-skip-previous" variant="text" color="on-surface-variant" size="large" class="player-skip" @click="prev"></v-btn>
          <v-btn
            :icon="playing ? 'mdi-pause' : 'mdi-play'"
            color="primary"
            size="48"
            elevation="0"
            class="player-play mx-2"
            @click="toggle"
          ></v-btn>
          <v-btn icon="mdi-skip-next" variant="text" color="on-surface-variant" size="large" class="player-skip" @click="next"></v-btn>
        </div>

        <div class="player-volume">
          <v-btn
            :icon="muted || volume === 0 ? 'mdi-volume-off' : 'mdi-volume-high'"
            variant="text"
            color="on-surface-variant"
            size="small"
            @click="toggleMute"
          ></v-btn>
          <v-slider
            :model-value="muted ? 0 : volume"
            :max="1"
            step="0.01"
            color="primary"
            hide-details
            class="player-volume-slider"
            @update:model-value="setVolume"
          ></v-slider>
        </div>

        <v-btn
          icon="mdi-subtitles-outline"
          variant="text"
          size="small"
          :color="lyricsOpen ? 'primary' : 'on-surface-variant'"
          title="Текст песни"
          @click="toggleLyrics"
        ></v-btn>

        <v-btn
          icon="mdi-information-outline"
          variant="text"
          color="on-surface-variant"
          size="small"
          title="Подробности"
          @click="showDetails"
        ></v-btn>

        <v-btn icon="mdi-close" variant="text" color="on-surface-variant" size="small" @click="close"></v-btn>
      </div>

      <audio
        ref="audioEl"
        :src="url"
        preload="auto"
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @play="playing = true"
        @pause="playing = false"
        @ended="next"
        @canplay="onCanPlay"
      ></audio>
    </div>
  </transition>

  <!-- Панель текста справа -->
  <Teleport to="body">
    <Transition name="m3-slide-left">
      <aside v-if="isOpen && track && lyricsOpen" class="lyrics-side">
      <header class="lyrics-side-head">
        <div class="lyrics-side-title d-flex align-center overflow-hidden">
          <v-icon icon="mdi-subtitles-outline" size="22" color="on-surface-variant" class="mr-3 flex-shrink-0"></v-icon>
          <div class="overflow-hidden">
            <div class="text-title-medium font-weight-bold text-on-surface text-truncate">{{ track.name }}</div>
            <div class="text-body-2 text-on-surface-variant text-truncate">{{ sourceLabel }}</div>
          </div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          color="on-surface-variant"
          title="Закрыть"
          @click="lyricsOpen = false"
        ></v-btn>
      </header>

      <LyricsView
        :lyrics="lyrics"
        :loading="lyricsLoading"
        :active-index="activeIndex"
        :now-ms="nowMs"
        @seek="seekTo"
      />
      </aside>
    </Transition>
  </Teleport>

  <!-- Простое окно обложки -->
  <Teleport to="body">
    <CoverViewerDialog
      v-if="isOpen && track && coverDialogOpen && coverSrc"
      :src="coverSrc"
      :title="track.name"
      @close="coverDialogOpen = false"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { isOpen, currentTrack, next, prev, closePlayer } from '@/store/player'
import { openDetails } from '@/store/details'
import { lyricsOpen } from '@/store/lyrics'
import { getStreamUrl, getThumbUrls, getLyrics, getCoverUrl, type LyricsResult, type NodeItem } from '@/api'
import LyricsView from '@/components/LyricsView.vue'
import CoverViewerDialog from '@/components/CoverViewerDialog.vue'

const track = currentTrack
const url = ref('')
const coverUrl = ref('')
const audioEl = ref<HTMLAudioElement | null>(null)
const seekEl = ref<HTMLElement | null>(null)

const playing = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(loadVolume())
const muted = ref(false)
const wantPlay = ref(false)

const lyrics = ref<LyricsResult>({ lines: [], synced: false, source: 'none' })
const lyricsLoading = ref(false)

const coverDialogOpen = ref(false)
const coverFullUrl = ref('')
const coverSrc = computed(() => coverFullUrl.value || coverUrl.value)

const VOLUME_KEY = 'yanicloud_volume'

function loadVolume(): number {
  const v = parseFloat(localStorage.getItem(VOLUME_KEY) || '')
  return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 1
}

const progressPct = computed(() =>
  duration.value > 0 ? Math.min(100, (currentTime.value / duration.value) * 100) : 0
)

const sourceLabel = computed(() => {
  switch (lyrics.value.source) {
    case 'lrc':
      return 'Текст из .lrc-файла'
    case 'tags':
      return 'Текст из тегов файла'
    case 'lrclib':
      return 'Текст из LRCLIB'
    default:
      return 'Текст не найден'
  }
})

/** Индекс текущей строки по времени. */
const activeIndex = computed(() => {
  if (!lyrics.value.synced) return -1
  const ms = currentTime.value * 1000
  let idx = -1
  const lines = lyrics.value.lines
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].t
    if (t !== null && t <= ms) idx = i
  }
  return idx
})

const nowMs = computed(() => currentTime.value * 1000)

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec < 10 ? '0' : ''}${sec}`
}

function toggle(): void {
  const a = audioEl.value
  if (!a) return
  if (a.paused) a.play().catch(() => undefined)
  else a.pause()
}

function setVolume(v: number): void {
  volume.value = v
  muted.value = v === 0
  if (audioEl.value) audioEl.value.volume = v
  localStorage.setItem(VOLUME_KEY, String(v))
}

function toggleMute(): void {
  muted.value = !muted.value
  if (audioEl.value) audioEl.value.muted = muted.value
}

function onSeekClick(e: MouseEvent): void {
  const el = seekEl.value
  const a = audioEl.value
  if (!el || !a || !duration.value) return
  const rect = el.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  a.currentTime = ratio * duration.value
  currentTime.value = a.currentTime
}

function onLoadedMetadata(): void {
  if (audioEl.value) duration.value = audioEl.value.duration || 0
}

function onTimeUpdate(): void {
  if (audioEl.value) currentTime.value = audioEl.value.currentTime
}

function onCanPlay(): void {
  if (audioEl.value) audioEl.value.volume = muted.value ? 0 : volume.value
  if (wantPlay.value && audioEl.value) {
    wantPlay.value = false
    audioEl.value.play().catch(() => undefined)
  }
}

async function loadLyrics(t: NodeItem): Promise<void> {
  lyricsLoading.value = true
  lyrics.value = { lines: [], synced: false, source: 'none' }
  try {
    lyrics.value = await getLyrics(t.id)
  } catch {
    /* оставляем «не найдено» */
  } finally {
    lyricsLoading.value = false
  }
}

function openCover(): void {
  if (!track.value || !coverUrl.value) return
  coverDialogOpen.value = true
  if (coverFullUrl.value) return
  getCoverUrl(track.value.id)
    .then((u) => {
      coverFullUrl.value = u
    })
    .catch(() => {
      coverFullUrl.value = coverUrl.value
    })
}

function toggleLyrics(): void {
  lyricsOpen.value = !lyricsOpen.value
  if (lyricsOpen.value && track.value) loadLyrics(track.value)
}

function seekTo(ms: number | null): void {
  if (ms === null || !audioEl.value) return
  audioEl.value.currentTime = ms / 1000
  currentTime.value = audioEl.value.currentTime
}

function showDetails(): void {
  if (track.value) openDetails(track.value)
}

watch(
  track,
  async (t) => {
    coverDialogOpen.value = false
    if (!t) {
      url.value = ''
      coverUrl.value = ''
      coverFullUrl.value = ''
      lyrics.value = { lines: [], synced: false, source: 'none' }
      return
    }
    currentTime.value = 0
    duration.value = 0
    playing.value = false
    wantPlay.value = true
    coverUrl.value = ''
    coverFullUrl.value = ''
    lyrics.value = { lines: [], synced: false, source: 'none' }
    if (lyricsOpen.value) loadLyrics(t)
    getThumbUrls([t.id])
      .then((urls) => {
        coverUrl.value = urls[t.id] || ''
      })
      .catch(() => undefined)
    try {
      url.value = await getStreamUrl(t.id)
    } catch {
      url.value = ''
    }
  },
  { immediate: true }
)

function close(): void {
  closePlayer()
  url.value = ''
  wantPlay.value = false
  lyricsOpen.value = false
  coverDialogOpen.value = false
}
</script>

<style scoped>
.player-bar {
  position: fixed;
  left: 96px;
  right: 0;
  bottom: 0;
  height: 88px;
  background: var(--md-sys-color-surface-container-high);
  border-top: 1px solid var(--md-sys-color-outline-variant);
  z-index: 150;
  display: flex;
  flex-direction: column;
  padding: 0 24px;
  box-sizing: border-box;
}
.player-seek {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: var(--md-sys-color-surface-container-highest);
  cursor: pointer;
}
.player-seek-fill {
  height: 100%;
  background: var(--md-sys-color-primary);
  border-radius: 0 3px 3px 0;
  transition: width 0.14s linear;
}
.player-row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
}
.player-cover {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--md-sys-color-primary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.player-cover.clickable {
  cursor: pointer;
}
.player-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.player-cover-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.player-cover:hover .player-cover-hint {
  opacity: 1;
}
.player-info {
  min-width: 0;
  width: 220px;
  flex-shrink: 0;
}
.player-controls {
  display: flex;
  align-items: center;
  margin: 0 auto;
}
.player-play {
  background: var(--md-sys-color-primary) !important;
  color: var(--md-sys-color-on-primary) !important;
}
.player-volume {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.player-volume-slider {
  width: 120px;
}

/* Боковая панель текста */
.lyrics-side {
  position: fixed;
  top: 88px;
  right: 0;
  bottom: 88px;
  width: min(var(--lyrics-panel-width, 380px), 100vw);
  z-index: 120;
  display: flex;
  flex-direction: column;
  background: var(--md-sys-color-background);
  border-left: 1px solid rgba(var(--md-sys-color-outline-rgb, 147, 143, 153), 0.2);
}
.lyrics-side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 12px 12px 20px;
  border-bottom: 1px solid rgba(var(--md-sys-color-outline-rgb, 147, 143, 153), 0.2);
  flex-shrink: 0;
}
.lyrics-side-title {
  min-width: 0;
}

.bar-fade-enter-active {
  transition:
    transform 0.45s var(--m3-ease-spring),
    opacity 0.3s var(--m3-ease-standard);
}
.bar-fade-leave-active {
  transition:
    transform 0.24s var(--m3-ease-accelerate),
    opacity 0.2s var(--m3-ease-accelerate);
}
.bar-fade-enter-from,
.bar-fade-leave-to {
  transform: translateY(105%) scale(0.98);
  opacity: 0;
}
</style>
