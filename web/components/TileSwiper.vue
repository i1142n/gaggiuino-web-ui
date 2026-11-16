<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const index = defineModel<number>({ default: 0 })

const track = ref<HTMLElement>()
const canGoLeft = ref(false)
const canGoRight = ref(false)
let settleTimer: number | undefined

const visibleIndex = () => Math.round(track.value!.scrollLeft / track.value!.clientWidth)

function updateHints() {
  const element = track.value!
  canGoLeft.value = element.scrollLeft > 1
  canGoRight.value = element.scrollLeft + element.clientWidth < element.scrollWidth - 1
}

function onScroll() {
  updateHints()
  clearTimeout(settleTimer)
  settleTimer = window.setTimeout(() => (index.value = visibleIndex()), 150)
}

watch(
  index,
  (value) => {
    if (value !== visibleIndex()) track.value!.scrollTo({ left: value * track.value!.clientWidth, behavior: 'smooth' })
  },
  { flush: 'post' },
)

const observer = new ResizeObserver(updateHints)

onMounted(() => {
  track.value!.scrollLeft = index.value * track.value!.clientWidth
  observer.observe(track.value!)
  updateHints()
})

onUnmounted(() => {
  observer.disconnect()
  clearTimeout(settleTimer)
})
</script>

<template>
  <div class="tile-swiper">
    <div ref="track" class="track" @scroll="onScroll">
      <slot />
    </div>
    <button v-if="canGoLeft" class="hint left" aria-label="Vorherige Kachel" @click="index = visibleIndex() - 1">
      <ChevronLeft :size="20" />
    </button>
    <button v-if="canGoRight" class="hint right" aria-label="Nächste Kachel" @click="index = visibleIndex() + 1">
      <ChevronRight :size="20" />
    </button>
  </div>
</template>

<style scoped>
.tile-swiper {
  position: relative;
  height: 100%;
}

.track {
  display: flex;
  height: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.hint {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  padding: 0.75rem 0.25rem;
  border: none;
  background: none;
  color: var(--color-primary);
  opacity: 0.45;
  cursor: pointer;
}

.left {
  left: 0;
}

.right {
  right: 0;
}
</style>
