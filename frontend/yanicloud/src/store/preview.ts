import { computed, ref } from 'vue'
import type { NodeItem } from '@/api'
import { previewKind } from '@/utils/preview'

export const previewNode = ref<NodeItem | null>(null)
/** Список файлов, по которому можно листать стрелками (для фото — только изображения). */
export const previewList = ref<NodeItem[]>([])
export const previewIndex = ref(0)
/** Открыта ли панель «Подробности». */
export const previewShowDetails = ref(false)

export function openPreview(node: NodeItem, source?: NodeItem[]): void {
  previewNode.value = node

  const pool = (source && source.length ? source : [node]).filter((n) => n.type === 'file')
  const isImage = previewKind(node.name, node.mimeType) === 'image'
  let list = isImage ? pool.filter((n) => previewKind(n.name, n.mimeType) === 'image') : [node]
  if (!list.some((n) => n.id === node.id)) list = [node]

  previewList.value = list
  previewIndex.value = Math.max(
    0,
    list.findIndex((n) => n.id === node.id)
  )
  previewShowDetails.value = false
}

export function closePreview(): void {
  previewNode.value = null
  previewList.value = []
  previewIndex.value = 0
  previewShowDetails.value = false
}

export const canStepPreview = computed(() => previewList.value.length > 1)
export const hasPrevPreview = computed(() => previewIndex.value > 0)
export const hasNextPreview = computed(() => previewIndex.value < previewList.value.length - 1)

export function stepPreview(delta: number): void {
  if (!canStepPreview.value) return
  const next = previewIndex.value + delta
  if (next < 0 || next >= previewList.value.length) return
  previewIndex.value = next
  previewNode.value = previewList.value[next]
}
