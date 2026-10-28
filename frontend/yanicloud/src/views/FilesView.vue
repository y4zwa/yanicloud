<template>
  <div
    class="m3-container"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- ПРОГРЕСС ЗАГРУЗКИ -->
    <v-progress-linear
      v-if="uploading"
      :model-value="progress"
      color="primary"
      height="6"
      rounded
      class="mb-6"
    ></v-progress-linear>

    <!-- ХИРО БЛОК (только корень) -->
    <div v-if="isRoot" class="m3-hero-section mb-8">
      <div
        ref="heroCardRef"
        class="m3-card m3-hero-text-card m3-hero-card pa-10 d-flex flex-column justify-center"
        @mousemove="onHeroMouseMove"
        @mouseleave="onHeroMouseLeave"
      >
        <!-- СЛОЙ 1: Живые аврора-сферы (CSS color-mix от акцентного цвета) -->
        <div class="m3-hero-bg-layer" aria-hidden="true">
          <div class="m3-hero-blob m3-hero-blob--1"></div>
          <div class="m3-hero-blob m3-hero-blob--2"></div>
          <div class="m3-hero-blob m3-hero-blob--3"></div>
          <div class="m3-hero-blob m3-hero-blob--4"></div>

          <!-- Точечная перспективная матрица -->
          <div class="m3-hero-dot-grid"></div>

          <!-- Декоративные орбитальные кольца -->
          <div class="m3-hero-orbits">
            <div class="m3-hero-orbit m3-hero-orbit--1"></div>
            <div class="m3-hero-orbit m3-hero-orbit--2"></div>
            <div class="m3-hero-orbit m3-hero-orbit--3"></div>
          </div>
        </div>

        <!-- СЛОЙ 2: Интерактивный Canvas (шёлковые волны + частицы + реакция на мышь) -->
        <canvas ref="heroCanvasRef" class="m3-hero-canvas" aria-hidden="true"></canvas>

        <!-- СЛОЙ 3: Мягкая виньетка и внутренний стеклянный блик -->
        <div class="m3-hero-vignette" aria-hidden="true"></div>
        <div class="m3-hero-border-glow" aria-hidden="true"></div>

        <!-- КОНТЕНТ ХИРО КАРТОЧКИ -->
        <div class="m3-hero-content d-flex flex-column flex-grow-1 justify-center">
          <h1 class="text-h3 font-weight-medium mb-4 text-on-surface hero-title" style="line-height: 1.2;">
            {{ greeting }}, <br />
            <span class="text-primary hero-username">{{ currentUser?.username || 'друг' }}</span>
          </h1>
          <p class="text-title-medium text-on-surface-variant mb-10 hero-subtitle" style="line-height: 1.6;">
            Храните, делитесь и работайте из любой точки мира. Безопасно и быстро.
          </p>
          <div class="d-flex align-center gap-4 mt-auto">
            <v-btn
              rounded="pill"
              size="x-large"
              color="primary-container"
              elevation="0"
              class="m3-btn-filled hero-btn-primary px-6 flex-grow-1"
              height="64"
              @click="pickFiles"
            >
              <v-icon start size="28">mdi-cloud-upload</v-icon>
              <span class="text-title-medium font-weight-medium text-on-primary-container text-none">Загрузить</span>
            </v-btn>
            <v-btn
              rounded="pill"
              size="x-large"
              variant="outlined"
              color="outline"
              class="m3-btn-outlined hero-btn-secondary px-6 flex-grow-1"
              height="64"
              @click="createDialog = true"
            >
              <span class="text-title-medium font-weight-medium text-primary text-none">Создать папку</span>
              <v-icon end size="28" color="primary">mdi-folder-plus</v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <div
        class="m3-hero-image-card"
        v-ripple
        :style="bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
      >
        <div class="m3-hero-image-overlay d-flex flex-column justify-end pa-10">
          <span class="text-h4 font-weight-medium text-white mb-2">YaniCloud</span>
          <span class="text-title-medium text-white opacity-80">Ваше личное облако</span>
        </div>
      </div>
    </div>

    <!-- КОМПАКТНЫЕ ВИДЖЕТЫ (только корень) -->
    <div v-if="isRoot" class="m3-widgets-row d-flex gap-4 mb-10">
      <!-- Хранилище: компактный информационный виджет -->
      <div class="m3-card m3-widget-card m3-widget-card--compact m3-widget-card--static d-flex align-center flex-grow-1">
        <div class="m3-progress-wrapper mr-3">
          <v-progress-circular
            :model-value="storagePercent"
            color="primary"
            size="44"
            width="4.5"
            class="widget-progress-text font-weight-bold"
          >
            {{ storagePercentLabel }}
          </v-progress-circular>
        </div>
        <div class="min-width-0 flex-grow-1">
          <div class="d-flex align-baseline justify-space-between gap-2">
            <span class="widget-eyebrow text-on-surface-variant">Занято хранилища</span>
          </div>
          <div class="widget-main-value text-on-surface text-truncate">
            {{ storageLabel }}
          </div>
          <div class="widget-meta-row d-flex align-center flex-wrap text-on-surface-variant mt-0.5">
            <v-icon icon="mdi-harddisk" size="13" color="on-surface-variant" class="mr-1"></v-icon>
            <span>Свободно: {{ formatBytes(storage.diskFree) }} из {{ formatBytes(storage.diskTotal) }}</span>
            <template v-if="storageDir">
              <span class="widget-meta-dot mx-1.5">•</span>
              <span class="storage-dir" :title="storageDir">{{ storageDir }}</span>
            </template>
          </div>
        </div>
      </div>

      <!-- Избранное: компактная кликабельная плитка -->
      <div
        class="m3-card m3-widget-card m3-widget-card--compact m3-widget-card--interactive d-flex align-center flex-grow-1"
        v-ripple
        @click="$emit('goto-favorites')"
      >
        <div class="m3-icon-avatar primary-container m3-widget-avatar mr-3">
          <v-icon icon="mdi-star" color="on-primary-container" size="21"></v-icon>
        </div>
        <div class="min-width-0">
          <div class="widget-main-value text-on-surface">Избранное</div>
          <div class="widget-sub-value text-on-surface-variant">{{ favoritesCount }} элементов</div>
        </div>
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          density="comfortable"
          size="small"
          color="on-surface-variant"
        ></v-btn>
      </div>
    </div>

    <!-- НАВИГАЦИЯ ПО ПАПКАМ (только внутри папки) -->
    <div v-if="!isRoot" class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center">
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          color="primary"
          size="large"
          class="mr-2"
          @click="goUp"
        ></v-btn>
        <v-breadcrumbs :items="breadcrumb" class="m3-breadcrumbs">
          <template v-slot:divider><v-icon size="18">mdi-chevron-right</v-icon></template>
          <template v-slot:item="{ item }">
            <v-btn
              variant="text"
              color="on-surface-variant"
              class="text-none text-title-medium"
              :disabled="isLastBreadcrumb(item)"
              @click="goTo(breadcrumbIndex(item))"
            >
              {{ item.title }}
            </v-btn>
          </template>
        </v-breadcrumbs>
      </div>
      <div class="d-flex align-center" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="primary"
          rounded="pill"
          class="text-none font-weight-medium"
          prepend-icon="mdi-folder-plus"
          @click="createDialog = true"
        >
          Создать папку
        </v-btn>
        <v-btn
          variant="tonal"
          color="primary"
          rounded="pill"
          class="text-none font-weight-medium"
          prepend-icon="mdi-cloud-upload"
          @click="pickFiles"
        >
          Загрузить
        </v-btn>
      </div>
    </div>

    <!-- СОСТОЯНИЯ -->
    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>
    <div v-else-if="error" class="m3-card pa-8 text-center">
      <v-icon icon="mdi-alert-circle-outline" color="error" size="48" class="mb-4"></v-icon>
      <div class="text-h6 text-on-surface mb-2">Не удалось загрузить файлы</div>
      <div class="text-title-medium text-on-surface-variant mb-6">{{ error }}</div>
      <v-btn variant="tonal" color="primary" rounded="pill" @click="load">Повторить</v-btn>
    </div>

    <template v-else>
      <!-- ПУСТО -->
      <div v-if="!folders.length && !files.length" class="m3-card pa-12 d-flex flex-column align-center justify-center">
        <v-icon icon="mdi-folder-open-outline" color="on-surface-variant" size="80" class="mb-4"></v-icon>
        <div class="text-h5 text-on-surface mb-2">Здесь пока пусто</div>
        <div class="text-title-medium text-on-surface-variant mb-8">Перетащите файлы или создайте папку</div>
        <div class="d-flex gap-4">
          <v-btn color="primary-container" rounded="pill" class="text-none font-weight-medium" prepend-icon="mdi-cloud-upload" @click="pickFiles">
            <span class="text-on-primary-container">Загрузить</span>
          </v-btn>
          <v-btn variant="outlined" rounded="pill" class="text-none font-weight-medium" prepend-icon="mdi-folder-plus" @click="createDialog = true">
            Создать папку
          </v-btn>
        </div>
      </div>

      <!-- ПАПКИ -->
      <template v-if="folders.length">
        <div class="m3-section-header d-flex align-center mb-6">
          <h2 class="text-h5 font-weight-medium text-on-surface">Папки</h2>
        </div>
        <div class="m3-scroll-container gap-6 mb-12 pb-4">
          <div
            v-for="folder in folders"
            :key="folder.id"
            class="m3-card m3-folder-card d-flex flex-column pa-6"
            v-ripple
            draggable="true"
            @dragstart="startPinDrag($event, folder)"
            @dragend="endPinDrag"
            @click="openFolder(folder)"
          >
            <div class="d-flex justify-space-between align-start mb-6">
              <v-icon :icon="fileIcon(folder)" :color="fileColor(folder)" size="56"></v-icon>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" color="on-surface-variant" @click.stop></v-btn>
                </template>
                <v-list density="comfortable">
                  <v-list-item prepend-icon="mdi-folder-open-outline" title="Открыть" @click="openFolder(folder)"></v-list-item>
                  <v-list-item
                    :prepend-icon="folder.isFavorite ? 'mdi-star-off' : 'mdi-star-outline'"
                    :title="folder.isFavorite ? 'Убрать из избранного' : 'В избранное'"
                    @click="toggleFavorite(folder)"
                  ></v-list-item>
                  <v-list-item prepend-icon="mdi-pencil-outline" title="Переименовать" @click="openRename(folder)"></v-list-item>
                  <v-list-item prepend-icon="mdi-delete-outline" title="Удалить" @click="removeNode(folder)"></v-list-item>
                </v-list>
              </v-menu>
            </div>
            <div class="mt-auto">
              <div class="text-h6 font-weight-medium text-on-surface text-truncate mb-2">{{ folder.name }}</div>
              <div class="text-title-medium text-on-surface-variant">{{ folder.items ?? 0 }} элементов</div>
            </div>
          </div>
        </div>
      </template>

      <!-- ФАЙЛЫ -->
      <template v-if="files.length">
        <div class="m3-section-header d-flex align-center mb-6">
          <h2 class="text-h5 font-weight-medium text-on-surface">{{ isRoot ? 'Файлы' : 'Файлы' }}</h2>
        </div>
        <div class="d-flex flex-wrap gap-6 pb-12">
          <div
            v-for="file in files"
            :key="file.id"
            class="m3-card m3-file-card d-flex flex-column pa-5"
            v-ripple
            draggable="true"
            @dragstart="startPinDrag($event, file)"
            @dragend="endPinDrag"
            @click="openFile(file)"
          >
            <FileThumb :node="file" :thumb="thumbUrls[file.id]" />
            <div class="d-flex align-center justify-space-between mt-auto">
              <div class="overflow-hidden pr-3">
                <div class="text-title-medium font-weight-medium text-on-surface text-truncate mb-1">{{ file.name }}</div>
                <div class="text-body-1 text-on-surface-variant">{{ formatDate(file.updatedAt) }}</div>
              </div>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" color="on-surface-variant" @click.stop></v-btn>
                </template>
                <v-list density="comfortable">
                  <v-list-item
                    :prepend-icon="file.isFavorite ? 'mdi-star-off' : 'mdi-star-outline'"
                    :title="file.isFavorite ? 'Убрать из избранного' : 'В избранное'"
                    @click="toggleFavorite(file)"
                  ></v-list-item>
                  <v-list-item prepend-icon="mdi-download" title="Скачать" @click="download(file)"></v-list-item>
                  <v-list-item prepend-icon="mdi-pencil-outline" title="Переименовать" @click="openRename(file)"></v-list-item>
                  <v-list-item prepend-icon="mdi-delete-outline" title="Удалить" @click="removeNode(file)"></v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
        </div>
      </template>

      <!-- НЕДАВНИЕ ФАЙЛЫ (только корень) -->
      <template v-if="isRoot && recent.length">
        <div class="m3-section-header d-flex align-center justify-space-between mb-6">
          <h2 class="text-h5 font-weight-medium text-on-surface">Недавние файлы</h2>
        </div>
        <div class="m3-scroll-container gap-6 pb-12">
          <div
            v-for="file in recent"
            :key="file.id"
            class="m3-card m3-file-card d-flex flex-column pa-5"
            v-ripple
            draggable="true"
            @dragstart="startPinDrag($event, file)"
            @dragend="endPinDrag"
            @click="openFile(file, recent)"
          >
            <FileThumb :node="file" :thumb="thumbUrls[file.id]" />
            <div class="d-flex align-center justify-space-between mt-auto">
              <div class="overflow-hidden pr-3">
                <div class="text-title-medium font-weight-medium text-on-surface text-truncate mb-1">{{ file.name }}</div>
                <div class="text-body-1 text-on-surface-variant">{{ formatDate(file.updatedAt) }}</div>
              </div>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" color="on-surface-variant" @click.stop></v-btn>
                </template>
                <v-list density="comfortable">
                  <v-list-item prepend-icon="mdi-download" title="Скачать" @click="download(file)"></v-list-item>
                  <v-list-item prepend-icon="mdi-eye-off-outline" title="Скрыть из недавних" @click="hideRecent(file)"></v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- СКРЫТЫЙ INPUT ДЛЯ ВЫБОРА ФАЙЛОВ -->
    <input ref="fileInput" type="file" multiple style="display: none" @change="onPick" />

    <!-- ДИАЛОГ: СОЗДАТЬ ПАПКУ -->
    <v-dialog v-model="createDialog" max-width="440">
      <div class="m3-dialog">
        <div class="text-h6 font-weight-medium text-on-surface mb-4">Новая папка</div>
        <v-text-field
          v-model="newFolderName"
          label="Название"
          variant="outlined"
          autofocus
          @keyup.enter="submitCreateFolder"
        ></v-text-field>
        <div class="d-flex justify-end gap-4 mt-2">
          <v-btn variant="text" class="text-none" @click="createDialog = false">Отмена</v-btn>
          <v-btn color="primary-container" rounded="pill" class="text-none font-weight-medium" @click="submitCreateFolder">
            <span class="text-on-primary-container">Создать</span>
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- ДИАЛОГ: ПЕРЕИМЕНОВАТЬ -->
    <v-dialog v-model="renameDialog" max-width="440">
      <div class="m3-dialog">
        <div class="text-h6 font-weight-medium text-on-surface mb-4">Переименовать</div>
        <v-text-field
          v-model="renameValue"
          label="Название"
          variant="outlined"
          autofocus
          @keyup.enter="submitRename"
        ></v-text-field>
        <div class="d-flex justify-end gap-4 mt-2">
          <v-btn variant="text" class="text-none" @click="renameDialog = false">Отмена</v-btn>
          <v-btn color="primary-container" rounded="pill" class="text-none font-weight-medium" @click="submitRename">
            <span class="text-on-primary-container">Сохранить</span>
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- УВЕДОМЛЕНИЯ -->
    <v-snackbar v-model="snackbar" :color="snackColor" timeout="3000" rounded="pill">
      {{ snackText }}
    </v-snackbar>

    <!-- DRAG AND DROP OVERLAY -->
    <transition name="fade">
      <div v-if="dragOver" class="m3-drag-overlay d-flex align-center justify-center">
        <div class="m3-drag-scrim"></div>
        <div class="m3-drag-dialog d-flex flex-column align-center justify-center pa-12 elevation-6">
          <div class="m3-drag-icon-container mb-8">
            <v-icon icon="mdi-cloud-upload" color="primary" size="100"></v-icon>
          </div>
          <h2 class="text-h3 font-weight-medium text-on-surface mb-4">Отпустите файлы</h2>
          <p class="text-h6 text-on-surface-variant text-center" style="line-height: 1.5;">
            Они будут загружены<br />в текущую директорию
          </p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { pendingFolder } from '@/store/nav'
