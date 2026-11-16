<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ name: string }>()

const box = ref<HTMLElement>()
const text = ref<HTMLElement>()
const overflow = ref(0)

function measure() {
  overflow.value = Math.max(0, text.value!.offsetWidth - box.value!.clientWidth)
}

const observer = new ResizeObserver(measure)

onMounted(() => {
  observer.observe(box.value!)
  measure()
})

onUnmounted(() => observer.disconnect())

watch(
  () => props.name,
  () => nextTick(measure),
)
</script>

<template>
  <div ref="box" class="profile-name" :class="{ overflowing: overflow > 0 }" :style="{ '--run-distance': `-${overflow + 32}px` }">
    <span ref="text">{{ name }}</span>
  </div>
</template>

<style scoped>
.profile-name {
  overflow: hidden;
  white-space: nowrap;
  text-align: center;
  color: var(--color-primary-light);
  font-size: var(--font-size-base);
}

.profile-name span {
  display: inline-block;
}

@property --left-fade {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

.overflowing {
  text-align: left;
  mask-image: linear-gradient(to right, transparent, black var(--left-fade), black calc(100% - 2rem), transparent);
  animation: left-fade 10s ease-in-out infinite;
}

.overflowing span {
  animation: run-through 10s ease-in-out infinite;
}

@keyframes left-fade {
  0%,
  20% {
    --left-fade: 0px;
  }
  30%,
  90% {
    --left-fade: 2rem;
  }
  100% {
    --left-fade: 0px;
  }
}

@keyframes run-through {
  0%,
  20% {
    transform: translateX(0);
  }
  70%,
  85% {
    transform: translateX(var(--run-distance));
  }
  100% {
    transform: translateX(0);
  }
}
</style>
