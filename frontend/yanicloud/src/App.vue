<template>
  <v-app class="m3-app-root">
    <!-- АВТОРИЗАЦИЯ -->
    <AuthView v-if="!authed" @authed="onAuthed" />

    <template v-else>
      <!-- M3 Navigation Rail -->
      <nav class="m3-nav-rail">
        <div class="m3-nav-rail__header">
          <v-btn icon variant="flat" color="transparent" class="m3-menu-btn" @click="goHome">
            <v-icon icon="mdi-cloud" color="primary" size="40"></v-icon>
          </v-btn>
        </div>

        <div class="m3-nav-rail__destinations">
          <div class="m3-nav-item" :class="{ active: currentView === 'files' }" v-ripple @click="switchView('files')">
            <div class="m3-nav-item__indicator">
              <v-icon icon="mdi-folder" size="28"></v-icon>
            </div>
            <span class="m3-nav-item__label">Файлы</span>
          </div>

          <div class="m3-nav-item" :class="{ active: currentView === 'favorites' }" v-ripple @click="switchView('favorites')">
            <div class="m3-nav-item__indicator">
              <v-icon icon="mdi-star-outline" size="28"></v-icon>
            </div>
            <span class="m3-nav-item__label">Избранное</span>
          </div>
        </div>

        <PinnedRail @goto-files="switchView('files')" />

        <div class="m3-nav-rail__footer">
          <div class="m3-nav-item" :class="{ active: currentView === 'trash' }" v-ripple @click="switchView('trash')">
            <div class="m3-nav-item__indicator">
              <v-icon icon="mdi-delete-outline" size="28"></v-icon>
            </div>
            <span class="m3-nav-item__label">Корзина</span>
          </div>
        </div>
      </nav>

      <!-- M3 Top App Bar -->
      <header class="m3-top-bar d-flex align-center">
        <div class="m3-search-bar d-flex align-center px-6">
          <v-icon icon="mdi-magnify" color="on-surface-variant" size="28" class="mr-4"></v-icon>
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Поиск в YaniCloud..."
            class="m3-search-input text-title-medium"
            @keydown.esc="clearSearch"
          />
        </div>

        <v-spacer></v-spacer>

        <v-btn icon="mdi-cog-outline" variant="text" color="on-surface-variant" class="mr-4" size="large" @click="switchView('settings')"></v-btn>
        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-avatar v-bind="props" color="primary-container" size="48" class="m3-avatar font-weight-medium text-title-medium" style="cursor: pointer">
              {{ initials(currentUser?.username || '') }}
            </v-avatar>
          </template>
          <v-list density="comfortable">
            <v-list-item :title="currentUser?.username || ''" subtitle="Аккаунт"></v-list-item>
            <v-divider></v-divider>
            <v-list-item prepend-icon="mdi-logout" title="Выйти" @click="doLogout"></v-list-item>
          </v-list>
        </v-menu>
      </header>

      <!-- Главная рабочая область -->
      <main ref="mainEl" class="m3-main-content" :class="{ 'with-lyrics': lyricsOpen }">
        <Transition name="view" mode="out-in">
          <div :key="viewKey" class="m3-view-host">
            <!-- РЕЗУЛЬТАТЫ ПОИСКА -->
            <div v-if="searchQuery.trim()" class="m3-container">
              <div class="d-flex align-center mb-8">
                <h1 class="text-h3 font-weight-medium text-on-surface">Результаты поиска</h1>
              </div>
              <v-divider class="mb-8 border-opacity-10" color="outline-variant"></v-divider>
              <div v-if="searching" class="d-flex justify-center py-12">
                <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
              </div>
              <div v-else-if="!searchResults.length" class="m3-card m3-reveal-zoom pa-12 d-flex flex-column align-center justify-center">
                <v-icon icon="mdi-file-search-outline" color="on-surface-variant" size="80" class="mb-4"></v-icon>
                <div class="text-h5 text-on-surface mb-2">Ничего не найдено</div>
                <div class="text-title-medium text-on-surface-variant">Попробуйте другой запрос</div>
              </div>
              <div v-else class="d-flex flex-wrap gap-6 pb-12">
                <div
                  v-for="(item, i) in searchResults"
                  :key="item.id"
                  class="m3-card m3-file-card m3-reveal d-flex flex-column pa-5"
                  :style="{ '--i': Math.min(i, 12) }"
                  v-ripple
                  draggable="true"
                  @dragstart="startPinDrag($event, item)"
                  @dragend="endPinDrag"
                  @click="openSearchResult(item)"
                >
                  <FileThumb :node="item" :thumb="thumbUrls[item.id]" />
                  <div class="d-flex align-center justify-space-between mt-auto">
                    <div class="overflow-hidden pr-3">
                      <div class="text-title-medium font-weight-medium text-on-surface text-truncate mb-1">{{ item.name }}</div>
                      <div class="text-body-1 text-on-surface-variant">{{ item.type === 'folder' ? 'Папка' : formatBytes(item.size) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ВИДЫ -->
            <FilesView v-else-if="currentView === 'files'" @goto-favorites="switchView('favorites')" />
            <FavoritesView v-else-if="currentView === 'favorites'" @goto-files="switchView('files')" />
            <SettingsView v-else-if="currentView === 'settings'" />
            <TrashView v-else />
          </div>
        </Transition>
      </main>
    </template>

    <PreviewDialog />
    <FileDetailsDialog />
    <AudioPlayerBar />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from 'vuetify'
import AuthView from '@/views/AuthView.vue'
import FilesView from '@/views/FilesView.vue'
import FavoritesView from '@/views/FavoritesView.vue'
import TrashView from '@/views/TrashView.vue'
import SettingsView from '@/views/SettingsView.vue'
import PreviewDialog from '@/components/PreviewDialog.vue'
import FileDetailsDialog from '@/components/FileDetailsDialog.vue'
import AudioPlayerBar from '@/components/AudioPlayerBar.vue'
import PinnedRail from '@/components/PinnedRail.vue'
import FileThumb from '@/components/FileThumb.vue'
import { getToken, me, searchFiles, type NodeItem } from '@/api'
import { setUser, logout, currentUser } from '@/store/auth'
import { requestOpenFolder, requestGoHome } from '@/store/nav'
import { openPreview } from '@/store/preview'
import { openDetails } from '@/store/details'
import { lyricsOpen } from '@/store/lyrics'
import { playTrack } from '@/store/player'
import { startPinDrag, endPinDrag } from '@/store/pins'
import { useThumbs } from '@/composables/useThumbs'
import { isAudio } from '@/utils/preview'
import { applyAccent, getAccentId, vuetifyThemeColors } from '@/utils/theme'
import { attachSmoothScroll, type SmoothScrollHandle } from '@/utils/smoothScroll'
import { fileIcon, fileColor, fileBg, initials, formatBytes } from '@/utils/format'

const authed = ref(false)
const currentView = ref<'files' | 'favorites' | 'trash' | 'settings'>('files')
const mainEl = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)

/** Ключ для плавной смены вида: поиск и разделы — разные экраны. */
const viewKey = computed(() => (searchQuery.value.trim() ? 'search' : currentView.value))

let smoothScroll: SmoothScrollHandle | null = null
watch(
  mainEl,
  (el) => {
    smoothScroll?.destroy()
    smoothScroll = null
    if (el) smoothScroll = attachSmoothScroll(el)
  },
  { flush: 'post' }
)

const vuetifyTheme = useTheme()

function syncAccent(): void {
  const scheme = applyAccent(getAccentId())
  const dark = vuetifyTheme.themes.value.dark
  if (dark?.colors) Object.assign(dark.colors, vuetifyThemeColors(scheme))
}
syncAccent()

const { thumbUrls, loadThumbs } = useThumbs()

const searchQuery = ref('')
const searchResults = ref<NodeItem[]>([])
const searching = ref(false)
let searchTimer: number | undefined

function onAuthed(): void {
  authed.value = true
}

function switchView(view: 'files' | 'favorites' | 'trash' | 'settings'): void {
  currentView.value = view
  if (view === 'files') searchQuery.value = ''
}

function clearSearch(): void {
  searchQuery.value = ''
  searchResults.value = []
  searching.value = false
}

function onGlobalKey(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
    searchInput.value?.select()
  }
}

