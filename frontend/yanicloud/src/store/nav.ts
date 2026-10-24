import { ref } from 'vue'
import type { NodeItem } from '@/api'

export const pendingFolder = ref<NodeItem | null>(null)

export function requestOpenFolder(node: NodeItem): void {
  pendingFolder.value = node
}
