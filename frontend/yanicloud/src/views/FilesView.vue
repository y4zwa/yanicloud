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
      <!-- Левая главная карточка с органическим живым фоном M3 -->
      <div
        ref="heroCardRef"
        class="m3-card m3-hero-text-card m3-hero-card pa-10 d-flex flex-column justify-center"
        @mousemove="onHeroMouseMove"
        @mouseleave="onHeroMouseLeave"
      >
        <!-- СЛОЙ 1: Мягкая тональная подложка Material You -->
        <div class="m3-hero-ambient" aria-hidden="true">
          <div class="m3-hero-ambient-glow m3-hero-ambient-glow--1"></div>
          <div class="m3-hero-ambient-glow m3-hero-ambient-glow--2"></div>
        </div>

        <!-- СЛОЙ 2: Органический Canvas (дышащие M3-формы и плавный градиентный меш) -->
        <canvas ref="heroCanvasRef" class="m3-hero-canvas" aria-hidden="true"></canvas>

        <!-- СЛОЙ 3: Мягкая защита контраста текста слева -->
        <div class="m3-hero-readability-scrim" aria-hidden="true"></div>

        <!-- КОНТЕНТ ХИРО КАРТОЧКИ -->
        <div class="m3-hero-content d-flex flex-column flex-grow-1 justify-center">
          <div class="m3-hero-chip d-inline-flex align-center align-self-start mb-5">
            <span class="m3-hero-chip-dot mr-2"></span>
            <span>Личное облачное пространство</span>
          </div>

          <h1 class="text-h3 font-weight-medium mb-4 text-on-surface hero-title">
            {{ greeting }}, <br />
            <span class="text-primary hero-username">{{ currentUser?.username || 'друг' }}</span>
          </h1>

          <p class="text-title-medium text-on-surface-variant mb-10 hero-subtitle">
            Храните, делитесь и работайте из любой точки мира. Безопасно и быстро.
          </p>

          <div class="d-flex align-center gap-4 mt-auto hero-actions">
            <v-btn
              rounded="pill"
              size="x-large"
              color="primary"
              elevation="0"
              class="m3-btn-filled hero-btn-primary px-7 flex-grow-1"
              height="60"
              @click="pickFiles"
            >
              <v-icon start size="24" class="mr-2">mdi-cloud-upload-outline</v-icon>
              <span class="text-title-medium font-weight-medium text-none">Загрузить</span>
            </v-btn>

            <v-btn
              rounded="pill"
              size="x-large"
              variant="tonal"
              color="primary"
              elevation="0"
              class="m3-btn-tonal hero-btn-secondary px-7 flex-grow-1"
              height="60"
              @click="createDialog = true"
            >
              <v-icon start size="24" class="mr-2">mdi-folder-plus-outline</v-icon>
              <span class="text-title-medium font-weight-medium text-none">Создать папку</span>
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Правый баннер: статичный, без возможности нажатия и без ripple -->
      <div
        class="m3-hero-image-card m3-hero-image-card--static"
        :style="bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
      >
        <div class="m3-hero-image-overlay d-flex flex-column justify-end pa-9">
          <div class="m3-banner-badge d-inline-flex align-center align-self-start mb-3">
            <v-icon icon="mdi-shield-check-outline" size="16" class="mr-1.5"></v-icon>
            <span>Приватное хранилище</span>
          </div>
          <span class="text-h4 font-weight-medium text-white mb-1" style="letter-spacing: -0.02em;">YaniCloud</span>
          <span class="text-title-medium text-white" style="opacity: 0.84;">Ваше личное облако</span>
        </div>
      </div>
    </div>

    <!-- ВИДЖЕТЫ (только корень) — увеличенные, сбалансированные по гайдлайнам M3 -->
    <div v-if="isRoot" class="m3-widgets-row d-flex gap-6 mb-12">
      <!-- Хранилище: информационный виджет (некликабельный) -->
      <div class="m3-card m3-widget-card m3-widget-card--static d-flex align-center flex-grow-1">
        <div class="m3-progress-container mr-5">
          <v-progress-circular
            :model-value="storagePercent"
            color="primary"
            size="56"
            width="6"
            class="m3-circular-gauge font-weight-bold"
          >
            <span class="m3-gauge-label">{{ storagePercentLabel }}</span>
          </v-progress-circular>
        </div>

        <div class="min-width-0 flex-grow-1">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="m3-widget-label text-on-surface-variant">Занято хранилища</span>
            <span v-if="storageDir" class="m3-storage-dir-pill" :title="storageDir">
              {{ storageDir }}
            </span>
          </div>

          <div class="m3-widget-title text-on-surface text-truncate mb-1">
            {{ storageLabel }}
          </div>

          <div class="m3-widget-meta d-flex align-center text-on-surface-variant">
            <v-icon icon="mdi-harddisk" size="15" color="on-surface-variant" class="mr-1.5 opacity-80"></v-icon>
            <span class="text-truncate">
              Свободно на диске: {{ formatBytes(storage.diskFree) }} из {{ formatBytes(storage.diskTotal) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Избранное: интерактивный M3-виджет -->
      <div
        class="m3-card m3-widget-card m3-widget-card--interactive d-flex align-center flex-grow-1"
        v-ripple
        @click="$emit('goto-favorites')"
      >
        <div class="m3-icon-avatar primary-container m3-widget-avatar mr-5">
          <v-icon icon="mdi-star-rounded" color="on-primary-container" size="28"></v-icon>
        </div>

        <div class="min-width-0 flex-grow-1">
          <div class="m3-widget-label text-on-surface-variant mb-1">Быстрый доступ</div>
          <div class="m3-widget-title text-on-surface mb-0.5">Избранное</div>
          <div class="m3-widget-meta text-on-surface-variant">{{ favoritesCount }} элементов</div>
        </div>

        <div class="m3-widget-trailing-icon d-flex align-center justify-center ml-4">
          <v-icon icon="mdi-arrow-right" size="20" color="on-surface-variant"></v-icon>
        </div>
      </div>
    </div>

    <!-- НАВИГАЦИЯ ПО ПАПКАМ (только внутри папки) -->
    <div v-if="!isRoot" class="m3-folder-nav-bar d-flex align-center justify-space-between mb-6 pa-3 pl-4">
      <div class="d-flex align-center min-width-0">
        <v-btn
          icon="mdi-arrow-left"
          variant="tonal"
          color="primary"
          size="small"
          class="mr-3"
          @click="goUp"
        ></v-btn>
        <v-breadcrumbs :items="breadcrumb" class="m3-breadcrumbs pa-0">
          <template v-slot:divider><v-icon size="18" class="opacity-60">mdi-chevron-right</v-icon></template>
          <template v-slot:item="{ item }">
            <v-btn
              variant="text"
              color="on-surface-variant"
              rounded="pill"
              class="text-none text-title-medium px-3"
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
          variant="tonal"
          color="secondary"
          rounded="pill"
          class="text-none font-weight-medium px-5"
          prepend-icon="mdi-folder-plus-outline"
          @click="createDialog = true"
        >
          Создать папку
        </v-btn>
        <v-btn
          variant="flat"
          color="primary"
          rounded="pill"
          class="text-none font-weight-medium px-5"
          prepend-icon="mdi-cloud-upload-outline"
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
      <div v-if="!folders.length && !files.length" class="m3-card m3-empty-state pa-12 d-flex flex-column align-center justify-center">
        <div class="m3-empty-icon-wrap mb-5 d-flex align-center justify-center">
          <v-icon icon="mdi-folder-open-outline" color="primary" size="48"></v-icon>
        </div>
        <div class="text-h5 font-weight-medium text-on-surface mb-2">Здесь пока пусто</div>
        <div class="text-title-medium text-on-surface-variant mb-8 text-center" style="max-width: 360px;">
          Перетащите файлы прямо в это окно или создайте новую папку
        </div>
        <div class="d-flex gap-4">
          <v-btn color="primary" variant="flat" rounded="pill" size="large" class="text-none font-weight-medium px-6" prepend-icon="mdi-cloud-upload-outline" @click="pickFiles">
            Загрузить файлы
          </v-btn>
          <v-btn variant="tonal" color="primary" rounded="pill" size="large" class="text-none font-weight-medium px-6" prepend-icon="mdi-folder-plus-outline" @click="createDialog = true">
            Создать папку
          </v-btn>
        </div>
      </div>

      <!-- ПАПКИ -->
      <template v-if="folders.length">
        <div class="m3-section-header d-flex align-center mb-5">
          <h2 class="text-h5 font-weight-medium text-on-surface">Папки</h2>
          <span class="m3-section-badge ml-3">{{ folders.length }}</span>
        </div>
        <div class="m3-scroll-container gap-5 mb-12 pb-4">
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
              <div class="m3-folder-icon-box d-flex align-center justify-center">
                <v-icon :icon="fileIcon(folder)" :color="fileColor(folder)" size="36"></v-icon>
              </div>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                    color="on-surface-variant"
                    class="m3-card-menu-btn"
                    @click.stop
                  ></v-btn>
                </template>
                <v-list density="comfortable" class="m3-context-menu">
                  <v-list-item prepend-icon="mdi-folder-open-outline" title="Открыть" @click="openFolder(folder)"></v-list-item>
                  <v-list-item
                    :prepend-icon="folder.isFavorite ? 'mdi-star-off-outline' : 'mdi-star-outline'"
                    :title="folder.isFavorite ? 'Убрать из избранного' : 'В избранное'"
                    @click="toggleFavorite(folder)"
                  ></v-list-item>
                  <v-list-item prepend-icon="mdi-pencil-outline" title="Переименовать" @click="openRename(folder)"></v-list-item>
                  <v-list-item prepend-icon="mdi-delete-outline" title="Удалить" @click="removeNode(folder)"></v-list-item>
                </v-list>
              </v-menu>
            </div>
            <div class="mt-auto">
              <div class="text-title-large font-weight-medium text-on-surface text-truncate mb-1">{{ folder.name }}</div>
              <div class="text-body-2 text-on-surface-variant">{{ folder.items ?? 0 }} элементов</div>
            </div>
          </div>
        </div>
      </template>

      <!-- ФАЙЛЫ -->
      <template v-if="files.length">
        <div class="m3-section-header d-flex align-center mb-5">
          <h2 class="text-h5 font-weight-medium text-on-surface">{{ isRoot ? 'Файлы' : 'Файлы' }}</h2>
          <span class="m3-section-badge ml-3">{{ files.length }}</span>
        </div>
        <div class="d-flex flex-wrap gap-5 pb-12">
          <div
            v-for="file in files"
            :key="file.id"
            class="m3-card m3-file-card d-flex flex-column pa-4"
            v-ripple
            draggable="true"
            @dragstart="startPinDrag($event, file)"
            @dragend="endPinDrag"
            @click="openFile(file)"
          >
            <FileThumb :node="file" :thumb="thumbUrls[file.id]" />
            <div class="d-flex align-center justify-space-between mt-auto pt-3">
              <div class="overflow-hidden pr-2">
                <div class="text-title-medium font-weight-medium text-on-surface text-truncate mb-0.5">{{ file.name }}</div>
                <div class="text-body-2 text-on-surface-variant">{{ formatDate(file.updatedAt) }}</div>
              </div>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                    color="on-surface-variant"
                    class="m3-card-menu-btn"
                    @click.stop
                  ></v-btn>
                </template>
                <v-list density="comfortable" class="m3-context-menu">
                  <v-list-item
                    :prepend-icon="file.isFavorite ? 'mdi-star-off-outline' : 'mdi-star-outline'"
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
        <div class="m3-section-header d-flex align-center justify-space-between mb-5">
          <div class="d-flex align-center">
            <h2 class="text-h5 font-weight-medium text-on-surface">Недавние файлы</h2>
            <span class="m3-section-badge ml-3">{{ recent.length }}</span>
          </div>
        </div>
        <div class="m3-scroll-container gap-5 pb-12">
          <div
            v-for="file in recent"
            :key="file.id"
            class="m3-card m3-file-card d-flex flex-column pa-4"
            v-ripple
            draggable="true"
            @dragstart="startPinDrag($event, file)"
            @dragend="endPinDrag"
            @click="openFile(file, recent)"
          >
            <FileThumb :node="file" :thumb="thumbUrls[file.id]" />
            <div class="d-flex align-center justify-space-between mt-auto pt-3">
              <div class="overflow-hidden pr-2">
                <div class="text-title-medium font-weight-medium text-on-surface text-truncate mb-0.5">{{ file.name }}</div>
                <div class="text-body-2 text-on-surface-variant">{{ formatDate(file.updatedAt) }}</div>
              </div>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                    color="on-surface-variant"
                    class="m3-card-menu-btn"
                    @click.stop
                  ></v-btn>
                </template>
                <v-list density="comfortable" class="m3-context-menu">
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
          <v-btn variant="text" rounded="pill" class="text-none" @click="createDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" rounded="pill" class="text-none font-weight-medium px-6" @click="submitCreateFolder">
            Создать
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
          <v-btn variant="text" rounded="pill" class="text-none" @click="renameDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" rounded="pill" class="text-none font-weight-medium px-6" @click="submitRename">
            Сохранить
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
            <v-icon icon="mdi-cloud-upload-outline" color="primary" size="96"></v-icon>
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

/* ──────────────────────────────────────────────────────────────────────────
   MATERIAL DESIGN 3 EXPRESSIVE — ОРГАНИЧЕСКИЙ ЖИВОЙ ФОН (БЕЗ ПОЛОС И ШУМА)
   Дышащие биоморфные фигуры Material You на гладких замкнутых кривых Безье,
   синхронизированные с акцентным цветом (--md-sys-color-primary / container).
   ────────────────────────────────────────────────────────────────────────── */
type RGB = [number, number, number]

const heroCardRef = ref<HTMLElement | null>(null)
const heroCanvasRef = ref<HTMLCanvasElement | null>(null)

let rafId: number | null = null
let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null
let colorProbeCtx: CanvasRenderingContext2D | null = null

let canvasW = 0
let canvasH = 0

// Плавная физика отклика на курсор (M3 spring-like damping)
const pointer = {
  targetX: 0.78,
  targetY: 0.42,
  x: 0.78,
  y: 0.42,
  vx: 0,
  vy: 0,
  hover: 0,
  targetHover: 0,
}

const m3Palette = {
  primary: [139, 0, 3] as RGB,
  primaryContainer: [92, 16, 20] as RGB,
  tertiary: [175, 68, 82] as RGB,
  secondary: [130, 75, 78] as RGB,
  targetPrimary: [139, 0, 3] as RGB,
  targetPrimaryContainer: [92, 16, 20] as RGB,
  targetTertiary: [175, 68, 82] as RGB,
  targetSecondary: [130, 75, 78] as RGB,
}

function parseColorToRgb(raw: string, fallback: RGB): RGB {
  const val = raw.trim()
  if (!val) return fallback

  if (/^\d+\s*,\s*\d+\s*,\s*\d+$/.test(val)) {
    const parts = val.split(',').map((n) => parseInt(n.trim(), 10))
    return [parts[0] ?? fallback[0], parts[1] ?? fallback[1], parts[2] ?? fallback[2]]
  }

  if (val.startsWith('#')) {
    let hex = val.slice(1)
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
    if (hex.length >= 6) {
      const num = parseInt(hex.slice(0, 6), 16)
      if (!Number.isNaN(num)) {
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
      }
    }
  }

  const rgbMatch = val.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10),
      parseInt(rgbMatch[2], 10),
      parseInt(rgbMatch[3], 10),
    ]
  }

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
      const d = colorProbeCtx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2]]
    }
  } catch {
    // ignore
  }

  return fallback
}