import { openPreview } from '@/store/preview'
import { playTrack } from '@/store/player'
import { startPinDrag, endPinDrag, draggingPin } from '@/store/pins'
import { currentUser } from '@/store/auth'
import FileThumb from '@/components/FileThumb.vue'
import { useThumbs } from '@/composables/useThumbs'
import { isAudio } from '@/utils/preview'
import {
  listFiles,
  listFavorites,
  listRecent,
  getStorage,
  getBannerUrl,
  createFolder,
  uploadFiles,
  downloadFile,
  renameNode,
  setFavorite,
  setHiddenRecent,
  trashNode,
  type NodeItem,
  type StorageInfo,
  ApiError,
} from '@/api'
import { formatBytes, formatDate, fileIcon, fileColor, fileBg } from '@/utils/format'

const emit = defineEmits<{ (e: 'goto-favorites'): void }>()

const { thumbUrls, loadThumbs } = useThumbs()

const stack = ref<{ id: string | null; name: string }[]>([{ id: null, name: 'Главная' }])
const items = ref<NodeItem[]>([])
const recent = ref<NodeItem[]>([])
const favoritesCount = ref(0)
const storage = ref<StorageInfo>({ used: 0, quota: 0, percent: 0, diskTotal: 0, diskFree: 0, reservedByOthers: 0, availableTotal: 0 })
const bannerUrl = ref<string | null>(null)
const loading = ref(true)
const error = ref('')

