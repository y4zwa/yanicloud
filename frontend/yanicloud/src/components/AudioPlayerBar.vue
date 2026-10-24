<template>
  <transition name="bar-fade">
    <div v-if="isOpen && track" class="player-bar">
      <div class="player-seek" ref="seekEl" @click="onSeekClick">
        <div class="player-seek-fill" :style="{ width: progressPct + '%' }"></div>
      </div>

      <div class="player-row">
        <div class="player-cover">
          <img v-if="coverUrl" :src="coverUrl" class="player-cover-img" alt="" draggable="false" />
          <v-icon v-else icon="mdi-music-note" color="on-primary-container" size="28"></v-icon>
        </div>

        <div class="player-info">
          <div class="text-title-medium font-weight-medium text-on-surface text-truncate">{{ track.name }}</div>
          <div class="text-body-2 text-on-surface-variant">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>
        </div>

        <div class="player-controls">
          <v-btn icon="mdi-skip-previous" variant="text" color="on-surface-variant" size="large" @click="prev"></v-btn>
          <v-btn
            :icon="playing ? 'mdi-pause' : 'mdi-play'"
            color="primary"
            size="48"
            elevation="0"
            class="player-play mx-2"
            @click="toggle"
          ></v-btn>
          <v-btn icon="mdi-skip-next" variant="text" color="on-surface-variant" size="large" @click="next"></v-btn>
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
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { isOpen, currentTrack, next, prev, closePlayer } from '@/store/player'
import { getStreamUrl, getThumbUrls } from '@/api'

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

const VOLUME_KEY = 'yanicloud_volume'

function loadVolume(): number {
  const v = parseFloat(localStorage.getItem(VOLUME_KEY) || '')
  return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 1
}

const progressPct = computed(() =>
  duration.value > 0 ? Math.min(100, (currentTime.value / duration.value) * 100) : 0
)

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

watch(
  track,
  async (t) => {
    if (!t) {
      url.value = ''
      coverUrl.value = ''
      return
    }
    currentTime.value = 0
    duration.value = 0
    playing.value = false
    wantPlay.value = true
    coverUrl.value = ''
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
}
.player-row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
}
.player-cover {
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
.player-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
.bar-fade-enter-active,
.bar-fade-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.bar-fade-enter-from,
.bar-fade-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