function deriveTonalColor(rgb: RGB, hueShiftDeg: number, lightnessScale: number): RGB {
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

  h = (h + hueShiftDeg / 360 + 1) % 1
  const newL = Math.min(0.84, Math.max(0.22, l * lightnessScale))
  const newS = Math.min(0.95, Math.max(0.35, s))

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

function syncM3Palette(): void {
  const el = heroCardRef.value || document.documentElement
  const styles = getComputedStyle(el)
  const rootStyles = getComputedStyle(document.documentElement)

  const getVar = (name: string) =>
    styles.getPropertyValue(name).trim() || rootStyles.getPropertyValue(name).trim()

  const rawPrimary = getVar('--md-sys-color-primary') || getVar('--v-theme-primary') || '#8B0003'
  const primary = parseColorToRgb(rawPrimary, [139, 0, 3])

  const rawPrimaryContainer = getVar('--md-sys-color-primary-container')
  const primaryContainer = rawPrimaryContainer
    ? parseColorToRgb(rawPrimaryContainer, deriveTonalColor(primary, 6, 0.72))
    : deriveTonalColor(primary, 6, 0.72)

  const rawTertiary = getVar('--md-sys-color-tertiary')
  const tertiary = rawTertiary
    ? parseColorToRgb(rawTertiary, deriveTonalColor(primary, 24, 1.18))
    : deriveTonalColor(primary, 24, 1.18)

  const rawSecondary = getVar('--md-sys-color-secondary')
  const secondary = rawSecondary
    ? parseColorToRgb(rawSecondary, deriveTonalColor(primary, -18, 0.95))
    : deriveTonalColor(primary, -18, 0.95)

  m3Palette.targetPrimary = primary
  m3Palette.targetPrimaryContainer = primaryContainer
  m3Palette.targetTertiary = tertiary
  m3Palette.targetSecondary = secondary
}

function lerpRgb(curr: RGB, target: RGB, speed: number): void {
  curr[0] += (target[0] - curr[0]) * speed
  curr[1] += (target[1] - curr[1]) * speed
  curr[2] += (target[2] - curr[2]) * speed
}

function rgba(rgb: RGB, alpha: number): string {
  return `rgba(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}, ${alpha})`
}

/**
 * Рисует идеально гладкую замкнутую биоморфную фигуру Material You
 * через квадратичную сплайн-интерполяцию по серединам сегментов.
 */
function traceOrganicM3Shape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  baseRadius: number,
  lobes: number,
  time: number,
  rotation: number,
  lobeDepth: number,
  organicWobble: number,
  phaseOffset: number
): void {
  const steps = Math.max(24, lobes * 6)
  const pts: { x: number; y: number }[] = []

  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * Math.PI * 2
    // Основная гармоника формы M3 (клевер / цветок / сквиркл)
    const primaryWave = Math.cos(theta * lobes + rotation) * lobeDepth
    // Вторичное живое дыхание (делает форму органической, а не сухой шестерёнкой)
    const breathWave =
      Math.sin(theta * 2 - time * 0.9 + phaseOffset) * organicWobble +
      Math.cos(theta * 3 + time * 0.65 - phaseOffset) * (organicWobble * 0.6)

    const r = baseRadius * (1 + primaryWave + breathWave)
    pts.push({
      x: cx + Math.cos(theta) * r,
      y: cy + Math.sin(theta) * r,
    })
  }

  ctx.beginPath()
  const firstMidX = (pts[pts.length - 1].x + pts[0].x) * 0.5
  const firstMidY = (pts[pts.length - 1].y + pts[0].y) * 0.5
  ctx.moveTo(firstMidX, firstMidY)

  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i]
    const p1 = pts[(i + 1) % pts.length]
    const midX = (p0.x + p1.x) * 0.5
    const midY = (p0.y + p1.y) * 0.5
    ctx.quadraticCurveTo(p0.x, p0.y, midX, midY)
  }
  ctx.closePath()
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
}

