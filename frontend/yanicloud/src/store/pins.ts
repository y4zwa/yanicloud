import { ref } from 'vue'
import { listPins, pinNode, unpinNode, type NodeItem } from '@/api'

export const PIN_DRAG_TYPE = 'application/x-yanicloud-node'

export const pins = ref<NodeItem[]>([])
export const draggingPin = ref(false)

export async function loadPins(): Promise<void> {
  try {
    pins.value = await listPins()
  } catch {
    /* ignore */
  }
}

export async function pin(id: string): Promise<void> {
  await pinNode(id)
  await loadPins()
}

export async function unpin(id: string): Promise<void> {
  await unpinNode(id)
  pins.value = pins.value.filter((p) => p.id !== id)
}

export function startPinDrag(e: DragEvent, node: NodeItem): void {
  if (!e.dataTransfer) return
  e.dataTransfer.clearData()
  e.dataTransfer.setData(PIN_DRAG_TYPE, node.id)
  e.dataTransfer.effectAllowed = 'copy'
  draggingPin.value = true
}

export function endPinDrag(): void {
  draggingPin.value = false
}

export function readPinDrag(e: DragEvent): string | null {
  return e.dataTransfer?.getData(PIN_DRAG_TYPE) || null
}
