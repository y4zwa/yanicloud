<template>
  <div class="cover-scrim" @click.self="$emit('close')">
    <div class="cover-dialog" role="dialog" aria-modal="true" aria-label="Обложка трека">
      <header class="cover-head">
        <div class="cover-titles">
          <div class="cover-eyebrow">Обложка</div>
          <div class="cover-track text-title-medium">{{ title }}</div>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" color="on-surface-variant" title="Закрыть" @click="$emit('close')"></v-btn>
      </header>

      <div class="cover-body">
        <ZoomableImage :src="src" />
      </div>

      <div class="cover-hint">Колесо или щипок — масштаб · двойной клик — сброс</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import ZoomableImage from '@/components/ZoomableImage.vue'

defineProps<{ src: string; title: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    emit('close')
    e.preventDefault()
    e.stopPropagation()
  }
}

onMounted(() => window.addEventListener('keydown', onKey, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))
</script>

<style scoped>
.cover-scrim {
  position: fixed;
  inset: 0;
  z-index: 26000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(0, 0, 0, 0.32);
}
.cover-dialog {
  width: min(720px, calc(100vw - 48px));
  height: min(78vh, 760px);
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-high);
  box-shadow: var(--md-sys-elevation-3);
  animation: m3-pop-in 0.3s var(--m3-ease-spring) both;
}
.cover-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 16px 14px 24px;
  flex-shrink: 0;
}
.cover-titles {
  min-width: 0;
}
.cover-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--md-sys-color-primary);
}
.cover-track {
  margin-top: 2px;
  color: var(--md-sys-color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cover-body {
  flex: 1;
  min-height: 160px;
  margin: 0 16px;
  border-radius: 20px;
  overflow: hidden;
  background: var(--md-sys-color-surface-container-lowest);
}
.cover-hint {
  flex-shrink: 0;
  padding: 10px 24px 16px;
  text-align: center;
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);
}
@media (max-width: 700px), (max-height: 700px) {
  .cover-scrim {
    padding: 16px;
  }
  .cover-dialog {
    width: calc(100vw - 32px);
    height: calc(100vh - 32px);
    max-height: none;
  }
}
</style>