function onHeroMouseMove(e: MouseEvent): void {
  const card = heroCardRef.value
  if (!card) return
  const rect = card.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  pointer.targetX = (e.clientX - rect.left) / rect.width
  pointer.targetY = (e.clientY - rect.top) / rect.height
  pointer.targetHover = 1
}

function onHeroMouseLeave(): void {
  pointer.targetX = 0.78
  pointer.targetY = 0.42
  pointer.targetHover = 0
}

function startHeroAnimation(): void {
  stopHeroAnimation()
  if (!isRoot.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  syncM3Palette()
  m3Palette.primary = [...m3Palette.targetPrimary] as RGB
  m3Palette.primaryContainer = [...m3Palette.targetPrimaryContainer] as RGB
  m3Palette.tertiary = [...m3Palette.targetTertiary] as RGB
  m3Palette.secondary = [...m3Palette.targetSecondary] as RGB

  resizeHeroCanvas()

  let tick = 0

  const renderFrame = (now: number) => {
    const canvas = heroCanvasRef.value
    if (!canvas || !isRoot.value) return
    const ctx = canvas.getContext('2d')
    if (!ctx || !canvasW || !canvasH) {
      rafId = requestAnimationFrame(renderFrame)
      return
    }

    tick++
    if (tick % 35 === 0) {
      syncM3Palette()
    }

    // Плавный переход палитры при смене акцента
    lerpRgb(m3Palette.primary, m3Palette.targetPrimary, 0.05)
    lerpRgb(m3Palette.primaryContainer, m3Palette.targetPrimaryContainer, 0.05)
    lerpRgb(m3Palette.tertiary, m3Palette.targetTertiary, 0.05)
    lerpRgb(m3Palette.secondary, m3Palette.targetSecondary, 0.05)

    // Пружинная инерция курсора (ощущение вязкой органической среды)
    const spring = 0.035
    const damping = 0.84
    pointer.vx = (pointer.vx + (pointer.targetX - pointer.x) * spring) * damping
    pointer.vy = (pointer.vy + (pointer.targetY - pointer.y) * spring) * damping
    pointer.x += pointer.vx
    pointer.y += pointer.vy
    pointer.hover += (pointer.targetHover - pointer.hover) * 0.04

    const t = now * 0.00065
    ctx.clearRect(0, 0, canvasW, canvasH)

    const minDim = Math.min(canvasW, canvasH)
    const offsetX = (pointer.x - 0.75) * 48
    const offsetY = (pointer.y - 0.45) * 36

    // 1. Фоновое мягкое свечение Material You (Ambient Fluid Mesh)
    const meshX = canvasW * 0.78 + offsetX * 0.9
    const meshY = canvasH * 0.44 + offsetY * 0.9
    const meshGrad = ctx.createRadialGradient(meshX, meshY, minDim * 0.05, meshX, meshY, canvasW * 0.72)
    meshGrad.addColorStop(0, rgba(m3Palette.primary, 0.22 + pointer.hover * 0.06))
    meshGrad.addColorStop(0.45, rgba(m3Palette.primaryContainer, 0.14))
    meshGrad.addColorStop(1, rgba(m3Palette.primary, 0))
    ctx.fillStyle = meshGrad
    ctx.fillRect(0, 0, canvasW, canvasH)

    // 2. ФИГУРА 1 (Крупный фоновый M3 Scallop / 6-лепестковый мягкий контур в правом верхнем углу)
    const c1x = canvasW * 0.86 + Math.sin(t * 0.7) * 18 + offsetX * 0.45
    const c1y = canvasH * 0.22 + Math.cos(t * 0.55) * 16 + offsetY * 0.45
    const r1 = minDim * 0.54

    traceOrganicM3Shape(ctx, c1x, c1y, r1, 6, t, t * 0.22, 0.085, 0.045, 0.4)
    const grad1 = ctx.createRadialGradient(c1x - r1 * 0.2, c1y - r1 * 0.2, r1 * 0.05, c1x, c1y, r1 * 1.15)
    grad1.addColorStop(0, rgba(m3Palette.primary, 0.26))
    grad1.addColorStop(0.6, rgba(m3Palette.primaryContainer, 0.16))
    grad1.addColorStop(1, rgba(m3Palette.primary, 0.02))
    ctx.fillStyle = grad1
    ctx.fill()

    ctx.strokeStyle = rgba(m3Palette.primary, 0.18)
    ctx.lineWidth = 1.25
    ctx.stroke()

    // 3. ФИГУРА 2 (Средний органический клевер M3 / 4-лепестковая текучая форма снизу справа)
    const c2x = canvasW * 0.72 + Math.cos(t * 0.62) * 22 - offsetX * 0.65
    const c2y = canvasH * 0.82 + Math.sin(t * 0.78) * 18 - offsetY * 0.65
    const r2 = minDim * 0.44

    traceOrganicM3Shape(ctx, c2x, c2y, r2, 4, t * 1.15, -t * 0.28 + 0.8, 0.11, 0.055, 2.1)
    const grad2 = ctx.createLinearGradient(c2x - r2, c2y - r2, c2x + r2, c2y + r2)
    grad2.addColorStop(0, rgba(m3Palette.tertiary, 0.24))
    grad2.addColorStop(0.55, rgba(m3Palette.primary, 0.16))
    grad2.addColorStop(1, rgba(m3Palette.secondary, 0.03))
    ctx.fillStyle = grad2
    ctx.fill()

    ctx.strokeStyle = rgba(m3Palette.tertiary, 0.2)
    ctx.lineWidth = 1.2
    ctx.stroke()

    // 4. ФИГУРА 3 (Мягкая дышащая капля-сквиркл в центре-справа, чутко откликающаяся на курсор)
    const c3x = canvasW * 0.64 + Math.sin(t * 0.95 + 1.2) * 16 + offsetX * 1.15
    const c3y = canvasH * 0.46 + Math.cos(t * 0.82 + 0.5) * 14 + offsetY * 1.15
    const r3 = minDim * (0.29 + pointer.hover * 0.025)

    traceOrganicM3Shape(ctx, c3x, c3y, r3, 5, t * 1.3, t * 0.35, 0.075, 0.06, 4.2)
    const grad3 = ctx.createRadialGradient(c3x, c3y, 0, c3x, c3y, r3 * 1.15)
    grad3.addColorStop(0, rgba(m3Palette.primary, 0.28 + pointer.hover * 0.08))
    grad3.addColorStop(0.65, rgba(m3Palette.tertiary, 0.12))
    grad3.addColorStop(1, rgba(m3Palette.primary, 0))
    ctx.fillStyle = grad3
    ctx.fill()

    ctx.strokeStyle = rgba(m3Palette.primary, 0.24 + pointer.hover * 0.1)
    ctx.lineWidth = 1.4
    ctx.stroke()

    rafId = requestAnimationFrame(renderFrame)
  }

  rafId = requestAnimationFrame(renderFrame)
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
    syncM3Palette()
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
/* ═══════════════════════════════════════════════════════════════════════════
   1. ХИРО-СЕКЦИЯ И ОРГАНИЧЕСКИЙ MATERIAL YOU ФОН (БЕЗ БЛИКОВ-ЛИНИЙ)
   ═══════════════════════════════════════════════════════════════════════════ */
.m3-hero-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  border-radius: 32px !important;
  background-color: var(--md-sys-color-surface-container);
  border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant, #444) 38%, transparent);
}

/* Тональная подложка Material 3 */
.m3-hero-ambient {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.m3-hero-ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(68px);
  pointer-events: none;
  will-change: transform;
}

.m3-hero-ambient-glow--1 {
  width: 420px;
  height: 420px;
  top: -150px;
  right: -100px;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent) 0%,
    transparent 70%
  );
  animation: m3-ambient-drift-1 18s ease-in-out infinite alternate;
}

