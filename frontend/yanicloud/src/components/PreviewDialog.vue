<template>
  <Transition name="m3-overlay" appear>
    <div v-if="node" class="preview-overlay" :class="{ 'image-mode': kind === 'image' }">
      <div class="preview-scrim" @click="close"></div>

      <!-- ФОТО: полноэкранный просмотр с зумом и панорамой -->
      <ImageViewer v-if="kind === 'image'" :node="node" :url="url" :loading="loading" />

      <!-- ОСТАЛЬНЫЕ ТИПЫ: панель предпросмотра -->
      <div v-else class="preview-panel">
        <header class="preview-header d-flex align-center">
          <div class="m3-icon-avatar surface-variant mr-4" style="width: 48px; height: 48px; border-radius: 14px">
            <v-icon :icon="fileIcon(node)" :color="fileColor(node)" size="28"></v-icon>
          </div>
          <div class="overflow-hidden">
            <div class="text-title-medium font-weight-medium text-on-surface text-truncate">{{ node.name }}</div>
            <div class="text-body-2 text-on-surface-variant">{{ formatBytes(node.size) }}</div>
          </div>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-information-outline"
            variant="text"
            :color="showDetails ? 'primary' : 'on-surface-variant'"
            title="Подробности"
            @click="showDetails = !showDetails"
          ></v-btn>
          <v-btn icon="mdi-download" variant="text" color="on-surface-variant" @click="download"></v-btn>
          <v-btn icon="mdi-close" variant="text" color="on-surface-variant" @click="close"></v-btn>
        </header>

        <div class="preview-body">
          <div v-if="loading || iframeLoading" class="preview-loading d-flex flex-column align-center justify-center">
            <v-progress-circular indeterminate color="primary" size="56"></v-progress-circular>
            <div class="text-title-medium text-on-surface-variant mt-4">
              {{ kind === 'office' ? 'Подготовка предпросмотра…' : 'Загрузка…' }}
            </div>
          </div>

          <template v-else>
            <div v-if="error" class="preview-loading d-flex flex-column align-center justify-center">
              <v-icon icon="mdi-alert-circle-outline" color="error" size="56" class="mb-4"></v-icon>
              <div class="text-title-medium text-on-surface-variant mb-4">{{ error }}</div>
              <v-btn color="primary-container" rounded="pill" class="text-none" @click="download">
                <span class="text-on-primary-container">Скачать</span>
              </v-btn>
            </div>

            <video v-else-if="kind === 'video'" :src="url" class="preview-media" controls autoplay></video>

            <audio v-else-if="kind === 'audio'" :src="url" class="preview-audio" controls></audio>

            <iframe
              v-else-if="kind === 'pdf' || kind === 'office'"
              :src="url"
              class="preview-iframe"
              @load="iframeLoading = false"
            ></iframe>

            <pre v-else-if="kind === 'text'" class="preview-text">{{ textContent }}</pre>

            <div v-else class="preview-loading d-flex flex-column align-center justify-center">
              <v-icon icon="mdi-file-outline" color="on-surface-variant" size="72" class="mb-4"></v-icon>
              <div class="text-h6 text-on-surface mb-2">Предпросмотр недоступен</div>
              <div class="text-title-medium text-on-surface-variant mb-6">Этот тип файла нельзя отобразить</div>
              <v-btn color="primary-container" rounded="pill" class="text-none" @click="download">
                <span class="text-on-primary-container">Скачать файл</span>
              </v-btn>
            </div>
          </template>
        </div>
      </div>

      <FileDetailsPanel v-if="showDetails" :node="node" @close="showDetails = false" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { previewNode, previewShowDetails, closePreview } from '@/store/preview'
import { getStreamUrl, fetchTextPreview, downloadFile, ApiError } from '@/api'
import { previewKind, type PreviewKind } from '@/utils/preview'
import { fileIcon, fileColor, formatBytes } from '@/utils/format'
import ImageViewer from '@/components/ImageViewer.vue'
import FileDetailsPanel from '@/components/FileDetailsPanel.vue'

const node = previewNode
const showDetails = previewShowDetails
const url = ref('')
const kind = ref<PreviewKind>('other')
const loading = ref(false)
const iframeLoading = ref(true)
const textContent = ref('')
const error = ref('')

watch(
  previewNode,
  async (n) => {
    if (!n) return
    kind.value = previewKind(n.name, n.mimeType)
    url.value = ''
    textContent.value = ''
    error.value = ''
    loading.value = true
    iframeLoading.value = kind.value === 'pdf' || kind.value === 'office'
    try {
      url.value = await getStreamUrl(n.id)
      if (kind.value === 'text') {
        textContent.value = await fetchTextPreview(url.value)
      }
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Не удалось открыть файл'
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)

function close(): void {
  closePreview()
}

function download(): void {
  if (node.value) downloadFile(node.value).catch(() => undefined)
}

function onKey(e: KeyboardEvent): void {
  if (e.key !== 'Escape' || kind.value === 'image') return
  if (showDetails.value) {
    showDetails.value = false
    return
  }
  close()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  animation: preview-fade-in 0.18s ease;
}
@keyframes preview-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.preview-overlay.image-mode {
  padding: 0;
}
.preview-scrim {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.72);
}
.preview-panel {
  position: relative;
  width: 100%;
  max-width: 1080px;
  height: 100%;
  max-height: 860px;
  background: var(--md-sys-color-surface-container-high);
  border-radius: 32px;
  border: 1px solid var(--md-sys-color-outline-variant);
  box-shadow: var(--md-sys-elevation-3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: m3-pop-in 0.32s var(--m3-ease-spring) both;
}
.preview-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  flex-shrink: 0;
}
.preview-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  background: var(--md-sys-color-surface-container-lowest);
}
.preview-media {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}
.preview-audio {
  width: min(520px, 80%);
}
.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
.preview-text {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 32px;
  overflow: auto;
  color: var(--md-sys-color-on-surface);
  font-family: 'Cascadia Code', 'JetBrains Mono', Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  box-sizing: border-box;
}
.preview-loading {
  width: 100%;
  height: 100%;
}
</style>
