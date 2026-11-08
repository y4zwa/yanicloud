<template>
  <div v-if="detailsNode" class="details-dialog-overlay" @click.self="closeDetails">
    <FileDetailsPanel :node="detailsNode" variant="dialog" @close="closeDetails" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import FileDetailsPanel from '@/components/FileDetailsPanel.vue'
import { detailsNode, closeDetails } from '@/store/details'

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && detailsNode.value) {
    closeDetails()
    e.preventDefault()
    e.stopPropagation()
  }
}

onMounted(() => window.addEventListener('keydown', onKey, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))
</script>

<style scoped>
.details-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 25000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(0, 0, 0, 0.55);
}
</style>
