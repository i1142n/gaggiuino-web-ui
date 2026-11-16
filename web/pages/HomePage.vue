<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api.ts'
import type { ProfileListEntry, ProfileWithDescription } from '../api.ts'
import { live } from '../live.ts'
import { useFooter } from '../footer.ts'
import ProfileTile from '../components/ProfileTile.vue'
import SwipeTile from '../components/SwipeTile.vue'
import TileSwiper from '../components/TileSwiper.vue'

const router = useRouter()
const profiles = ref<ProfileWithDescription[]>([])
const activeId = ref<number>()
const visibleIndex = ref(0)
const loadError = ref('')
const selectError = ref('')

async function load() {
  try {
    const summaries = await api<ProfileListEntry[]>('/api/profiles')
    const loaded: ProfileWithDescription[] = []
    for (const summary of summaries) loaded.push(await api<ProfileWithDescription>(`/api/profiles/${summary.id}`))
    activeId.value = summaries.find((summary) => summary.selected)?.id
    visibleIndex.value = Math.max(0, loaded.findIndex((profile) => profile.id === activeId.value))
    profiles.value = loaded
    loadError.value = ''
  } catch (error) {
    loadError.value = (error as Error).message
  }
}

async function tap(id: number) {
  if (id === activeId.value) return router.push(`/profile/${id}`)
  try {
    await api(`/api/profiles/${id}/select`, { method: 'POST' })
    activeId.value = id
    selectError.value = ''
  } catch (error) {
    selectError.value = (error as Error).message
  }
}

watch(
  () => live.profileId,
  (id) => {
    if (id !== undefined) activeId.value = id
  },
)

watch(activeId, (id) => {
  const index = profiles.value.findIndex((profile) => profile.id === id)
  if (index >= 0) visibleIndex.value = index
})

watch(
  () => live.reachable,
  (reachable) => {
    if (reachable && loadError.value) load()
  },
)

useFooter({
  create: () => router.push('/profile/new'),
  edit: () => {
    const profile = profiles.value[visibleIndex.value]
    if (profile) router.push(`/profile/${profile.id}?edit`)
  },
})

load()
</script>

<template>
  <section v-if="live.reachable === false || loadError" class="message">
    <h2>{{ live.reachable === false ? 'Gaggiuino nicht erreichbar' : 'Profile konnten nicht geladen werden' }}</h2>
    <p>{{ live.error || loadError }}</p>
    <p>Die Seite lädt wieder, sobald die Maschine antwortet.</p>
  </section>
  <template v-else-if="profiles.length">
    <p v-if="selectError" class="select-error">{{ selectError }}</p>
    <TileSwiper v-model="visibleIndex">
      <SwipeTile v-for="profile in profiles" :key="profile.id">
        <ProfileTile :profile="profile" :active="profile.id === activeId" @click="tap(profile.id)" @keydown.enter="tap(profile.id)" />
      </SwipeTile>
    </TileSwiper>
  </template>
</template>

<style scoped>
.message {
  padding: 1.5rem 2.5rem;
  color: var(--color-text);
}

.select-error {
  margin: 0;
  padding: 0.5rem 2.5rem;
  color: var(--color-accent-red);
  font-size: var(--font-size-small);
}
</style>
