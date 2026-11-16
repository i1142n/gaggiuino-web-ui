<script setup lang="ts">
import { computed } from 'vue'
import { idealCurve } from '../curve.ts'
import type { ProfileWithDescription } from '../api.ts'
import ProfileChart from './ProfileChart.vue'

const props = defineProps<{ profile: ProfileWithDescription; active: boolean }>()

const curve = computed(() => idealCurve(props.profile))
const phaseCount = computed(() => props.profile.phases.filter((phase) => !phase.skip).length)

const recipe = computed(() => {
  const { coffeeIn, coffeeOut, ratio } = props.profile.recipe ?? {}
  const amounts = [coffeeIn, coffeeOut].filter(Boolean).map((grams) => `${grams} g`).join(' → ')
  return [amounts, ratio ? `1:${ratio}` : ''].filter(Boolean).join(' · ')
})
</script>

<template>
  <div class="profile-tile" :class="{ active }" role="button" tabindex="0">
    <h2>{{ profile.name }}</h2>
    <dl class="key-values">
      <div v-if="profile.waterTemperature">
        <dt>Wasser</dt>
        <dd>{{ profile.waterTemperature }} °C</dd>
      </div>
      <div v-if="recipe">
        <dt>Rezept</dt>
        <dd>{{ recipe }}</dd>
      </div>
      <div>
        <dt>Phasen</dt>
        <dd>{{ phaseCount }}</dd>
      </div>
      <div>
        <dt>Dauer</dt>
        <dd>{{ curve.estimated ? '≈ ' : '' }}{{ Math.round(curve.totalTime) }} s</dd>
      </div>
    </dl>
    <ProfileChart :curve="curve" />
    <p v-if="profile.description" class="description">{{ profile.description }}</p>
  </div>
</template>

<style scoped>
.profile-tile {
  box-sizing: border-box;
  height: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid transparent;
  border-radius: 0.75rem;
  cursor: pointer;
}

.active {
  border-color: var(--color-accent-green);
}

.key-values {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin: 0 0 1rem;
}

.key-values dt {
  color: var(--color-accent-grey);
  font-size: var(--font-size-small);
}

.key-values dd {
  margin: 0;
  color: var(--color-text);
}

.description {
  margin: 1rem 0 0;
  color: var(--color-text);
}
</style>
