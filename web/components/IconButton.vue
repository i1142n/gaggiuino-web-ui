<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  label: string
  text?: boolean
  tone?: 'primary' | 'green' | 'red' | 'grey'
  disabled?: boolean
  hint?: string
}>()
</script>

<template>
  <button class="icon-button" :class="tone ?? 'primary'" :aria-label="label" :title="hint ?? label" :disabled="disabled">
    <component :is="icon" :size="22" />
    <span v-if="text" class="label">{{ label }}</span>
  </button>
</template>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
}

.primary {
  color: var(--color-primary);
}

.green {
  color: var(--color-accent-green);
}

.red {
  color: var(--color-accent-red);
}

.grey,
.icon-button:disabled {
  color: var(--color-accent-grey);
}

.icon-button:disabled {
  cursor: not-allowed;
}

@media (max-width: 767px) {
  .label {
    display: none;
  }
}
</style>
