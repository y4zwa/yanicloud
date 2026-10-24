import { ref } from 'vue'
import type { NodeItem } from '@/api'
import { getThumbUrls } from '@/api'
import { hasThumbnail } from '@/utils/preview'

export function useThumbs() {
  const thumbUrls = ref<Record<string, string>>({})

  async function loadThumbs(nodes: NodeItem[]): Promise<void> {
    const ids = nodes.filter((n) => n.type === 'file' && hasThumbnail(n.name, n.mimeType)).map((n) => n.id)
    if (!ids.length) return
    try {
      const urls = await getThumbUrls(ids)
      thumbUrls.value = { ...thumbUrls.value, ...urls }
    } catch {
      /* ignore */
    }
  }

  return { thumbUrls, loadThumbs }
}