const uploading = ref(false)
const progress = ref(0)
const dragOver = ref(false)
const dragDepth = ref(0)

const createDialog = ref(false)
const newFolderName = ref('')
const renameDialog = ref(false)
const renameValue = ref('')
const renameTarget = ref<NodeItem | null>(null)

const snackbar = ref(false)
const snackText = ref('')
const snackColor = ref('primary')

const fileInput = ref<HTMLInputElement>()

const currentFolderId = computed(() => stack.value[stack.value.length - 1].id)
const isRoot = computed(() => stack.value.length === 1)
const breadcrumb = computed(() =>
  stack.value.map((s, i) => ({ title: s.name, index: i }))
)
const folders = computed(() => items.value.filter((n) => n.type === 'folder'))
const files = computed(() => items.value.filter((n) => n.type === 'file'))

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 5) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
})

// путь, где реально лежат файлы пользователя (приходит из /api/storage после правки бэкенда)
const storageDir = computed(() => ((storage.value as any).dir as string | undefined) ?? '')

const storagePercent = computed(() => {
  if (storage.value.quota > 0) return Math.min(100, (storage.value.used / storage.value.quota) * 100)
  if (storage.value.availableTotal > 0) return Math.min(100, (storage.value.used / storage.value.availableTotal) * 100)
  return 0
})

