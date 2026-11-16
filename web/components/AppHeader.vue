<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { House, Settings } from '@lucide/vue'
import { live } from '../live.ts'
import ProfileName from './ProfileName.vue'

const route = useRoute()
const time = ref('')

function tick() {
  time.value = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

tick()
setInterval(tick, 1000)
</script>

<template>
  <header class="app-header">
    <div></div>
    <ProfileName :name="live.profileName" />
    <div class="right">
      <span class="clock">{{ time }}</span>
      <RouterLink v-if="route.path === '/settings'" to="/" class="nav" aria-label="Startseite" title="Startseite">
        <House :size="22" />
      </RouterLink>
      <RouterLink v-else to="/settings" class="nav" aria-label="Einstellungen" title="Einstellungen">
        <Settings :size="22" />
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr) 6.5rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-line);
}

.right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.clock {
  color: var(--color-accent-grey);
  font-family: var(--font-mono);
  font-size: var(--font-size-small);
}

.nav {
  display: inline-flex;
  padding: 0.5rem;
  color: var(--color-primary);
}
</style>
