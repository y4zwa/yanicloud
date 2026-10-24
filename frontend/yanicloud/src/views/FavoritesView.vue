<template>
  <div class="m3-container">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h3 font-weight-medium mb-4 text-on-surface">Избранное</h1>
        <p class="text-title-medium text-on-surface-variant">
          Файлы и папки, отмеченные звёздочкой.
        </p>
      </div>
    </div>

    <v-divider class="mb-10 border-opacity-10" color="outline-variant"></v-divider>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>

    <div v-else-if="!items.length" class="m3-card pa-12 d-flex flex-column align-center justify-center">
      <v-icon icon="mdi-star-outline" color="on-surface-variant" size="80" class="mb-4"></v-icon>
      <div class="text-h5 text-on-surface mb-2">Пока нет избранного</div>
      <div class="text-title-medium text-on-surface-variant">Отмечайте файлы звёздочкой, чтобы найти их здесь</div>
    </div>

    <div v-else class="d-flex flex-wrap gap-6 pb-12">
      <div
        v-for="item in items"
        :key="item.id"
        class="m3-card m3-file-card d-flex flex-column pa-5"
        v-ripple
        draggable="true"
        @dragstart="startPinDrag($event, item)"
        @dragend="endPinDrag"
        @click="open(item)"
      >
        <FileThumb :node="item" :thumb="thumbUrls[item.id]" />
        <div class="d-flex align-center justify-space-between mt-auto">
          <div class="overflow-hidden pr-3">
            <div class="text-title-medium font-weight-medium text-on-surface text-truncate mb-1">{{ item.name }}</div>
            <div class="text-body-1 text-on-surface-variant">
              {{ item.type === 'folder' ? `${item.items ?? 0} элементов` : formatBytes(item.size) }}
            </div>
          </div>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" color="on-surface-variant" @click.stop></v-btn>
            </template>
            <v-list density="comfortable">
              <v-list-item
                prepend-icon="mdi-star-off"
                title="Убрать из избранного"
                @click="unfavorite(item)"
              ></v-list-item>
              <v-list-item v-if="item.type === 'file'" prepend-icon="mdi-download" title="Скачать" @click="download(item)"></v-list-item>
              <v-list-item v-else prepend-icon="mdi-folder-open-outline" title="Открыть" @click="open(item)"></v-list-item>
              <v-list-item prepend-icon="mdi-delete-outline" title="Удалить" @click="remove(item)"></v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>

    <v-snackbar v-model="snackbar" :color="snackColor" timeout="3000" rounded="pill">
      {{ snackText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listFavorites, downloadFile, setFavorite, trashNode, ApiError, type NodeItem } from '@/api'
import { formatBytes, fileIcon, fileColor, fileBg } from '@/utils/format'
import { requestOpenFolder } from '@/store/nav'
import { openPreview } from '@/store/preview'
import { playTrack } from '@/store/player'
import { startPinDrag, endPinDrag } from '@/store/pins'
import FileThumb from '@/components/FileThumb.vue'
import { useThumbs } from '@/composables/useThumbs'
import { isAudio } from '@/utils/preview'

const emit = defineEmits<{ (e: 'goto-files'): void }>()

const items = ref<NodeItem[]>([])
const loading = ref(true)
const snackbar = ref(false)
const snackText = ref('')
const snackColor = ref('primary')

const { thumbUrls, loadThumbs } = useThumbs()

function notify(text: string, color = 'primary'): void {
  snackText.value = text
  snackColor.value = color
  snackbar.value = true
}

async function load(): Promise<void> {
  loading.value = true
  try {
    items.value = await listFavorites()
    loadThumbs(items.value)
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка соединения', 'error')
  } finally {
    loading.value = false
  }
}

function open(item: NodeItem): void {
  if (item.type === 'folder') {
    requestOpenFolder(item)
    emit('goto-files')
  } else if (isAudio(item.name, item.mimeType)) {
    playTrack(item, items.value.filter((n) => n.type === 'file' && isAudio(n.name, n.mimeType)))
  } else {
    openPreview(item)
  }
}

function download(item: NodeItem): void {
  downloadFile(item).catch((e) => notify(e instanceof ApiError ? e.message : 'Ошибка', 'error'))
}

async function unfavorite(item: NodeItem): Promise<void> {
  try {
    await setFavorite(item.id, false)
    await load()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка', 'error')
  }
}

async function remove(item: NodeItem): Promise<void> {
  try {
    await trashNode(item.id)
    notify(`«${item.name}» перемещено в корзину`)
    await load()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка', 'error')
  }
}

onMounted(load)
</script>