const storagePercentLabel = computed(() => {
  const p = storagePercent.value
  if (p > 0 && p < 1) return `${p.toFixed(1)}%`
  return `${Math.round(p)}%`
})

const storageLabel = computed(() => {
  if (storage.value.quota > 0) return `${formatBytes(storage.value.used)} из ${formatBytes(storage.value.quota)}`
  return `${formatBytes(storage.value.used)} из ${formatBytes(storage.value.availableTotal)}`
})

/* ──────────────────────────────────────────────────────────────
   ЖИВОЙ CANVAS-ФОН ДЛЯ HERO-КАРТОЧКИ (С АДАПТАЦИЕЙ ПОД АКЦЕНТ)
   ────────────────────────────────────────────────────────────── */
type RGB = [number, number, number]

interface HeroParticle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  depth: number
  phase: number
  speed: number
  colorMix: number // 0..1 между primary и tertiary
}

const heroCardRef = ref<HTMLElement | null>(null)
const heroCanvasRef = ref<HTMLCanvasElement | null>(null)

let rafId: number | null = null
let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null
let colorProbeCtx: CanvasRenderingContext2D | null = null

const mouseState = {
  targetX: 0.72,
  targetY: 0.38,
  currentX: 0.72,
  currentY: 0.38,
  active: false,
  intensity: 0,
}

// Текущие и целевые цвета для плавного перехода при смене акцента
const palette = {
  primary: [139, 0, 3] as RGB,
  tertiary: [180, 60, 80] as RGB,
  secondary: [120, 70, 75] as RGB,
  targetPrimary: [139, 0, 3] as RGB,
  targetTertiary: [180, 60, 80] as RGB,
  targetSecondary: [120, 70, 75] as RGB,
}

let particles: HeroParticle[] = []
let canvasW = 0
let canvasH = 0

function parseCssColorToRgb(raw: string, fallback: RGB): RGB {
  const val = raw.trim()
  if (!val) return fallback

  // Если переменная хранит "R, G, B" (формат Vuetify --v-theme-primary)
  if (/^\d+\s*,\s*\d+\s*,\s*\d+$/.test(val)) {
    const parts = val.split(',').map((n) => parseInt(n.trim(), 10))
    return [parts[0] ?? fallback[0], parts[1] ?? fallback[1], parts[2] ?? fallback[2]]
  }

  // Hex #RRGGBB или #RGB
  if (val.startsWith('#')) {
    let hex = val.slice(1)
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('')
    }
    if (hex.length >= 6) {
      const num = parseInt(hex.slice(0, 6), 16)
      if (!Number.isNaN(num)) {
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
      }
    }
  }

  // rgb() / rgba()
  const rgbMatch = val.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10),
      parseInt(rgbMatch[2], 10),
      parseInt(rgbMatch[3], 10),
    ]
  }

  // Универсальный фолбэк через 1x1 canvas для любых CSS-цветов (hsl, oklch и т.д.)
  try {
    if (!colorProbeCtx) {
      const c = document.createElement('canvas')
      c.width = 1
      c.height = 1
      colorProbeCtx = c.getContext('2d', { willReadFrequently: true })
    }
    if (colorProbeCtx) {
      colorProbeCtx.clearRect(0, 0, 1, 1)
      colorProbeCtx.fillStyle = val
      colorProbeCtx.fillRect(0, 0, 1, 1)
      const data = colorProbeCtx.getImageData(0, 0, 1, 1).data
      return [data[0], data[1], data[2]]
    }
  } catch {
    // ignore
  }

  return fallback
}

function shiftHueAndBrighten(rgb: RGB, shiftDeg: number, boost = 1.15): RGB {
  // Лёгкое смещение оттенка, если tertiary/secondary совпадают с primary
  const [r, g, b] = rgb.map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  h = (h + shiftDeg / 360 + 1) % 1
  const newL = Math.min(0.82, Math.max(0.28, l * boost))
  const newS = Math.min(1, Math.max(0.45, s * 1.1))

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }

  const q = newL < 0.5 ? newL * (1 + newS) : newL + newS - newL * newS
  const p = 2 * newL - q
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

function sampleAccentColors(): void {
  const el = heroCardRef.value || document.documentElement
  const styles = getComputedStyle(el)
  const rootStyles = getComputedStyle(document.documentElement)

  const readVar = (name: string) =>
    styles.getPropertyValue(name).trim() || rootStyles.getPropertyValue(name).trim()

  const rawPrimary =
    readVar('--md-sys-color-primary') ||
    readVar('--v-theme-primary') ||
    '#8B0003'

  const primaryRgb = parseCssColorToRgb(rawPrimary, [139, 0, 3])

  const rawTertiary =
    readVar('--md-sys-color-tertiary') ||
    readVar('--v-theme-secondary')
  const tertiaryRgb = rawTertiary
    ? parseCssColorToRgb(rawTertiary, shiftHueAndBrighten(primaryRgb, 28, 1.25))
    : shiftHueAndBrighten(primaryRgb, 28, 1.25)

  const rawSecondary = readVar('--md-sys-color-secondary')
  const secondaryRgb = rawSecondary
    ? parseCssColorToRgb(rawSecondary, shiftHueAndBrighten(primaryRgb, -22, 1.1))
    : shiftHueAndBrighten(primaryRgb, -22, 1.1)

  palette.targetPrimary = primaryRgb
  palette.targetTertiary = tertiaryRgb
  palette.targetSecondary = secondaryRgb
}

function lerpColor(current: RGB, target: RGB, factor: number): void {
  current[0] += (target[0] - current[0]) * factor
  current[1] += (target[1] - current[1]) * factor
  current[2] += (target[2] - current[2]) * factor
}

function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function rgbaStr(rgb: RGB, alpha: number): string {
  return `rgba(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}, ${alpha})`
}

function createParticles(width: number, height: number): HeroParticle[] {
  const count = 38
  const list: HeroParticle[] = []
  for (let i = 0; i < count; i++) {
    const depth = 0.3 + Math.random() * 0.7
    list.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35 * depth,
      vy: -(0.12 + Math.random() * 0.32) * depth,
      radius: (1.1 + Math.random() * 2.6) * depth,
      depth,
      phase: Math.random() * Math.PI * 2,
      speed: 0.012 + Math.random() * 0.025,
      colorMix: Math.random(),
    })
  }
  return list
}