function doLogout(): void {
  logout()
  authed.value = false
  currentView.value = 'files'
  searchQuery.value = ''
}

watch(searchQuery, () => {
  window.clearTimeout(searchTimer)
  const q = searchQuery.value.trim()
  if (!q) {
    searchResults.value = []
    searching.value = false
    return
  }
  searching.value = true
  searchTimer = window.setTimeout(async () => {
    try {
      searchResults.value = await searchFiles(q)
      loadThumbs(searchResults.value)
    } catch {
      searchResults.value = []
    } finally {
      searching.value = false
    }
  }, 300)
})

function goHome(): void {
  searchQuery.value = ''
  searchResults.value = []
  currentView.value = 'files'
  requestGoHome()
}

function openSearchResult(item: NodeItem): void {
  if (item.type === 'folder') {
    requestOpenFolder(item)
    searchQuery.value = ''
    currentView.value = 'files'
  } else if (isAudio(item.name, item.mimeType)) {
    playTrack(item, searchResults.value.filter((n) => n.type === 'file' && isAudio(n.name, n.mimeType)))
  } else {
    openPreview(item, searchResults.value)
  }
}

watch(viewKey, () => {
  mainEl.value?.scrollTo({ top: 0, behavior: 'smooth' })
})

onMounted(async () => {
  window.addEventListener('keydown', onGlobalKey)
  if (getToken()) {
    try {
      setUser(await me())
      authed.value = true
    } catch {
      logout()
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKey)
  smoothScroll?.destroy()
  smoothScroll = null
})
</script>

<style>
/* Подключаем твой любимый шрифт Wix Madefor Display */
@import url('https://fonts.googleapis.com/css2?family=Wix+Madefor+Display:wght@400;500;600;700;800&display=swap');

html, body {
  overflow: hidden !important;
  margin: 0;
  padding: 0;
  font-family: 'Wix Madefor Display', sans-serif !important;
}

/* Material 3 scrollbars: тонкий скруглённый ползунок без стрелок */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--md-sys-color-on-surface-rgb, 230, 224, 233), 0.28) transparent;
}
*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
*::-webkit-scrollbar-track {
  background: transparent;
}
*::-webkit-scrollbar-thumb {
  background-color: rgba(var(--md-sys-color-on-surface-rgb, 230, 224, 233), 0.24);
  border-radius: 8px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
*::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--md-sys-color-on-surface-rgb, 230, 224, 233), 0.42);
}
*::-webkit-scrollbar-corner {
  background: transparent;
}
*::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

