<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Trash2 } from '@lucide/vue'
import { footer, useFooter } from '../footer.ts'
import IconButton from '../components/IconButton.vue'
import SwipeTile from '../components/SwipeTile.vue'
import TileSwiper from '../components/TileSwiper.vue'
import WithSidebar from '../components/WithSidebar.vue'

const route = useRoute()
const leaveEditMode = () => (footer.editing = false)

useFooter({
  create: () => {},
  save: leaveEditMode,
  remove: leaveEditMode,
  cancel: leaveEditMode,
})

watch(
  () => route.query.edit,
  (edit) => (footer.editing = edit !== undefined),
  { immediate: true },
)
</script>

<template>
  <WithSidebar>
    <TileSwiper :start="1">
      <SwipeTile v-for="tile in 3" :key="tile">
        <h2>Platzhalter-Kachel {{ tile }}</h2>
        <p>Profil-Kacheln folgen in Phase 4.</p>
      </SwipeTile>
    </TileSwiper>
    <template #sidebar>
      <ul class="placeholder-list">
        <li v-for="phase in 3" :key="phase">
          <span>Platzhalter {{ phase }}</span>
          <IconButton :icon="Trash2" label="Löschen" tone="red" />
        </li>
      </ul>
      <IconButton :icon="Plus" label="Neue Phase" />
    </template>
  </WithSidebar>
</template>

<style scoped>
.placeholder-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.placeholder-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