function resizeHeroCanvas(): void {
  const card = heroCardRef.value
  const canvas = heroCanvasRef.value
  if (!card || !canvas) return

  const rect = card.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvasW = Math.max(1, Math.floor(rect.width))
  canvasH = Math.max(1, Math.floor(rect.height))

  canvas.width = Math.floor(canvasW * dpr)
  canvas.height = Math.floor(canvasH * dpr)

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  if (!particles.length) {
    particles = createParticles(canvasW, canvasH)
  }
}

function onHeroMouseMove(e: MouseEvent): void {
  const card = heroCardRef.value
  if (!card) return
  const rect = card.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  mouseState.targetX = (e.clientX - rect.left) / rect.width
  mouseState.targetY = (e.clientY - rect.top) / rect.height
  mouseState.active = true
}

function onHeroMouseLeave(): void {
  mouseState.active = false
  mouseState.targetX = 0.72
  mouseState.targetY = 0.38
}

function startHeroAnimation(): void {
  stopHeroAnimation()
  if (!isRoot.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  sampleAccentColors()
  palette.primary = [...palette.targetPrimary] as RGB
  palette.tertiary = [...palette.targetTertiary] as RGB
  palette.secondary = [...palette.targetSecondary] as RGB

  resizeHeroCanvas()

  let frameCounter = 0

  const render = (time: number) => {
    const canvas = heroCanvasRef.value
    if (!canvas || !isRoot.value) return
    const ctx = canvas.getContext('2d')
    if (!ctx || !canvasW || !canvasH) {
      rafId = requestAnimationFrame(render)
      return
    }

    frameCounter++
    // Периодически проверяем CSS-переменные на случай динамической смены темы/акцента
    if (frameCounter % 30 === 0) {
      sampleAccentColors()
    }

    // Плавная интерполяция цветов
    lerpColor(palette.primary, palette.targetPrimary, 0.06)
    lerpColor(palette.tertiary, palette.targetTertiary, 0.06)
    lerpColor(palette.secondary, palette.targetSecondary, 0.06)

    // Плавное следование курсора
    mouseState.currentX += (mouseState.targetX - mouseState.currentX) * 0.05
    mouseState.currentY += (mouseState.targetY - mouseState.currentY) * 0.05
    const targetIntensity = mouseState.active ? 1 : 0
    mouseState.intensity += (targetIntensity - mouseState.intensity) * 0.06

    const t = time * 0.001
    ctx.clearRect(0, 0, canvasW, canvasH)

    // 1. Интерактивное световое гало за курсором (или в правой части карточки по умолчанию)
    const auraX = mouseState.currentX * canvasW
    const auraY = mouseState.currentY * canvasH
    const auraRadius = Math.max(canvasW, canvasH) * (0.48 + mouseState.intensity * 0.12)
    const auraGrad = ctx.createRadialGradient(auraX, auraY, 0, auraX, auraY, auraRadius)
    auraGrad.addColorStop(0, rgbaStr(palette.primary, 0.22 + mouseState.intensity * 0.1))
    auraGrad.addColorStop(0.45, rgbaStr(palette.tertiary, 0.09 + mouseState.intensity * 0.05))
    auraGrad.addColorStop(1, rgbaStr(palette.primary, 0))
    ctx.fillStyle = auraGrad
    ctx.fillRect(0, 0, canvasW, canvasH)

    // 2. Шёлковые гармонические волны (Silk Aurora Ribbons)
    const ribbons = [
      {
        baseY: canvasH * 0.62,
        amp1: 26,
        amp2: 14,
        freq1: 0.0055,
        freq2: 0.011,
        speed1: 0.75,
        speed2: -0.48,
        colorA: palette.primary,
        colorB: palette.tertiary,
        fillAlpha: 0.16,
        strokeAlpha: 0.42,
        parallax: 24,
      },
      {
        baseY: canvasH * 0.72,
        amp1: 22,
        amp2: 18,
        freq1: 0.007,
        freq2: 0.0045,
        speed1: -0.62,
        speed2: 0.85,
        colorA: palette.tertiary,
        colorB: palette.secondary,
        fillAlpha: 0.13,
        strokeAlpha: 0.32,
        parallax: -18,
      },
      {
        baseY: canvasH * 0.48,
        amp1: 30,
        amp2: 12,
        freq1: 0.0042,
        freq2: 0.0085,
        speed1: 0.52,
        speed2: 0.35,
        colorA: palette.secondary,
        colorB: palette.primary,
        fillAlpha: 0.1,
        strokeAlpha: 0.26,
        parallax: 14,
      },
      {
        baseY: canvasH * 0.82,
        amp1: 16,
        amp2: 10,
        freq1: 0.0085,
        freq2: 0.014,
        speed1: 0.95,
        speed2: -0.7,
        colorA: palette.primary,
        colorB: palette.tertiary,
        fillAlpha: 0.18,
        strokeAlpha: 0.48,
        parallax: 30,
      },
    ]

    const mouseOffsetY = (mouseState.currentY - 0.5) * 2
    const mouseOffsetX = (mouseState.currentX - 0.5) * 2

    for (const r of ribbons) {
      ctx.beginPath()
      const step = 12
      let firstY = r.baseY

      for (let x = 0; x <= canvasW + step; x += step) {
        const nx = x + mouseOffsetX * r.parallax
        // Локальное притяжение волны к курсору
        const distToMouseX = (x - auraX) / (canvasW * 0.35)
        const mousePull = Math.exp(-distToMouseX * distToMouseX) * mouseOffsetY * r.parallax * mouseState.intensity

        const y =
          r.baseY +
          Math.sin(nx * r.freq1 + t * r.speed1) * r.amp1 +
          Math.cos(nx * r.freq2 + t * r.speed2) * r.amp2 +
          mousePull

        if (x === 0) {
          firstY = y
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      // Свечение вдоль гребня волны
      const strokeGrad = ctx.createLinearGradient(0, 0, canvasW, 0)
      strokeGrad.addColorStop(0, rgbaStr(r.colorA, 0.04))
      strokeGrad.addColorStop(0.35, rgbaStr(r.colorA, r.strokeAlpha))
      strokeGrad.addColorStop(0.75, rgbaStr(r.colorB, r.strokeAlpha * 1.15))
      strokeGrad.addColorStop(1, rgbaStr(r.colorB, 0.08))

      ctx.strokeStyle = strokeGrad
      ctx.lineWidth = 1.6
      ctx.stroke()

      // Заливка шёлкового шлейфа вниз
      ctx.lineTo(canvasW, canvasH + 20)
      ctx.lineTo(0, canvasH + 20)
      ctx.lineTo(0, firstY)
      ctx.closePath()

      const fillGrad = ctx.createLinearGradient(0, r.baseY - 40, 0, canvasH)
      fillGrad.addColorStop(0, rgbaStr(r.colorA, r.fillAlpha))
      fillGrad.addColorStop(0.55, rgbaStr(r.colorB, r.fillAlpha * 0.45))
      fillGrad.addColorStop(1, rgbaStr(r.colorB, 0))
      ctx.fillStyle = fillGrad
      ctx.fill()
    }

    // 3. Биолюминесцентные частицы и созвездия
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      p.phase += p.speed
      p.x += p.vx + Math.sin(p.phase * 0.7) * 0.15
      p.y += p.vy

      // Лёгкое отталкивание/реакция частиц на курсор
      if (mouseState.intensity > 0.05) {
        const dx = p.x - auraX
        const dy = p.y - auraY
        const distSq = dx * dx + dy * dy
        const minDist = 130
        if (distSq < minDist * minDist && distSq > 1) {
          const dist = Math.sqrt(distSq)
          const force = (1 - dist / minDist) * 0.55 * mouseState.intensity * p.depth
          p.x += (dx / dist) * force
          p.y += (dy / dist) * force
        }
      }

      //Бесшовный респаун частиц за границами
      if (p.y < -12) {
        p.y = canvasH + 10
        p.x = Math.random() * canvasW
      }
      if (p.x < -12) p.x = canvasW + 10
      if (p.x > canvasW + 12) p.x = -10

      const pulse = 0.45 + 0.55 * Math.sin(p.phase)
      const pColor = mixRgb(palette.primary, palette.tertiary, p.colorMix)
      const alpha = (0.18 + pulse * 0.42) * p.depth

      // Мягкое гало частицы
      const glowRadius = p.radius * 3.8
      const pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius)
      pGrad.addColorStop(0, rgbaStr(pColor, alpha))
      pGrad.addColorStop(0.45, rgbaStr(pColor, alpha * 0.35))
      pGrad.addColorStop(1, rgbaStr(pColor, 0))
      ctx.fillStyle = pGrad
      ctx.beginPath()
      ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2)
      ctx.fill()

      // Яркое ядро частицы
      ctx.fillStyle = rgbaStr([255, 255, 255], alpha * 0.75)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius * 0.55, 0, Math.PI * 2)
      ctx.fill()
    }

    rafId = requestAnimationFrame(render)
  }

  rafId = requestAnimationFrame(render)
}