/* Не даём браузеру тащить картинки (обложки/миниатюры) как файлы */
img {
  -webkit-user-drag: none;
  user-drag: none;
  -webkit-user-select: none;
  user-select: none;
}

:root {
  --lyrics-panel-width: clamp(340px, 26vw, 420px);
  --md-sys-color-background: #131217;
  --md-sys-color-on-background: #E5E3E8;

  --md-sys-color-surface: #131217;
  --md-sys-color-surface-container-lowest: #0F0D11;
  --md-sys-color-surface-container-low: #1B1A1F;
  --md-sys-color-surface-container: #211F26;
  --md-sys-color-surface-container-high: #2C2A32;
  --md-sys-color-surface-container-highest: #38353E;
  --md-sys-color-on-surface: #E5E3E8;
  --md-sys-color-on-surface-variant: #CBC8D0;

  --md-sys-color-primary: #D0BCFF;
  --md-sys-color-on-primary: #381E72;
  --md-sys-color-primary-container: #4F378B;
  --md-sys-color-on-primary-container: #EADDFF;

  --md-sys-color-secondary: #CCC2DC;
  --md-sys-color-secondary-container: #4A4458;

  --md-sys-color-tertiary: #EFB8C8;
  --md-sys-color-tertiary-container: #633B48;

  --md-sys-color-outline: #97949E;
  --md-sys-color-outline-variant: #4A4752;

  --md-sys-color-background-rgb: 19, 18, 23;
  --md-sys-color-surface-container-low-rgb: 27, 26, 31;
  --md-sys-color-surface-container-rgb: 33, 31, 38;
  --md-sys-color-surface-container-high-rgb: 44, 42, 50;
  --md-sys-color-on-surface-rgb: 229, 227, 232;
  --md-sys-color-on-surface-variant-rgb: 203, 200, 208;
  --md-sys-color-outline-rgb: 151, 148, 158;
  --md-sys-color-primary-rgb: 208, 188, 255;

  --md-sys-elevation-1: 0px 1px 2px 0px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15);
  --md-sys-elevation-3: 0px 1px 3px 0px rgba(0,0,0,0.3), 0px 4px 8px 3px rgba(0,0,0,0.15);
}

