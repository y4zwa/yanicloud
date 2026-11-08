import { ref } from 'vue'
import type { NodeItem } from '@/api'

export const pendingFolder = ref<NodeItem | null>(null)

export function requestOpenFolder(node: NodeItem): void {
  pendingFolder.value = node
}

/** Счётчик запросов «на главную»: файловый менеджер слушает его и сбрасывает вложенность. */
export const homeRequest = ref(0)

export function requestGoHome(): void {
  pendingFolder.value = null
  homeRequest.value++
}