function stopHeroAnimation(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function setupHeroObservers(): void {
  if (resizeObserver) resizeObserver.disconnect()
  if (heroCardRef.value) {
    resizeObserver = new ResizeObserver(() => {
      resizeHeroCanvas()
    })
    resizeObserver.observe(heroCardRef.value)
  }

  if (themeObserver) themeObserver.disconnect()
  themeObserver = new MutationObserver(() => {
    sampleAccentColors()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style', 'class', 'data-theme'],
  })
  if (document.body) {
    themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    })
  }
}

function notify(text: string, color = 'primary'): void {
  snackText.value = text
  snackColor.value = color
  snackbar.value = true
}

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    items.value = await listFiles(currentFolderId.value)
    if (isRoot.value) {
      const [favs, rec, st] = await Promise.all([listFavorites(), listRecent(), getStorage()])
      favoritesCount.value = favs.length
      recent.value = rec
      storage.value = st
      getBannerUrl()
        .then((u) => (bannerUrl.value = u))
        .catch(() => undefined)
    }
    loadThumbs([...items.value, ...recent.value])
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Ошибка соединения'
  } finally {
    loading.value = false
  }
}

function openFolder(folder: NodeItem): void {
  stack.value.push({ id: folder.id, name: folder.name })
  load()
}

function goUp(): void {
  if (stack.value.length > 1) stack.value.pop()
  load()
}

function breadcrumbIndex(item: any): number {
  return item?.index ?? 0
}

function isLastBreadcrumb(item: any): boolean {
  return (item?.index ?? 0) === stack.value.length - 1
}

function goTo(index: number): void {
  stack.value = stack.value.slice(0, index + 1)
  load()
}

function openFile(file: NodeItem, source: NodeItem[] = items.value): void {
  if (isAudio(file.name, file.mimeType)) {
    playTrack(file, source.filter((n) => n.type === 'file' && isAudio(n.name, n.mimeType)))
  } else {
    openPreview(file)
  }
}

async function download(file: NodeItem): Promise<void> {
  try {
    await downloadFile(file)
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка скачивания', 'error')
  }
}

async function removeNode(node: NodeItem): Promise<void> {
  try {
    await trashNode(node.id)
    notify(`«${node.name}» перемещено в корзину`)
    await load()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка', 'error')
  }
}

async function toggleFavorite(node: NodeItem): Promise<void> {
  try {
    await setFavorite(node.id, !node.isFavorite)
    node.isFavorite = !node.isFavorite
    notify(node.isFavorite ? 'Добавлено в избранное' : 'Убрано из избранного')
    if (isRoot.value) load()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка', 'error')
  }
}

async function hideRecent(file: NodeItem): Promise<void> {
  try {
    await setHiddenRecent(file.id, true)
    recent.value = recent.value.filter((r) => r.id !== file.id)
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка', 'error')
  }
}

function openRename(node: NodeItem): void {
  renameTarget.value = node
  renameValue.value = node.name
  renameDialog.value = true
}

async function submitRename(): Promise<void> {
  if (!renameTarget.value || !renameValue.value.trim()) return
  try {
    await renameNode(renameTarget.value.id, renameValue.value.trim())
    renameDialog.value = false
    await load()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка', 'error')
  }
}

async function submitCreateFolder(): Promise<void> {
  const name = newFolderName.value.trim()
  if (!name) return
  try {
    await createFolder(name, currentFolderId.value)
    createDialog.value = false
    newFolderName.value = ''
    await load()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка', 'error')
  }
}

function pickFiles(): void {
  fileInput.value?.click()
}

function onPick(e: Event): void {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length) upload(files)
  input.value = ''
}

async function upload(files: File[]): Promise<void> {
  if (!files.length) return
  uploading.value = true
  progress.value = 0
  try {
    const uploaded = await uploadFiles(files, currentFolderId.value, (loaded, total) => {
      progress.value = total ? Math.round((loaded / total) * 100) : 0
    })
    notify(`Загружено файлов: ${uploaded.length}`)
    await load()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка загрузки', 'error')
  } finally {
    uploading.value = false
  }
}

