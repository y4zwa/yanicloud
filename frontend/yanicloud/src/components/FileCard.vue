<template>
  <div
    class="m3-card m3-file-card m3-reveal d-flex flex-column pa-5"
    v-ripple
    draggable="true"
    @click="emit('open')"
  >
    <div class="m3-thumb-guard" draggable="false">
      <FileThumb :node="node" :thumb="thumb" />
    </div>
    <div class="d-flex align-center justify-space-between mt-auto">
      <div class="overflow-hidden pr-3">
        <div class="text-title-medium font-weight-bold text-on-surface text-truncate mb-1">
          {{ node.name }}
        </div>
        <div class="text-body-2 text-on-surface-variant">{{ formatDate(node.updatedAt) }}</div>
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
          <template v-if="variant === 'full'">
            <v-list-item
              :prepend-icon="node.isFavorite ? 'mdi-star-off' : 'mdi-star-outline'"
              :title="node.isFavorite ? 'Убрать из избранного' : 'В избранное'"
              @click="emit('favorite')"
            ></v-list-item>
            <v-list-item prepend-icon="mdi-download" title="Скачать" @click="emit('download')"></v-list-item>
            <v-list-item
              prepend-icon="mdi-information-outline"
              title="Подробности"
              @click="emit('details')"
            ></v-list-item>
            <v-list-item prepend-icon="mdi-pencil-outline" title="Переименовать" @click="emit('rename')"></v-list-item>
            <v-list-item prepend-icon="mdi-delete-outline" title="Удалить" @click="emit('delete')"></v-list-item>
          </template>
          <template v-else>
            <v-list-item prepend-icon="mdi-download" title="Скачать" @click="emit('download')"></v-list-item>
            <v-list-item
              prepend-icon="mdi-information-outline"
              title="Подробности"
              @click="emit('details')"
            ></v-list-item>
            <v-list-item
              prepend-icon="mdi-eye-off-outline"
              title="Скрыть из недавних"
              @click="emit('hide-recent')"
            ></v-list-item>
          </template>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import FileThumb from '@/components/FileThumb.vue'
import { formatDate } from '@/utils/format'
import type { NodeItem } from '@/api'

/**
 * Карточка файла. Вариант `recent` отличается только пунктами меню:
 * у «недавних» нет переименования и удаления, зато есть «скрыть из недавних».
 */
withDefaults(
  defineProps<{
    node: NodeItem
    thumb?: string
    variant?: 'full' | 'recent'
  }>(),
  { thumb: undefined, variant: 'full' }
)

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'download'): void
  (e: 'details'): void
  (e: 'rename'): void
  (e: 'delete'): void
  (e: 'favorite'): void
  (e: 'hide-recent'): void
}>()
</script>
