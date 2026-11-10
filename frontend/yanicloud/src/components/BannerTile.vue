<template>
  <div
    ref="tileEl"
    class="banner-tile"
    :style="url ? { '--banner-url': `url(${url})` } : {}"
    aria-hidden="true"
  >
    <template v-if="url">
      <div v-if="fit === 'contain'" class="banner-tile__blur"></div>
      <img
        class="banner-tile__image"
        :class="{ 'banner-tile__image--crop': !!cropStyle }"
        :src="url"
        alt=""
        :style="cropStyle ?? { objectFit: fit, objectPosition: position }"
        @load="onImageLoad"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { BannerFit, BannerPosition } from '@/utils/banner'
import { bannerCropRect, clampBannerZoom, parseBannerCrop } from '@/utils/banner'

const props = withDefaults(
  defineProps<{
    url: string | null
    fit: BannerFit
    position: BannerPosition
    /** Свободный кадр (проценты картинки). Если задан — показываем ровно его. */
    crop?: string | null
    zoom?: number
  }>(),
  { crop: null, zoom: 1 }
)

const tileEl = ref<HTMLDivElement | null>(null)
const box = ref({ w: 0, h: 0 })
const natural = ref<{ w: number; h: number } | null>(null)

let observer: ResizeObserver | null = null

const parsedCrop = computed(() => parseBannerCrop(props.crop))

const cropStyle = computed(() => {
  if (props.fit !== 'cover') return null

  const crop = parsedCrop.value
  const size = natural.value
  const area = box.value
  if (!size || !area.w || !area.h) return null

  if (crop) {
    // свободный кадр: заполняем плитку без искажений, лишнее по краям обрезаем
    const cropW = crop.w * size.w
    const cropH = crop.h * size.h
    const centerX = crop.x * size.w + cropW / 2
    const centerY = crop.y * size.h + cropH / 2
    const scale = Math.max(area.w / cropW, area.h / cropH)
    return {
      left: `${((area.w / 2 - centerX * scale) / area.w) * 100}%`,
      top: `${((area.h / 2 - centerY * scale) / area.h) * 100}%`,
      width: `${((size.w * scale) / area.w) * 100}%`,
      height: `${((size.h * scale) / area.h) * 100}%`,
    }
  }

  // старые баннеры: приближение поверх object-fit: cover
  const zoom = clampBannerZoom(props.zoom)
  if (zoom === 1) return null

  const rect = bannerCropRect(size.w, size.h, area.w / area.h, props.position, zoom)
  return {
    left: `${(-rect.x / rect.w) * 100}%`,
    top: `${(-rect.y / rect.h) * 100}%`,
    width: `${(size.w / rect.w) * 100}%`,
    height: `${(size.h / rect.h) * 100}%`,
  }
})

function onImageLoad(event: Event): void {
  const img = event.target as HTMLImageElement
  if (img.naturalWidth && img.naturalHeight) {
    natural.value = { w: img.naturalWidth, h: img.naturalHeight }
  }
}

watch(
  () => props.url,
  () => {
    natural.value = null
  }
)

onMounted(() => {
  const el = tileEl.value
  if (!el) return
  const measure = () => {
    box.value = { w: el.clientWidth, h: el.clientHeight }
  }
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(el)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<style scoped>
.banner-tile {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #4f378b 0%, #381e72 45%, #633b48 100%);
  isolation: isolate;
}
.banner-tile__blur {
  position: absolute;
  inset: -24px;
  z-index: 0;
  background-image: var(--banner-url);
  background-size: cover;
  background-position: center;
  filter: blur(26px) brightness(0.62) saturate(1.05);
  transform: scale(1.08);
  pointer-events: none;
}
.banner-tile__image {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.banner-tile__image--crop {
  right: auto;
  bottom: auto;
  max-width: none;
  max-height: none;
  object-fit: fill;
}
</style>
