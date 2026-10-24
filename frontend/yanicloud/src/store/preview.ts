import { ref } from 'vue'
import type { NodeItem } from '@/api'

export const previewNode = ref<NodeItem | null>(null)

export function openPreview(node: NodeItem): void {
  previewNode.value = node
}

export function closePreview(): void {
  previewNode.value = null
}