function onDragOver(e: DragEvent): void {
  if (draggingPin.value) return
  if (e.dataTransfer?.types.includes('Files')) {
    dragOver.value = true
  }
}

function onDragLeave(e: DragEvent): void {
  if (!e.relatedTarget) dragOver.value = false
}

function onDrop(e: DragEvent): void {
  dragOver.value = false
  const wasPin = draggingPin.value
  endPinDrag()
  if (wasPin) return
  const files = Array.from(e.dataTransfer?.files ?? [])
  if (files.length) upload(files)
}

function handlePendingFolder(): void {
  const f = pendingFolder.value
  if (!f) return
  pendingFolder.value = null
  stack.value = [{ id: null, name: 'Главная' }, { id: f.id, name: f.name }]
  load()
}

watch(pendingFolder, () => handlePendingFolder())

watch(isRoot, async (root) => {
  if (root) {
    await nextTick()
    setupHeroObservers()
    startHeroAnimation()
  } else {
    stopHeroAnimation()
  }
})

onMounted(async () => {
  if (pendingFolder.value) handlePendingFolder()
  else load()

  await nextTick()
  if (isRoot.value) {
    setupHeroObservers()
    startHeroAnimation()
  }
})

onBeforeUnmount(() => {
  stopHeroAnimation()
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
})
</script>

<style scoped>
.m3-dialog {
  background: var(--md-sys-color-surface-container-high);
  border-radius: 28px;
  padding: 32px;
  border: 1px solid var(--md-sys-color-outline-variant);
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. КОМПАКТНЫЕ ВИДЖЕТЫ (ХРАНИЛИЩЕ И ИЗБРАННОЕ)
   ═══════════════════════════════════════════════════════════════════════════ */
.m3-widget-card--compact {
  padding: 11px 16px !important;
  min-height: 68px !important;
  border-radius: 20px !important;
  border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant, #444) 45%, transparent);
  transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1),
              background-color 0.2s ease,
              border-color 0.25s ease;
}

.m3-widget-card--static {
  cursor: default;
}
.m3-widget-card--static:hover {
  background-color: var(--md-sys-color-surface-container) !important;
}

.m3-widget-card--interactive {
  cursor: pointer;
}
.m3-widget-card--interactive:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--md-sys-color-primary) 40%, transparent);
}

.m3-widget-avatar {
  width: 44px !important;
  height: 44px !important;
  border-radius: 13px !important;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.widget-progress-text {
  font-size: 0.68rem !important;
  letter-spacing: -0.02em;
}

.widget-eyebrow {
  font-size: 0.72rem;
  line-height: 1.15;
  font-weight: 500;
  opacity: 0.82;
}

.widget-main-value {
  font-size: 0.94rem;
  line-height: 1.25;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.widget-sub-value {
  font-size: 0.76rem;
  line-height: 1.2;
  opacity: 0.8;
  margin-top: 1px;
}

.widget-meta-row {
  font-size: 0.71rem;
  line-height: 1.25;
  opacity: 0.78;
}

.widget-meta-dot {
  opacity: 0.5;
}

.storage-dir {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.68rem;
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 7%, transparent);
  padding: 1px 6px;
  border-radius: 6px;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. ЖИВОЙ МНОГОСЛОЙНЫЙ ФОН ХИРО-КАРТОЧКИ (ПОДСТРОЙКА ПОД АКЦЕНТНЫЙ ЦВЕТ)
   ═══════════════════════════════════════════════════════════════════════════ */
.m3-hero-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(
      130% 110% at 95% 10%,
      color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent) 0%,
      transparent 65%
    ),
    radial-gradient(
      110% 100% at 5% 95%,
      color-mix(in srgb, var(--md-sys-color-tertiary, var(--md-sys-color-primary)) 14%, transparent) 0%,
      transparent 65%
    ),
    var(--md-sys-color-surface-container);
  transition: box-shadow 0.4s ease;
}

/* Контент всегда поверх анимационных слоёв */
.m3-hero-content {
  position: relative;
  z-index: 4;
}

/* Базовый контейнер CSS-анимаций */
.m3-hero-bg-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

/* Canvas со световыми шёлковыми волнами и частицами */
.m3-hero-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  mix-blend-mode: plus-lighter;
  opacity: 0.92;
}

/* Мягкая виньетка для идеальной читаемости текста слева */
.m3-hero-vignette {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    radial-gradient(
      90% 90% at 22% 42%,
      color-mix(in srgb, var(--md-sys-color-surface-container) 52%, transparent) 0%,
      transparent 75%
    );
}

/* Внутренний стеклянный контур с переливом от акцентного цвета */
.m3-hero-border-glow {
  position: absolute;
  inset: 0;
  z-index: 3;
  border-radius: inherit;
  pointer-events: none;
  box-shadow:
    inset 0 1px 0 0 color-mix(in srgb, var(--md-sys-color-primary) 38%, rgba(255, 255, 255, 0.14)),
    inset 0 0 36px 0 color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}

/* ─── Органические морфинг-сферы (CSS Aurora Blobs) ─── */
.m3-hero-blob {
  position: absolute;
  pointer-events: none;
  filter: blur(54px);
  will-change: transform, border-radius;
}

.m3-hero-blob--1 {
  width: 380px;
  height: 380px;
  top: -130px;
  right: -90px;
  background: radial-gradient(
    circle at 40% 40%,
    color-mix(in srgb, var(--md-sys-color-primary) 46%, transparent) 0%,
    color-mix(in srgb, var(--md-sys-color-primary-container, var(--md-sys-color-primary)) 20%, transparent) 48%,
    transparent 74%
  );
  animation: hero-morph-1 16s ease-in-out infinite alternate;
}

.m3-hero-blob--2 {
  width: 340px;
  height: 340px;
  bottom: -130px;
  left: -80px;
  background: radial-gradient(
    circle at 60% 50%,
    color-mix(in srgb, var(--md-sys-color-tertiary, var(--md-sys-color-primary)) 36%, transparent) 0%,
    color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent) 52%,
    transparent 74%
  );
  animation: hero-morph-2 21s ease-in-out infinite alternate;
}

.m3-hero-blob--3 {
  width: 300px;
  height: 300px;
  top: 28%;
  left: 44%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--md-sys-color-secondary, var(--md-sys-color-primary)) 30%, transparent) 0%,
    transparent 70%
  );
  animation: hero-morph-3 19s ease-in-out infinite alternate;
}

