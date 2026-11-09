<template>
  <div
    class="banner-tile"
    :style="url ? { '--banner-url': `url(${url})` } : {}"
    aria-hidden="true"
  >
    <template v-if="url">
      <div v-if="fit === 'contain'" class="banner-tile__blur"></div>
      <img
        class="banner-tile__image"
        :src="url"
        alt=""
        :style="{ objectFit: fit, objectPosition: position }"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { BannerFit, BannerPosition } from '@/utils/banner'

defineProps<{
  url: string | null
  fit: BannerFit
  position: BannerPosition
}>()
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
</style>
