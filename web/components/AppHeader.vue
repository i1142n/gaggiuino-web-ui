<script setup lang="ts">
import { useRoute } from 'vue-router'
import { House, Settings } from '@lucide/vue'
import { live } from '../live.ts'
import ProfileName from './ProfileName.vue'

const route = useRoute()
</script>

<template>
  <header class="app-header">
    <div></div>
    <ProfileName :name="live.profileName" />
    <RouterLink v-if="route.path === '/settings'" to="/" class="nav" aria-label="Startseite" title="Startseite">
      <House :size="22" />
    </RouterLink>
    <RouterLink v-else to="/settings" class="nav" aria-label="Einstellungen" title="Einstellungen">
      <Settings :size="22" />
    </RouterLink>
  </header>
</template>

<style scoped>
.app-header {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) 2.5rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-line);
}

.nav {
  display: inline-flex;
  justify-self: end;
  padding: 0.5rem;
  color: var(--color-primary);
}
</style>