.m3-hero-blob--4 {
  width: 220px;
  height: 220px;
  bottom: 8%;
  right: 14%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--md-sys-color-primary) 34%, white 10%) 0%,
    transparent 68%
  );
  opacity: 0.55;
  animation: hero-morph-4 13s ease-in-out infinite alternate;
}

/* ─── Точечная матрица с радиальной маской ─── */
.m3-hero-dot-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    color-mix(in srgb, var(--md-sys-color-primary) 36%, var(--md-sys-color-on-surface) 14%) 1px,
    transparent 1px
  );
  background-size: 22px 22px;
  opacity: 0.24;
  mask-image: radial-gradient(ellipse 80% 75% at 78% 35%, #000 15%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 80% 75% at 78% 35%, #000 15%, transparent 75%);
  animation: hero-grid-breathe 10s ease-in-out infinite alternate;
}

/* ─── Декоративные орбитальные кольца в правом верхнем углу ─── */
.m3-hero-orbits {
  position: absolute;
  top: -60px;
  right: -60px;
  width: 340px;
  height: 340px;
  pointer-events: none;
  opacity: 0.45;
}

.m3-hero-orbit {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid transparent;
}

.m3-hero-orbit--1 {
  border-top-color: color-mix(in srgb, var(--md-sys-color-primary) 55%, transparent);
  border-right-color: color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent);
  animation: hero-orbit-spin 26s linear infinite;
}

.m3-hero-orbit--2 {
  inset: 38px;
  border-bottom-color: color-mix(in srgb, var(--md-sys-color-tertiary, var(--md-sys-color-primary)) 50%, transparent);
  border-left-color: color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent);
  border-style: dashed;
  animation: hero-orbit-spin-rev 34s linear infinite;
}

.m3-hero-orbit--3 {
  inset: 82px;
  border-top-color: color-mix(in srgb, var(--md-sys-color-primary) 40%, transparent);
  animation: hero-orbit-spin 18s linear infinite;
}

/* ─── Диагональный световой блик ─── */
.m3-hero-card::after {
  content: '';
  position: absolute;
  z-index: 2;
  top: -25%;
  bottom: -25%;
  left: -65%;
  width: 50%;
  pointer-events: none;
  background: linear-gradient(
    105deg,
    transparent 0%,
    color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent) 45%,
    color-mix(in srgb, var(--md-sys-color-tertiary, var(--md-sys-color-primary)) 9%, transparent) 58%,
    transparent 100%
  );
  transform: translateX(-30%) skewX(-16deg);
  opacity: 0;
  mix-blend-mode: screen;
  animation: hero-sheen 11s ease-in-out infinite;
}

/* ─── Улучшения типографики и кнопок поверх живого фона ─── */
.hero-title {
  position: relative;
  z-index: 1;
  letter-spacing: -0.015em;
}

.hero-username {
  display: inline-block;
  text-shadow: 0 0 28px color-mix(in srgb, var(--md-sys-color-primary) 38%, transparent);
}

.hero-subtitle {
  max-width: 520px;
}

.hero-btn-primary {
  box-shadow: 0 8px 24px -6px color-mix(in srgb, var(--md-sys-color-primary) 38%, transparent) !important;
  transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s ease !important;
}
.hero-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px -6px color-mix(in srgb, var(--md-sys-color-primary) 52%, transparent) !important;
}

.hero-btn-secondary {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: color-mix(in srgb, var(--md-sys-color-surface) 38%, transparent) !important;
  border-color: color-mix(in srgb, var(--md-sys-color-primary) 42%, var(--md-sys-color-outline)) !important;
  transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1), background-color 0.25s ease !important;
}
.hero-btn-secondary:hover {
  transform: translateY(-2px);
  background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent) !important;
}

/* ─── Кейфреймы ─── */
@keyframes hero-morph-1 {
  0% {
    transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
    border-radius: 42% 58% 60% 40% / 45% 45% 55% 55%;
  }
  50% {
    transform: translate3d(-65px, 45px, 0) scale(1.16) rotate(18deg);
    border-radius: 58% 42% 45% 55% / 52% 60% 40% 48%;
  }
  100% {
    transform: translate3d(35px, 85px, 0) scale(0.94) rotate(-12deg);
    border-radius: 48% 52% 64% 36% / 40% 54% 46% 60%;
  }
}

@keyframes hero-morph-2 {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    border-radius: 50% 50% 42% 58% / 55% 45% 55% 45%;
  }
  50% {
    transform: translate3d(75px, -55px, 0) scale(1.14);
    border-radius: 40% 60% 58% 42% / 44% 56% 44% 56%;
  }
  100% {
    transform: translate3d(-35px, -90px, 0) scale(0.96);
    border-radius: 62% 38% 46% 54% / 50% 50% 50% 50%;
  }
}

@keyframes hero-morph-3 {
  0%   { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
  50%  { transform: translate3d(-85px, -40px, 0) scale(1.24) rotate(16deg); }
  100% { transform: translate3d(55px, -70px, 0) scale(0.9) rotate(-14deg); }
}

@keyframes hero-morph-4 {
  0%   { transform: translate3d(0, 0, 0) scale(0.95); }
  50%  { transform: translate3d(-50px, -35px, 0) scale(1.25); }
  100% { transform: translate3d(25px, 30px, 0) scale(0.9); }
}

@keyframes hero-grid-breathe {
  0%   { opacity: 0.16; transform: scale(1); }
  100% { opacity: 0.32; transform: scale(1.03); }
}

@keyframes hero-orbit-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes hero-orbit-spin-rev {
  from { transform: rotate(360deg); }
  to   { transform: rotate(0deg); }
}

@keyframes hero-sheen {
  0%        { transform: translateX(-30%) skewX(-16deg); opacity: 0; }
  10%       { opacity: 1; }
  50%       { transform: translateX(440%) skewX(-16deg); opacity: 1; }
  58%, 100% { transform: translateX(440%) skewX(-16deg); opacity: 0; }
}

/* Уважаем системную настройку «меньше анимации» */
@media (prefers-reduced-motion: reduce) {
  .m3-hero-blob,
  .m3-hero-dot-grid,
  .m3-hero-orbit,
  .m3-hero-card::after {
    animation: none !important;
  }
  .m3-hero-canvas {
    display: none;
  }
}

/* Лёгкий подъём карточек при наведении (M3 motion) */
.m3-folder-card,
.m3-file-card {
  transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1), background-color 0.2s;
}
.m3-folder-card:hover,
.m3-file-card:hover {
  transform: translateY(-4px);
}
</style>