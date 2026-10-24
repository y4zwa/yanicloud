<template>
  <div
    class="pinned-section"
    :class="{ 'is-over': dragOver }"
    @dragover.prevent="dragOver = true"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="pinned-items">
      <div
        v-for="node in pins"
        :key="node.id"
        class="pinned-item"
        :title="node.name"
        @click="open(node)"
      >
        <img v-if="thumbUrls[node.id]" :src="thumbUrls[node.id]" class="pinned-thumb" alt="" draggable="false" />
        <v-icon v-else :icon="fileIcon(node)" :color="fileColor(node)" size="26"></v-icon>
        <v-icon v-if="node.isFavorite" icon="mdi-star" color="#FFD54F" size="12" class="pinned-fav"></v-icon>
        <button class="pinned-remove" title="Открепить" @click.stop="unpin(node.id)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { pins, loadPins, unpin, readPinDrag, pin, draggingPin, endPinDrag } from '@/store/pins'
import { useThumbs } from '@/composables/useThumbs'
import { fileIcon, fileColor } from '@/utils/format'
import { openPreview } from '@/store/preview'
import { playTrack } from '@/store/player'
import { isAudio } from '@/utils/preview'
import { requestOpenFolder } from '@/store/nav'
import type { NodeItem } from '@/api'

const emit = defineEmits<{ (e: 'goto-files'): void }>()

const { thumbUrls, loadThumbs } = useThumbs()
const dragOver = ref(false)

function onDragLeave(e: DragEvent): void {
  if (!e.relatedTarget) dragOver.value = false
}

async function onDrop(e: DragEvent): Promise<void> {
  dragOver.value = false
  endPinDrag()
  const id = readPinDrag(e)
  if (id) await pin(id)
}

function open(node: NodeItem): void {
  if (node.type === 'folder') {
    requestOpenFolder(node)
    emit('goto-files')
  } else if (isAudio(node.name, node.mimeType)) {
    playTrack(node, pins.value.filter((n) => n.type === 'file' && isAudio(n.name, n.mimeType)))
  } else {
    openPreview(node)
  }
}

watch(pins, (list) => loadThumbs(list), { immediate: true })

onMounted(loadPins)
</script>

<style scoped>
.pinned-section {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 28px;
  transition: background-color 0.2s;
}
.pinned-section.is-over {
  background-color: rgba(208, 188, 255, 0.08);
}
.pinned-items {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 0 8px;
  box-sizing: border-box;
}
.pinned-items::-webkit-scrollbar {
  display: none;
}
.pinned-item {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--md-sys-color-surface-container);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  overflow: hidden;
  transition: background-color 0.2s;
}
.pinned-item:hover {
  background: var(--md-sys-color-surface-container-high);
}
.pinned-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pinned-fav {
  position: absolute;
  top: 3px;
  right: 3px;
}
.pinned-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.pinned-item:hover .pinned-remove {
  display: flex;
}
</style>
