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
    <div v-if="isRoot" class="m3-hero-section mb-12">
      <div class="m3-card m3-hero-text-card pa-10 d-flex flex-column justify-center" v-ripple>
        <h1 class="text-h3 font-weight-medium mb-4 text-on-surface" style="line-height: 1.2;">
          Ваши файлы <br /><span class="text-primary">всегда с вами</span>
        </h1>
        <p class="text-title-medium text-on-surface-variant mb-10" style="line-height: 1.6;">
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
            <v-icon start size="28">mdi-cloud-upload</v-icon>
            <span class="text-title-medium font-weight-medium text-on-primary-container text-none">Загрузить</span>
          </v-btn>
          <v-btn
            rounded="pill"
            size="x-large"
            variant="outlined"
            color="outline"
            class="m3-btn-outlined px-6 flex-grow-1"
            height="64"
            @click="createDialog = true"
          >
            <span class="text-title-medium font-weight-medium text-primary text-none">Создать папку</span>
            <v-icon end size="28" color="primary">mdi-folder-plus</v-icon>
          </v-btn>
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

    <!-- ВИДЖЕТЫ (только корень) -->
    <div v-if="isRoot" class="m3-widgets-row d-flex gap-6 mb-12">
      <div class="m3-card m3-widget-card d-flex align-center px-8 py-6 flex-grow-1" v-ripple>
        <div class="m3-progress-wrapper mr-8">
          <v-progress-circular
            :model-value="storagePercent"
            color="primary"
            size="80"
            width="8"
            class="font-weight-medium text-title-medium"
          >
            {{ storagePercentLabel }}
          </v-progress-circular>
        </div>
        <div>
          <div class="text-title-medium text-on-surface-variant mb-2">Занято хранилища</div>
          <div class="text-h5 font-weight-medium text-on-surface">
            {{ storageLabel }}
          </div>
        </div>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-chevron-right" variant="text" color="on-surface-variant" size="large"></v-btn>
      </div>
      <div class="m3-card m3-widget-card d-flex align-center px-8 py-6 flex-grow-1" v-ripple @click="$emit('goto-favorites')">
        <div class="m3-icon-avatar primary-container mr-8">
          <v-icon icon="mdi-star" color="on-primary-container" size="40"></v-icon>
        </div>
        <div>
          <div class="text-h5 font-weight-medium text-on-surface mb-2">Избранное</div>
          <div class="text-title-medium text-on-surface-variant">{{ favoritesCount }} элементов</div>
        </div>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-chevron-right" variant="text" color="on-surface-variant" size="large"></v-btn>
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
import { ref, computed, watch, onMounted } from 'vue'
import { pendingFolder } from '@/store/nav'
import { openPreview } from '@/store/preview'
import { playTrack } from '@/store/player'
import { startPinDrag, endPinDrag, draggingPin } from '@/store/pins'
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
const storage = ref<StorageInfo>({ used: 0, quota: 0, percent: 0, diskTotal: 0, diskFree: 0 })
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

const storagePercent = computed(() => {
  if (storage.value.quota > 0) return Math.min(100, (storage.value.used / storage.value.quota) * 100)
  if (storage.value.diskTotal > 0) return Math.min(100, (storage.value.used / storage.value.diskTotal) * 100)
  return 0
})

const storagePercentLabel = computed(() => {
  const p = storagePercent.value
  if (p > 0 && p < 1) return `${p.toFixed(1)}%`
  return `${Math.round(p)}%`
})

const storageLabel = computed(() => {
  if (storage.value.quota > 0) return `${formatBytes(storage.value.used)} из ${formatBytes(storage.value.quota)}`
  return `${formatBytes(storage.value.used)} из ${formatBytes(storage.value.diskTotal)} (диск)`
})

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

onMounted(() => {
  if (pendingFolder.value) handlePendingFolder()
  else load()
})
</script>

<style scoped>
.m3-dialog {
  background: var(--md-sys-color-surface-container-high);
  border-radius: 28px;
  padding: 32px;
  border: 1px solid var(--md-sys-color-outline-variant);
}
</style>