.m3-hero-ambient-glow--2 {
  width: 360px;
  height: 360px;
  bottom: -140px;
  right: 12%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--md-sys-color-tertiary, var(--md-sys-color-primary)) 24%, transparent) 0%,
    transparent 72%
  );
  animation: m3-ambient-drift-2 22s ease-in-out infinite alternate;
}

/* Холст с органическими фигурами Material 3 */
.m3-hero-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

/* Мягкая защита читаемости текста в левой части карточки */
.m3-hero-readability-scrim {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(
    100deg,
    color-mix(in srgb, var(--md-sys-color-surface-container) 78%, transparent) 0%,
    color-mix(in srgb, var(--md-sys-color-surface-container) 42%, transparent) 48%,
    transparent 85%
  );
}

.m3-hero-content {
  position: relative;
  z-index: 3;
}

/* Тональный бейдж над приветствием в стиле Google One / Pixel UI */
.m3-hero-chip {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--md-sys-color-on-secondary-container, var(--md-sys-color-on-surface));
  background: color-mix(
    in srgb,
    var(--md-sys-color-primary) 14%,
    var(--md-sys-color-surface-container-high, rgba(255, 255, 255, 0.06))
  );
  border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 24%, transparent);
}

.m3-hero-chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--md-sys-color-primary);
  box-shadow: 0 0 8px color-mix(in srgb, var(--md-sys-color-primary) 80%, transparent);
}