.m3-app-root {
  background-color: var(--md-sys-color-background) !important;
  color: var(--md-sys-color-on-surface) !important;
  font-family: 'Wix Madefor Display', sans-serif !important;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  -webkit-user-drag: none;
  box-sizing: border-box;
}

/* 1. САЙДБАР */
.m3-nav-rail {
  position: fixed;
  top: 0;
  left: 0;
  width: 96px;
  min-width: 96px;
  height: 100vh;
  box-sizing: border-box;
  background-color: var(--md-sys-color-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  border-right: 1px solid var(--md-sys-color-outline-variant);
  z-index: 100;
}
.m3-nav-rail__header { margin-bottom: 48px; }
.m3-nav-rail__destinations { display: flex; flex-direction: column; gap: 24px; width: 100%; }
.m3-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 100%;
  position: relative;
}
.m3-nav-item__indicator {
  width: 64px;
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-sys-color-on-surface-variant);
  transition:
    background-color 0.25s var(--m3-ease-standard),
    color 0.25s var(--m3-ease-standard);
}
.m3-nav-item:hover .m3-nav-item__indicator { background-color: rgba(var(--md-sys-color-on-surface-rgb, 230, 224, 233), 0.08); }
.m3-nav-item.active .m3-nav-item__indicator { background-color: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
.m3-nav-item__label { font-size: 13px; font-weight: 500; margin-top: 8px; color: var(--md-sys-color-on-surface-variant); transition: color 0.25s var(--m3-ease-standard); }
.m3-nav-item:hover .m3-nav-item__label { color: var(--md-sys-color-on-surface); }
.m3-nav-item.active .m3-nav-item__label { color: var(--md-sys-color-on-surface); }

/* 2. ТОП БАР И ПОИСК */
.m3-top-bar {
  position: fixed;
  top: 0;
  left: 96px;
  right: 0;
  height: 88px;
  padding: 0 40px;
  box-sizing: border-box;
  background-color: var(--md-sys-color-background);
  z-index: 90;
}
.m3-search-bar {
  background-color: var(--md-sys-color-surface-container-high);
  height: 56px;
  border-radius: 28px;
  width: 100%;
  max-width: 800px;
  transition: background-color 0.25s var(--m3-ease-standard);
}
.m3-search-bar:focus-within { background-color: var(--md-sys-color-surface-container-highest); }
.m3-search-input {
  background: transparent;
  border: none;
  color: var(--md-sys-color-on-surface);
  width: 100%;
  outline: none;
  font-family: inherit;
}
.m3-search-input:focus,
.m3-search-input:focus-visible {
  outline: none;
  box-shadow: none;
}
.m3-search-input::placeholder { color: var(--md-sys-color-on-surface-variant); }
.m3-avatar {
  background-color: var(--md-sys-color-primary-container) !important;
  color: var(--md-sys-color-on-primary-container) !important;
  font-family: inherit;
}

/* 3. ГЛАВНАЯ ОБЛАСТЬ */
.m3-main-content {
  flex-grow: 1;
  margin-left: 96px;
  margin-top: 88px;
  height: calc(100vh - 88px);
  width: calc(100vw - 96px);
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: var(--md-sys-color-background);
}
.m3-view-host {
  width: 100%;
  min-height: 100%;
}
.m3-container { padding: 40px 48px 80px 48px; }
.m3-main-content.with-lyrics {
  width: calc(100vw - 96px - var(--lyrics-panel-width));
}
@media (max-width: 900px) {
  .m3-main-content.with-lyrics { width: calc(100vw - 96px); }
}

/* 4. КАРТОЧКИ */
.m3-card {
  background-color: var(--md-sys-color-surface-container) !important;
  border-radius: 32px !important;
  border: none;
  transition: background-color 0.22s var(--m3-ease-standard);
  cursor: pointer;
}
.m3-card:hover { background-color: var(--md-sys-color-surface-container-high) !important; }
.m3-icon-avatar { width: 80px; height: 80px; border-radius: 24px; display: flex; align-items: center; justify-content: center; }
.m3-icon-avatar.primary-container { background-color: var(--md-sys-color-primary-container); }
.m3-icon-avatar.surface-variant { background-color: var(--md-sys-color-surface-container-high); }

/* Диалоги получают мягкое «пружинное» появление */
.m3-dialog {
  animation: m3-pop-in 0.32s var(--m3-ease-spring) both;
  box-shadow: var(--md-sys-elevation-3);
}

/* ВЕРХНИЙ БЛОК */
.m3-hero-section { display: flex; gap: 32px; align-items: stretch; }
.m3-hero-text-card { flex: 0 0 460px; height: 440px; box-sizing: border-box; }
.m3-hero-image-card {
  flex: 1;
  height: 440px;
  border-radius: 32px;
  background: linear-gradient(135deg, #4F378B 0%, #381E72 45%, #633B48 100%);
  position: relative;
  box-shadow: var(--md-sys-elevation-1);
  overflow: hidden;
  box-sizing: border-box;
}
.m3-hero-image-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 60%); }

