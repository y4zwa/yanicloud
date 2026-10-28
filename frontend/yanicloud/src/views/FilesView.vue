<template>
  <div
    class="m3-container nunito-scope"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
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
      <div class="m3-card m3-hero-text-card m3-hero-card pa-10 d-flex flex-column justify-center">
        <!-- СПОКОЙНАЯ МЕДЛЕННАЯ КОМПОЗИЦИЯ MATERIAL 3 SHAPES
             Все 4 фигуры фиксированного размера, плавно и синхронно движутся,
             с заметным разбросом оттенков от текущего акцентного цвета -->
        <svg
          class="m3-hero-shapes-svg"
          viewBox="0 0 600 420"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <!-- 1. Большой 8-лепестковый M3 Cookie (глубокий тёмный тон акцента) -->
          <g class="m3-shape-group m3-shape-group--1">
            <path :d="STATIC_SHAPE_COOKIE" class="m3-shape m3-shape--tone-deep" />
          </g>

          <!-- 2. 4-листный клевер M3 снизу (средний тон акцента) -->
          <g class="m3-shape-group m3-shape-group--2">
            <path :d="STATIC_SHAPE_CLOVER" class="m3-shape m3-shape--tone-mid" />
          </g>

          <!-- 3. 12-волновая фигура M3 Sunny (насыщенный яркий тон акцента) -->
          <g class="m3-shape-group m3-shape-group--3">
            <path :d="STATIC_SHAPE_SUNNY" class="m3-shape m3-shape--tone-vivid" />
          </g>

          <!-- 4. Мягкий сквиркл M3 справа (светлый пастельный тон акцента) -->
          <g class="m3-shape-group m3-shape-group--4">
            <path :d="STATIC_SHAPE_PILL" class="m3-shape m3-shape--tone-soft-light" />
          </g>
        </svg>

        <!-- КОНТЕНТ ХИРО КАРТОЧКИ -->
        <div class="m3-hero-content d-flex flex-column flex-grow-1 justify-center">
          <h1 class="text-h3 font-weight-bold mb-4 text-on-surface hero-title" style="line-height: 1.18;">
            {{ greeting }}, <br />
            <span class="text-primary">{{ currentUser?.username || 'друг' }}</span>
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
              class="m3-btn-filled px-6 flex-grow-1"
              height="64"
              @click="pickFiles"
            >
              <v-icon start size="26">mdi-cloud-upload</v-icon>
              <span class="text-title-medium font-weight-bold text-on-primary-container text-none">Загрузить</span>
            </v-btn>
            <v-btn
              rounded="pill"
              size="x-large"
              variant="flat"
              elevation="0"
              class="m3-btn-tonal-surface px-6 flex-grow-1"
              height="64"
              @click="createDialog = true"
            >
              <span class="text-title-medium font-weight-bold text-primary text-none">Создать папку</span>
              <v-icon end size="26" color="primary">mdi-folder-plus</v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Баннер: чистая картинка без надписей и без кликабельности -->
      <div
        class="m3-hero-image-card m3-hero-image-card--static"
        :style="bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
      ></div>
    </div>

    <!-- ВИДЖЕТЫ (только корень) -->
    <div v-if="isRoot" class="m3-widgets-row d-flex gap-6 mb-12">
      <!-- Хранилище: статичный информационный виджет -->
      <div class="m3-card m3-widget-card m3-widget-card--static d-flex align-center flex-grow-1">
        <div class="m3-progress-wrapper mr-5">
          <v-progress-circular
            :model-value="storagePercent"
            color="primary"
            size="58"
            width="6"
            class="font-weight-bold text-body-2"
          >
            {{ storagePercentLabel }}
          </v-progress-circular>
        </div>
        <div class="min-width-0 flex-grow-1">
          <div class="d-flex align-center justify-space-between gap-2 mb-0.5">
            <span class="text-body-2 font-weight-medium text-on-surface-variant">Занято хранилища</span>
            <span v-if="storageDir" class="storage-dir text-caption text-on-surface-variant" :title="storageDir">
              {{ storageDir }}
            </span>
          </div>
          <div class="text-h6 font-weight-bold text-on-surface text-truncate" style="line-height: 1.3;">
            {{ storageLabel }}
          </div>
          <div class="d-flex align-center mt-1" style="gap: 6px">
            <v-icon icon="mdi-harddisk" size="16" color="on-surface-variant"></v-icon>
            <span class="text-body-2 text-on-surface-variant text-truncate">
              Свободно на диске: {{ formatBytes(storage.diskFree) }} из {{ formatBytes(storage.diskTotal) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Избранное: кликабельный виджет -->
      <div
        class="m3-card m3-widget-card m3-widget-card--interactive d-flex align-center flex-grow-1"
        v-ripple
        @click="$emit('goto-favorites')"
      >
        <div class="m3-icon-avatar primary-container m3-widget-avatar mr-5">
          <v-icon icon="mdi-star" color="on-primary-container" size="28"></v-icon>
        </div>
        <div class="min-width-0">
          <div class="text-h6 font-weight-bold text-on-surface mb-0.5" style="line-height: 1.3;">Избранное</div>
          <div class="text-body-2 text-on-surface-variant">{{ favoritesCount }} элементов</div>
        </div>
        <v-spacer></v-spacer>
        <v-icon icon="mdi-chevron-right" color="on-surface-variant" size="24" class="mr-1"></v-icon>
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
              class="text-none text-title-medium font-weight-semibold"
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
          color="primary"
          rounded="pill"
          class="text-none font-weight-bold"
          prepend-icon="mdi-folder-plus"
          @click="createDialog = true"
        >
          Создать папку
        </v-btn>
        <v-btn
          color="primary-container"
          elevation="0"
          rounded="pill"
          class="text-none font-weight-bold"
          prepend-icon="mdi-cloud-upload"
          @click="pickFiles"
        >
          <span class="text-on-primary-container">Загрузить</span>
        </v-btn>
      </div>
    </div>

    <!-- СОСТОЯНИЯ -->
    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>
    <div v-else-if="error" class="m3-card pa-8 text-center">
      <v-icon icon="mdi-alert-circle-outline" color="error" size="48" class="mb-4"></v-icon>
      <div class="text-h6 font-weight-bold text-on-surface mb-2">Не удалось загрузить файлы</div>
      <div class="text-title-medium text-on-surface-variant mb-6">{{ error }}</div>
      <v-btn variant="tonal" color="primary" rounded="pill" class="text-none font-weight-bold" @click="load">Повторить</v-btn>
    </div>

    <template v-else>
      <!-- ПУСТО -->
      <div v-if="!folders.length && !files.length" class="m3-card pa-12 d-flex flex-column align-center justify-center">
        <v-icon icon="mdi-folder-open-outline" color="on-surface-variant" size="80" class="mb-4"></v-icon>
        <div class="text-h5 font-weight-bold text-on-surface mb-2">Здесь пока пусто</div>
        <div class="text-title-medium text-on-surface-variant mb-8">Перетащите файлы или создайте папку</div>
        <div class="d-flex gap-4">
          <v-btn color="primary-container" elevation="0" rounded="pill" class="text-none font-weight-bold" prepend-icon="mdi-cloud-upload" @click="pickFiles">
            <span class="text-on-primary-container">Загрузить</span>
          </v-btn>
          <v-btn variant="tonal" color="primary" rounded="pill" class="text-none font-weight-bold" prepend-icon="mdi-folder-plus" @click="createDialog = true">
            Создать папку
          </v-btn>
        </div>
      </div>

      <!-- ПАПКИ -->
      <template v-if="folders.length">
        <div class="m3-section-header d-flex align-center mb-6">
          <h2 class="text-h5 font-weight-bold text-on-surface">Папки</h2>
        </div>
        <div class="m3-scroll-container gap-6 mb-12 pb-4">
          <div
            v-for="folder in folders"
            :key="folder.id"
            class="m3-card m3-folder-card d-flex flex-column pa-6"
            v-ripple
            draggable="true"
            @dragstart="onCardDragStart($event, folder)"
            @drag="onCardDrag($event, folder)"
            @dragend="onCardDragEnd"
            @click="openFolder(folder)"
          >
            <div class="d-flex justify-space-between align-start mb-6">
              <v-icon :icon="fileIcon(folder)" :color="fileColor(folder)" size="52"></v-icon>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-dots-vertical"
                    variant="text"
                    color="on-surface-variant"
                    draggable="false"
                    @dragstart.stop.prevent
                    @mousedown.stop
                    @click.stop
                  ></v-btn>
                </template>
                <v-list density="comfortable" class="nunito-scope">
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
              <div class="text-h6 font-weight-bold text-on-surface text-truncate mb-1">{{ folder.name }}</div>
              <div class="text-body-1 text-on-surface-variant">{{ folder.items ?? 0 }} элементов</div>
            </div>
          </div>
        </div>
      </template>

      <!-- ФАЙЛЫ -->
      <template v-if="files.length">
        <div class="m3-section-header d-flex align-center mb-6">
          <h2 class="text-h5 font-weight-bold text-on-surface">Файлы</h2>
        </div>
        <div class="d-flex flex-wrap gap-6 pb-12">
          <div
            v-for="file in files"
            :key="file.id"
            class="m3-card m3-file-card d-flex flex-column pa-5"
            v-ripple
            draggable="true"
            @dragstart="onCardDragStart($event, file)"
            @drag="onCardDrag($event, file)"
            @dragend="onCardDragEnd"
            @click="openFile(file)"
          >
            <div class="m3-thumb-guard" draggable="false">
              <FileThumb :node="file" :thumb="thumbUrls[file.id]" />
            </div>
            <div class="d-flex align-center justify-space-between mt-auto">
              <div class="overflow-hidden pr-3">
                <div class="text-title-medium font-weight-bold text-on-surface text-truncate mb-1">{{ file.name }}</div>
                <div class="text-body-2 text-on-surface-variant">{{ formatDate(file.updatedAt) }}</div>
              </div>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-dots-vertical"
                    variant="text"
                    color="on-surface-variant"
                    draggable="false"
                    @dragstart.stop.prevent
                    @mousedown.stop
                    @click.stop
                  ></v-btn>
                </template>
                <v-list density="comfortable" class="nunito-scope">
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
          <h2 class="text-h5 font-weight-bold text-on-surface">Недавние файлы</h2>
        </div>
        <div class="m3-scroll-container gap-6 pb-12">
          <div
            v-for="file in recent"
            :key="file.id"
            class="m3-card m3-file-card d-flex flex-column pa-5"
            v-ripple
            draggable="true"
            @dragstart="onCardDragStart($event, file)"
            @drag="onCardDrag($event, file)"
            @dragend="onCardDragEnd"
            @click="openFile(file, recent)"
          >
            <div class="m3-thumb-guard" draggable="false">
              <FileThumb :node="file" :thumb="thumbUrls[file.id]" />
            </div>
            <div class="d-flex align-center justify-space-between mt-auto">
              <div class="overflow-hidden pr-3">
                <div class="text-title-medium font-weight-bold text-on-surface text-truncate mb-1">{{ file.name }}</div>
                <div class="text-body-2 text-on-surface-variant">{{ formatDate(file.updatedAt) }}</div>
              </div>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-dots-vertical"
                    variant="text"
                    color="on-surface-variant"
                    draggable="false"
                    @dragstart.stop.prevent
                    @mousedown.stop
                    @click.stop
                  ></v-btn>
                </template>
                <v-list density="comfortable" class="nunito-scope">
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
      <div class="m3-dialog nunito-scope">
        <div class="text-h6 font-weight-bold text-on-surface mb-4">Новая папка</div>
        <v-text-field
          v-model="newFolderName"
          label="Название"
          variant="outlined"
          autofocus
          @keyup.enter="submitCreateFolder"
        ></v-text-field>
        <div class="d-flex justify-end gap-4 mt-2">
          <v-btn variant="text" class="text-none font-weight-bold" @click="createDialog = false">Отмена</v-btn>
          <v-btn color="primary-container" elevation="0" rounded="pill" class="text-none font-weight-bold" @click="submitCreateFolder">
            <span class="text-on-primary-container">Создать</span>
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- ДИАЛОГ: ПЕРЕИМЕНОВАТЬ -->
    <v-dialog v-model="renameDialog" max-width="440">
      <div class="m3-dialog nunito-scope">
        <div class="text-h6 font-weight-bold text-on-surface mb-4">Переименовать</div>
        <v-text-field
          v-model="renameValue"
          label="Название"
          variant="outlined"
          autofocus
          @keyup.enter="submitRename"
        ></v-text-field>
        <div class="d-flex justify-end gap-4 mt-2">
          <v-btn variant="text" class="text-none font-weight-bold" @click="renameDialog = false">Отмена</v-btn>
          <v-btn color="primary-container" elevation="0" rounded="pill" class="text-none font-weight-bold" @click="submitRename">
            <span class="text-on-primary-container">Сохранить</span>
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- УВЕДОМЛЕНИЯ -->
    <v-snackbar v-model="snackbar" :color="snackColor" timeout="3000" rounded="pill" class="nunito-scope">
      {{ snackText }}
    </v-snackbar>

    <!-- DRAG AND DROP OVERLAY -->
    <transition name="fade">
      <div v-if="dragOver" class="m3-drag-overlay nunito-scope d-flex align-center justify-center">
        <div class="m3-drag-scrim"></div>
        <div class="m3-drag-dialog d-flex flex-column align-center justify-center pa-12 elevation-6">
          <div class="m3-drag-icon-container mb-8">
            <v-icon icon="mdi-cloud-upload" color="primary" size="100"></v-icon>
          </div>
          <h2 class="text-h3 font-weight-bold text-on-surface mb-4">Отпустите файлы</h2>
          <p class="text-h6 text-on-surface-variant text-center" style="line-height: 1.5;">
            Они будут загружены<br />в текущую директорию
          </p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
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
   СТАТИЧЕСКАЯ ГЕОМЕТРИЯ ФИГУР MATERIAL 3 (БЕЗ ИСКАЖЕНИЯ РАЗМЕРА)
   Генерируется один раз с идеальными пропорциями. Само движение — медленное,
   спокойное вращение и плавание всех 4 фигур через GPU CSS-анимации.
   ────────────────────────────────────────────────────────────────────────── */
function createStaticM3ShapePath(
  cx: number,
  cy: number,
  baseR: number,
  lobes: number,
  lobeDepth: number,
  rotation = 0
): string {
  const numPts = 96
  const pts: [number, number][] = []

  for (let i = 0; i < numPts; i++) {
    const a = (i / numPts) * Math.PI * 2
    const r = baseR * (1 + Math.cos(a * lobes + rotation) * lobeDepth)
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }

  const len = pts.length
  const startMidX = (pts[len - 1][0] + pts[0][0]) * 0.5
  const startMidY = (pts[len - 1][1] + pts[0][1]) * 0.5

  let d = `M ${startMidX.toFixed(2)} ${startMidY.toFixed(2)}`
  for (let i = 0; i < len; i++) {
    const p0 = pts[i]
    const p1 = pts[(i + 1) % len]
    const midX = (p0[0] + p1[0]) * 0.5
    const midY = (p0[1] + p1[1]) * 0.5
    d += ` Q ${p0[0].toFixed(2)} ${p0[1].toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`
  }
  return d + ' Z'
}

// Центры фигур в системе координат 600x420
const STATIC_SHAPE_COOKIE = createStaticM3ShapePath(525, 86, 184, 8, 0.068, 0.2)
const STATIC_SHAPE_CLOVER = createStaticM3ShapePath(490, 352, 146, 4, 0.11, 0.6)
const STATIC_SHAPE_SUNNY = createStaticM3ShapePath(425, 206, 90, 12, 0.058, 0.1)
const STATIC_SHAPE_PILL = createStaticM3ShapePath(556, 224, 54, 4, 0.088, 0.8)

/* ──────────────────────────────────────────────────────────────────────────
   ЧИСТЫЙ ФАНТОМ ПЕРЕТАСКИВАНИЯ (БЕЗ ЧЁРНЫХ КВАДРАТНЫХ УГЛОВ И БЕЗ V-RIPPLE)
   + АКТИВАЦИЯ ПАНЕЛИ ЗАКРЕПОВ ТОЛЬКО У ЛЕВОГО КРАЯ ЭКРАНА
   ────────────────────────────────────────────────────────────────────────── */
let dragGhostCanvas: HTMLCanvasElement | null = null
let activeDraggedNode: NodeItem | null = null
let isInternalCardDragging = false

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * Создаёт идеально скруглённый drag-image на прозрачном Canvas,
 * чтобы браузер не рисовал чёрные квадратные углы и круги от v-ripple.
 */
function buildCleanDragGhost(cardEl: HTMLElement, node: NodeItem): HTMLCanvasElement {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = 220
  const h = 148
  const radius = 24

  if (!dragGhostCanvas) {
    dragGhostCanvas = document.createElement('canvas')
  }
  dragGhostCanvas.width = w * dpr
  dragGhostCanvas.height = h * dpr
  dragGhostCanvas.style.width = `${w}px`
  dragGhostCanvas.style.height = `${h}px`

  const ctx = dragGhostCanvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const cardStyle = getComputedStyle(cardEl)
  const rootStyle = getComputedStyle(document.documentElement)

  const bg =
    cardStyle.backgroundColor && cardStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
      ? cardStyle.backgroundColor
      : rootStyle.getPropertyValue('--md-sys-color-surface-container-high').trim() || '#26242b'

  const primary =
    rootStyle.getPropertyValue('--md-sys-color-primary').trim() || '#c7bfff'

  const textOnSurface =
    rootStyle.getPropertyValue('--md-sys-color-on-surface').trim() || '#e6e1e5'

  const textVariant =
    rootStyle.getPropertyValue('--md-sys-color-on-surface-variant').trim() || '#cac4d0'

  // Скруглённая плашка карточки (без каких-либо чёрных углов снаружи)
  drawRoundedRect(ctx, 0, 0, w, h, radius)
  ctx.fillStyle = bg
  ctx.fill()

  // Рисуем аккуратную иконку папки/файла сверху слева
  ctx.fillStyle = primary
  if (node.type === 'folder') {
    // Форма иконки папки Material 3
    ctx.beginPath()
    ctx.moveTo(24, 30)
    ctx.lineTo(40, 30)
    ctx.lineTo(45, 35)
    ctx.lineTo(62, 35)
    ctx.quadraticCurveTo(66, 35, 66, 39)
    ctx.lineTo(66, 59)
    ctx.quadraticCurveTo(66, 63, 62, 63)
    ctx.lineTo(24, 63)
    ctx.quadraticCurveTo(20, 63, 20, 59)
    ctx.lineTo(20, 34)
    ctx.quadraticCurveTo(20, 30, 24, 30)
    ctx.closePath()
    ctx.fill()
  } else {
    drawRoundedRect(ctx, 22, 26, 36, 42, 8)
    ctx.fill()
  }

  // Название папки/файла шрифтом Nunito
  ctx.fillStyle = textOnSurface
  ctx.font = '700 18px "Nunito", sans-serif'
  const maxTextWidth = w - 44
  let title = node.name
  if (ctx.measureText(title).width > maxTextWidth) {
    while (title.length > 1 && ctx.measureText(title + '…').width > maxTextWidth) {
      title = title.slice(0, -1)
    }
    title += '…'
  }
  ctx.fillText(title, 22, 102)

  // Подпись количества элементов или типа
  ctx.fillStyle = textVariant
  ctx.font = '500 14px "Nunito", sans-serif'
  const sub = node.type === 'folder' ? `${node.items ?? 0} элементов` : 'Файл'
  ctx.fillText(sub, 22, 124)

  return dragGhostCanvas
}

function cleanupPinDragState(): void {
  isInternalCardDragging = false
  activeDraggedNode = null
  if (draggingPin.value) {
    endPinDrag()
  }
  window.removeEventListener('dragend', cleanupPinDragState, true)
  window.removeEventListener('drop', cleanupPinDragState, true)
  window.removeEventListener('mouseup', cleanupPinDragState, true)
  window.removeEventListener('blur', cleanupPinDragState)
  window.removeEventListener('mousemove', onWindowMouseMoveVerifyDrag, true)
}

function onWindowMouseMoveVerifyDrag(e: MouseEvent): void {
  if (e.buttons === 0 && (draggingPin.value || isInternalCardDragging)) {
    cleanupPinDragState()
  }
}

function onCardDragStart(e: DragEvent, node: NodeItem): void {
  isInternalCardDragging = true
  activeDraggedNode = node

  // 1. Заполняем dataTransfer точно так же, как делает startPinDrag,
  // НО НЕ включаем draggingPin.value сразу, чтобы боковая панель слева
  // НЕ перекрашивалась в серый цвет, пока ты просто тягаешь папку по экрану!
  startPinDrag(e, node)
  endPinDrag()

  // 2. Ставим чистый скруглённый фантом без чёрных квадратных углов и без круга ripple
  const cardEl = e.currentTarget as HTMLElement | null
  if (cardEl && e.dataTransfer) {
    const ghost = buildCleanDragGhost(cardEl, node)
    e.dataTransfer.setDragImage(ghost, 36, 36)
  }

  window.addEventListener('dragend', cleanupPinDragState, true)
  window.addEventListener('drop', cleanupPinDragState, true)
  window.addEventListener('mouseup', cleanupPinDragState, true)
  window.addEventListener('blur', cleanupPinDragState)
  window.addEventListener('mousemove', onWindowMouseMoveVerifyDrag, true)
}

function onCardDrag(e: DragEvent, node: NodeItem): void {
  if (!isInternalCardDragging) return
  // В последний кадр перед отпусканием браузер шлёт clientX = 0, clientY = 0 — игнорируем
  if (e.clientX === 0 && e.clientY === 0) return

  // Активируем зону закрепов в боковой панели ТОЛЬКО когда папка поднесена к левой панели (<= 115px)
  const nearSidebar = e.clientX > 0 && e.clientX <= 115
  if (nearSidebar) {
    if (!draggingPin.value) {
      draggingPin.value = activeDraggedNode ?? node
    }
  } else if (draggingPin.value) {
    endPinDrag()
  }
}

function onCardDragEnd(): void {
  cleanupPinDragState()
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
  if (isInternalCardDragging || draggingPin.value) return
  if (e.dataTransfer?.types.includes('Files')) {
    e.preventDefault()
    dragOver.value = true
  }
}

function onDragLeave(e: DragEvent): void {
  if (isInternalCardDragging || draggingPin.value) return
  if (!e.relatedTarget) dragOver.value = false
}

function onDrop(e: DragEvent): void {
  dragOver.value = false
  if (isInternalCardDragging || draggingPin.value) {
    cleanupPinDragState()
    return
  }
  e.preventDefault()
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

onMounted(() => {
  if (pendingFolder.value) handlePendingFolder()
  else load()
})

onBeforeUnmount(() => {
  cleanupPinDragState()
})
</script>

<!-- Глобальное подключение Nunito и применение ко всем заголовкам и утилитам Vuetify -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');

:root,
.v-application {
  --v-font-family: 'Nunito', sans-serif !important;
  font-family: 'Nunito', sans-serif !important;
}

.nunito-scope,
.nunito-scope *:not(.v-icon):not(.mdi),
.v-application .text-h1,
.v-application .text-h2,
.v-application .text-h3,
.v-application .text-h4,
.v-application .text-h5,
.v-application .text-h6,
.v-application .text-subtitle-1,
.v-application .text-subtitle-2,
.v-application .text-body-1,
.v-application .text-body-2,
.v-application .text-button,
.v-application .text-caption,
.v-application .text-overline,
.v-application .text-title-large,
.v-application .text-title-medium,
.v-application .text-title-small {
  font-family: 'Nunito', sans-serif !important;
}
</style>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   1. MATERIAL 3 HERO CARD — МЕДЛЕННАЯ СПОКОЙНАЯ АНИМАЦИЯ И КОНТРАСТНЫЕ ОТТЕНКИ
   Все 4 фигуры сохраняют постоянный размер (без «желе») и плавно вращаются/дрейфуют.
   Оттенки имеют чёткий разброс по яркости и насыщенности от акцентного цвета.
   ═══════════════════════════════════════════════════════════════════════════ */
.m3-hero-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background-color: var(--md-sys-color-surface-container);
  border: none !important;
  --hero-accent: var(--md-sys-color-primary, rgb(var(--v-theme-primary)));
}

.m3-hero-shapes-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.m3-shape {
  stroke: none;
  transition: fill 0.35s ease;
}

/* 4 заметно различающихся тональных оттенка от одного акцентного цвета */

/* 1. Глубокий тёмный фоновый тон (большой 8-лепестковый Cookie сверху) */
.m3-shape--tone-deep {
  fill: color-mix(
    in srgb,
    var(--hero-accent) 16%,
    var(--md-sys-color-surface-container)
  );
}

/* 2. Насыщенный средний тон (4-листный клевер снизу) */
.m3-shape--tone-mid {
  fill: color-mix(
    in srgb,
    var(--hero-accent) 38%,
    var(--md-sys-color-surface-container)
  );
}

/* 3. Яркий выразительный акцентный тон (12-волновая Sunny в центре) */
.m3-shape--tone-vivid {
  fill: color-mix(
    in srgb,
    var(--hero-accent) 68%,
    var(--md-sys-color-surface-container)
  );
}

/* 4. Светлый мягкий пастельный оттенок акцента (малый сквиркл справа) */
.m3-shape--tone-soft-light {
  fill: color-mix(
    in srgb,
    color-mix(in srgb, var(--hero-accent) 76%, #ffffff 24%) 52%,
    var(--md-sys-color-surface-container)
  );
}

/* Спокойное, медленное синхронное движение всех 4 фигур вокруг своих центров */
.m3-shape-group {
  will-change: transform;
}

.m3-shape-group--1 {
  transform-origin: 525px 86px;
  animation: m3-calm-orbit-1 42s linear infinite;
}

.m3-shape-group--2 {
  transform-origin: 490px 352px;
  animation: m3-calm-orbit-2 36s linear infinite;
}

.m3-shape-group--3 {
  transform-origin: 425px 206px;
  animation: m3-calm-orbit-3 28s ease-in-out infinite alternate;
}

.m3-shape-group--4 {
  transform-origin: 556px 224px;
  animation: m3-calm-orbit-4 32s ease-in-out infinite alternate;
}

@keyframes m3-calm-orbit-1 {
  0%   { transform: translate3d(0px, 0px, 0) rotate(0deg); }
  50%  { transform: translate3d(-14px, 10px, 0) rotate(180deg); }
  100% { transform: translate3d(0px, 0px, 0) rotate(360deg); }
}

@keyframes m3-calm-orbit-2 {
  0%   { transform: translate3d(0px, 0px, 0) rotate(0deg); }
  50%  { transform: translate3d(12px, -12px, 0) rotate(-180deg); }
  100% { transform: translate3d(0px, 0px, 0) rotate(-360deg); }
}

@keyframes m3-calm-orbit-3 {
  0%   { transform: translate3d(-10px, -8px, 0) rotate(-25deg); }
  50%  { transform: translate3d(8px, 12px, 0) rotate(20deg); }
  100% { transform: translate3d(-6px, 16px, 0) rotate(65deg); }
}

@keyframes m3-calm-orbit-4 {
  0%   { transform: translate3d(0px, -14px, 0) rotate(0deg); }
  50%  { transform: translate3d(-12px, 6px, 0) rotate(-45deg); }
  100% { transform: translate3d(4px, 14px, 0) rotate(-90deg); }
}

@media (prefers-reduced-motion: reduce) {
  .m3-shape-group {
    animation: none !important;
  }
}

.m3-hero-content {
  position: relative;
  z-index: 1;
}

.hero-subtitle {
  max-width: 480px;
}

/* Вторая кнопка в Hero-карточке: чистый M3 Tonal Surface без обводки */
.m3-btn-tonal-surface {
  background-color: color-mix(
    in srgb,
    var(--hero-accent) 14%,
    var(--md-sys-color-surface-container)
  ) !important;
  border: none !important;
}
.m3-btn-tonal-surface:hover {
  background-color: color-mix(
    in srgb,
    var(--hero-accent) 22%,
    var(--md-sys-color-surface-container)
  ) !important;
}

/* Баннер справа — полностью чистый, статичный, без текста и без клика */
.m3-hero-image-card--static {
  cursor: default !important;
  pointer-events: none;
  user-select: none;
  border: none !important;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. ВИДЖЕТЫ (ХРАНИЛИЩЕ И ИЗБРАННОЕ) — ПРОПОРЦИИ M3 БЕЗ РАМОК
   ═══════════════════════════════════════════════════════════════════════════ */
.m3-widget-card {
  padding: 20px 26px !important;
  min-height: 100px !important;
  border: none !important;
  background-color: var(--md-sys-color-surface-container);
  transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1);
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
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-on-surface) 8%,
    var(--md-sys-color-surface-container)
  ) !important;
}

.m3-widget-avatar {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.storage-dir {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.75;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. ПАПКИ И ФАЙЛЫ — ЧИСТОЕ СКРУГЛЕНИЕ И ОТСУТСТВИЕ ЧЁРНЫХ УГЛОВ ПРИ DRAG
   ═══════════════════════════════════════════════════════════════════════════ */
.m3-folder-card,
.m3-file-card {
  border: none !important;
  border-radius: 24px !important;
  overflow: hidden;
  transform: none !important;
  background-clip: padding-box;
  transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.m3-folder-card:hover,
.m3-file-card:hover {
  transform: none !important;
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-on-surface) 8%,
    var(--md-sys-color-surface-container)
  ) !important;
}

.m3-thumb-guard {
  user-select: none;
  -webkit-user-drag: none;
}
.m3-thumb-guard :deep(img) {
  -webkit-user-drag: none;
  pointer-events: none;
}

.m3-dialog {
  background: var(--md-sys-color-surface-container-high);
  border-radius: 28px;
  padding: 32px;
}
</style>