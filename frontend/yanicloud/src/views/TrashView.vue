<template>
  <div class="m3-container">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h3 font-weight-medium mb-4 text-on-surface">Корзина</h1>
        <p class="text-title-medium text-on-surface-variant">
          Файлы и папки хранятся здесь 30 дней, а затем удаляются навсегда.
        </p>
      </div>
      <v-btn
        rounded="pill"
        size="x-large"
        color="error"
        variant="tonal"
        class="text-none font-weight-medium px-8"
        height="64"
        :disabled="!items.length"
        @click="confirmEmpty"
      >
        <v-icon start size="28" class="mr-2">mdi-delete-empty</v-icon> Очистить корзину
      </v-btn>
    </div>

    <v-divider class="mb-10 border-opacity-10" color="outline-variant"></v-divider>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>

    <div v-else-if="!items.length" class="m3-card pa-12 d-flex flex-column align-center justify-center">
      <v-icon icon="mdi-delete-outline" color="on-surface-variant" size="80" class="mb-4"></v-icon>
      <div class="text-h5 text-on-surface mb-2">Корзина пуста</div>
      <div class="text-title-medium text-on-surface-variant">Удалённые файлы появятся здесь</div>
    </div>

    <div v-else class="d-flex flex-wrap gap-6 pb-12">
      <div v-for="file in items" :key="file.id" class="m3-card m3-file-card d-flex flex-column pa-5" v-ripple>
        <div class="m3-file-preview d-flex align-center justify-center mb-5 rounded-lg" :style="{ backgroundColor: fileBg(file) }">
          <v-icon :icon="fileIcon(file)" :color="fileColor(file)" size="64"></v-icon>
        </div>
        <div class="d-flex align-center justify-space-between mt-auto">
          <div class="overflow-hidden pr-3">
            <div class="text-title-medium font-weight-medium text-on-surface text-truncate mb-1">{{ file.name }}</div>
            <div class="text-body-1 text-on-surface-variant">
              {{ file.type === 'folder' ? 'Папка' : formatBytes(file.size) }}
            </div>
          </div>
          <div class="d-flex align-center">
            <v-btn icon variant="tonal" color="primary" size="small" class="ml-1" @click="restore(file)">
              <v-icon>mdi-restore</v-icon>
              <v-tooltip activator="parent" location="top">Восстановить</v-tooltip>
            </v-btn>
            <v-btn icon variant="text" color="error" size="small" class="ml-1" @click="removePermanent(file)">
              <v-icon>mdi-delete-forever</v-icon>
              <v-tooltip activator="parent" location="top">Удалить навсегда</v-tooltip>
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <v-dialog v-model="confirmDialog" max-width="440">
      <div class="m3-dialog">
        <div class="text-h6 font-weight-medium text-on-surface mb-4">Очистить корзину?</div>
        <p class="text-title-medium text-on-surface-variant mb-6">
          Все файлы и папки будут удалены навсегда. Это действие нельзя отменить.
        </p>
        <div class="d-flex justify-end gap-4">
          <v-btn variant="text" class="text-none" @click="confirmDialog = false">Отмена</v-btn>
          <v-btn color="error" rounded="pill" class="text-none font-weight-medium" @click="doEmpty">Удалить всё</v-btn>
        </div>
      </div>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackColor" timeout="3000" rounded="pill">
      {{ snackText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listTrash, restoreNode, deleteNodePermanent, emptyTrash, ApiError, type NodeItem } from '@/api'
import { formatBytes, fileIcon, fileColor, fileBg } from '@/utils/format'

const items = ref<NodeItem[]>([])
const loading = ref(true)
const confirmDialog = ref(false)
const snackbar = ref(false)
const snackText = ref('')
const snackColor = ref('primary')

function notify(text: string, color = 'primary'): void {
  snackText.value = text
  snackColor.value = color
  snackbar.value = true
}

async function load(): Promise<void> {
  loading.value = true
  try {
    items.value = await listTrash()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка соединения', 'error')
  } finally {
    loading.value = false
  }
}

async function restore(file: NodeItem): Promise<void> {
  try {
    await restoreNode(file.id)
    notify(`«${file.name}» восстановлено`)
    await load()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка', 'error')
  }
}

async function removePermanent(file: NodeItem): Promise<void> {
  try {
    await deleteNodePermanent(file.id)
    await load()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка', 'error')
  }
}

function confirmEmpty(): void {
  confirmDialog.value = true
}

async function doEmpty(): Promise<void> {
  try {
    await emptyTrash()
    confirmDialog.value = false
    await load()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка', 'error')
  }
}

onMounted(load)
</script>

<style scoped>
.m3-dialog {
  background: var(--md-sys-color-surface-container-high);
  border-radius: 28px;
  padding: 32px;
  border: 1px solid var(--md-sys-color-outline-variant);
}
</style>
