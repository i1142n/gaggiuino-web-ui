<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const props = defineProps<{ start?: number }>()

const track = ref<HTMLElement>()
const canGoLeft = ref(false)
const canGoRight = ref(false)

function update() {
  const element = track.value!
  canGoLeft.value = element.scrollLeft > 1
  canGoRight.value = element.scrollLeft + element.clientWidth < element.scrollWidth - 1
}

function step(direction: number) {
  track.value!.scrollBy({ left: direction * track.value!.clientWidth, behavior: 'smooth' })
}

const observer = new ResizeObserver(update)

onMounted(() => {
  track.value!.scrollLeft = (props.start ?? 0) * track.value!.clientWidth
  observer.observe(track.value!)
  update()
})

onUnmounted(() => observer.disconnect())
</script>

<template>
  <div class="tile-swiper">
    <div ref="track" class="track" @scroll="update">
      <slot />
    </div>
    <button v-if="canGoLeft" class="hint left" aria-label="Vorherige Kachel" @click="step(-1)">
      <ChevronLeft :size="20" />
    </button>
    <button v-if="canGoRight" class="hint right" aria-label="Nächste Kachel" @click="step(1)">
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
