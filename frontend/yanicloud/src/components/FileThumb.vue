<template>
  <div
    class="m3-file-preview file-thumb-box d-flex align-center justify-center mb-5 rounded-lg"
    :style="{ backgroundColor: fileBg(node) }"
  >
    <img v-if="thumb && !error" :src="thumb" class="file-thumb" draggable="false" @error="error = true" />
    <v-icon v-else :icon="fileIcon(node)" :color="fileColor(node)" size="64"></v-icon>
    <div v-if="node.isFavorite" class="fav-badge">
      <v-icon icon="mdi-star" color="#FFD54F" size="18"></v-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { NodeItem } from '@/api'
import { fileIcon, fileColor, fileBg } from '@/utils/format'

const props = defineProps<{ node: NodeItem; thumb?: string }>()
const error = ref(false)

watch(
  () => props.thumb,
  () => {
    error.value = false
  }
)
</script>

<style scoped>
.file-thumb-box {
  position: relative;
}
.file-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  display: block;
}
.fav-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