.hero-title {
  line-height: 1.16 !important;
  letter-spacing: -0.022em !important;
}

.hero-username {
  display: inline-block;
}

.hero-subtitle {
  line-height: 1.6 !important;
  max-width: 500px;
  opacity: 0.88;
}

.hero-btn-primary {
  transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s cubic-bezier(0.2, 0, 0, 1) !important;
}
.hero-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px -6px color-mix(in srgb, var(--md-sys-color-primary) 45%, transparent) !important;
}

.hero-btn-secondary {
  background: color-mix(
    in srgb,
    var(--md-sys-color-primary) 14%,
    var(--md-sys-color-surface-container-highest, rgba(255, 255, 255, 0.07))
  ) !important;
  transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1), background-color 0.2s ease !important;
}
.hero-btn-secondary:hover {
  transform: translateY(-2px);
  background: color-mix(
    in srgb,
    var(--md-sys-color-primary) 22%,
    var(--md-sys-color-surface-container-highest, rgba(255, 255, 255, 0.1))
  ) !important;
}

/* Правый баннер — полностью статичный, некликабельный */
.m3-hero-image-card--static {
  cursor: default !important;
  user-select: none;
  border-radius: 32px !important;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant, #444) 35%, transparent);
  transform: none !important;
}

.m3-banner-badge {
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

@keyframes m3-ambient-drift-1 {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  100% { transform: translate3d(-45px, 35px, 0) scale(1.12); }
}

@keyframes m3-ambient-drift-2 {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  100% { transform: translate3d(-35px, -40px, 0) scale(1.15); }
}

@media (prefers-reduced-motion: reduce) {
  .m3-hero-ambient-glow {
    animation: none !important;
  }
  .m3-hero-canvas {
    display: none;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. ВИДЖЕТЫ (ХРАНИЛИЩЕ И ИЗБРАННОЕ) — СБАЛАНСИРОВАННЫЙ РАЗМЕР MATERIAL 3
   ═══════════════════════════════════════════════════════════════════════════ */
.m3-widget-card {
  padding: 20px 24px !important;
  min-height: 98px !important;
  border-radius: 24px !important;
  background-color: var(--md-sys-color-surface-container) !important;
  border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant, #444) 38%, transparent);
  transition:
    transform 0.25s cubic-bezier(0.2, 0, 0, 1),
    background-color 0.2s cubic-bezier(0.2, 0, 0, 1),
    border-color 0.25s cubic-bezier(0.2, 0, 0, 1);
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
  background-color: var(--md-sys-color-surface-container-high, var(--md-sys-color-surface-container)) !important;
  border-color: color-mix(in srgb, var(--md-sys-color-primary) 42%, transparent);
}

.m3-progress-container {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m3-circular-gauge :deep(.v-progress-circular__overlay) {
  stroke-linecap: round;
}

.m3-gauge-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--md-sys-color-on-surface);
}

.m3-widget-avatar {
  width: 56px !important;
  height: 56px !important;
  border-radius: 18px !important;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m3-widget-label {
  font-size: 0.8rem;
  line-height: 1.25;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.m3-widget-title {
  font-size: 1.15rem;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: -0.015em;
}

.m3-widget-meta {
  font-size: 0.82rem;
  line-height: 1.35;
}

.m3-storage-dir-pill {
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.72rem;
  color: var(--md-sys-color-on-surface-variant);
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
  padding: 2px 8px;
  border-radius: 8px;
}

.m3-widget-trailing-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 6%, transparent);
  transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1), background-color 0.25s ease;
}

.m3-widget-card--interactive:hover .m3-widget-trailing-icon {
  transform: translateX(4px);
  background: color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. СЕКЦИИ, ПАПКИ, ФАЙЛЫ И ДИАЛОГИ В ЭСТЕТИКЕ MATERIAL DESIGN 3
   ═══════════════════════════════════════════════════════════════════════════ */
.m3-section-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--md-sys-color-primary);
  background: color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent);
}

.m3-folder-nav-bar {
  background: var(--md-sys-color-surface-container);
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant, #444) 35%, transparent);
}

.m3-folder-card,
.m3-file-card {
  border-radius: 24px !important;
  border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant, #444) 32%, transparent);
  transition:
    transform 0.25s cubic-bezier(0.2, 0, 0, 1),
    background-color 0.2s cubic-bezier(0.2, 0, 0, 1),
    border-color 0.25s cubic-bezier(0.2, 0, 0, 1);
}

.m3-folder-card:hover,
.m3-file-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--md-sys-color-primary) 38%, transparent);
}

.m3-folder-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
}

.m3-empty-state {
  border-radius: 28px !important;
  border: 1px dashed color-mix(in srgb, var(--md-sys-color-outline-variant, #444) 60%, transparent);
}

.m3-empty-icon-wrap {
  width: 88px;
  height: 88px;
  border-radius: 28px;
  background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
}

.m3-dialog {
  background: var(--md-sys-color-surface-container-high);
  border-radius: 28px;
  padding: 32px;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.m3-context-menu {
  border-radius: 16px !important;
}
</style>