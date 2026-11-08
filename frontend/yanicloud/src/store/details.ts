import { ref } from 'vue'
import type { NodeItem } from '@/api'

/** Файл, для которого открыт диалог «Подробности» (без запуска предпросмотра). */
export const detailsNode = ref<NodeItem | null>(null)

export function openDetails(node: NodeItem): void {
  detailsNode.value = node
}

export function closeDetails(): void {
  detailsNode.value = null
}
