import { ref, computed } from 'vue'
import type { NodeItem } from '@/api'

export const queue = ref<NodeItem[]>([])
export const currentIndex = ref(-1)

export const isOpen = computed(() => currentIndex.value >= 0 && queue.value.length > 0)

export const currentTrack = computed<NodeItem | null>(() => {
  if (currentIndex.value < 0 || currentIndex.value >= queue.value.length) return null
  return queue.value[currentIndex.value]
})

export function playTrack(track: NodeItem, tracks: NodeItem[]): void {
  const list = tracks.length ? tracks : [track]
  const idx = list.findIndex((t) => t.id === track.id)
  queue.value = list
  currentIndex.value = idx >= 0 ? idx : 0
}

export function next(): void {
  if (!queue.value.length) return
  currentIndex.value = (currentIndex.value + 1) % queue.value.length
}

export function prev(): void {
  if (!queue.value.length) return
  currentIndex.value = (currentIndex.value - 1 + queue.value.length) % queue.value.length
}

export function closePlayer(): void {
  currentIndex.value = -1
}