/* ВИДЖЕТЫ СОСТОЯНИЯ */
.m3-widgets-row { gap: 32px !important; }
.m3-widgets-row .m3-widget-card { flex: 1 !important; }

/* ГОРИЗОНТАЛЬНЫЕ СПИСКИ И СКРОЛЛ */
.m3-scroll-container {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--md-sys-color-outline-variant) transparent;
  padding-bottom: 16px;
  gap: 32px !important;
}
.m3-scroll-container::-webkit-scrollbar { height: 10px; }
.m3-scroll-container::-webkit-scrollbar-track { background: transparent; }
.m3-scroll-container::-webkit-scrollbar-thumb { background-color: var(--md-sys-color-outline-variant); border-radius: 5px; }

/* КАРТОЧКИ ФАЙЛОВ И ПАПОК */
.m3-file-card { min-width: 320px; width: 320px; }
.m3-file-preview { height: 180px; width: 100%; }
.m3-folder-card { min-width: 300px; width: 300px; height: 260px; }

/* 5. DRAG AND DROP */
.m3-drag-overlay { position: fixed; inset: 0; z-index: 9999; }
.m3-drag-scrim { position: absolute; inset: 0; background-color: rgba(0, 0, 0, 0.6); }
.m3-drag-dialog { position: relative; background-color: var(--md-sys-color-surface-container-high); border-radius: 40px; width: 720px; height: 480px; box-shadow: var(--md-sys-elevation-3); pointer-events: none; border: 1px solid var(--md-sys-color-outline-variant); }
.m3-drag-icon-container { width: 160px; height: 160px; border-radius: 80px; background-color: var(--md-sys-color-primary-container); display: flex; align-items: center; justify-content: center; animation: float 2s ease-in-out infinite; }
@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-12px); } 100% { transform: translateY(0px); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-enter-active .m3-drag-dialog { animation: scale-up 0.2s cubic-bezier(0.2, 0, 0, 1); }
@keyframes scale-up { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* Утилиты */
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }
.text-primary { color: var(--md-sys-color-primary) !important; }
.text-on-surface { color: var(--md-sys-color-on-surface) !important; font-family: inherit; }
.text-on-surface-variant { color: var(--md-sys-color-on-surface-variant) !important; font-family: inherit; }
.text-on-primary-container { color: var(--md-sys-color-on-primary-container) !important; font-family: inherit; }
</style>
