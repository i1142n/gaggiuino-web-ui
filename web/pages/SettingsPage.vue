<script setup lang="ts">
import { footer, useFooter } from '../footer.ts'
import SwipeTile from '../components/SwipeTile.vue'
import TileSwiper from '../components/TileSwiper.vue'

const leaveEditMode = () => (footer.editing = false)

useFooter({ save: leaveEditMode, cancel: leaveEditMode })
</script>

<template>
  <TileSwiper>
    <SwipeTile>
      <h2>Einstellungen</h2>
      <p>Platzhalter, die Einstellungen folgen in Phase 7.</p>
    </SwipeTile>
  </TileSwiper>
</template>
