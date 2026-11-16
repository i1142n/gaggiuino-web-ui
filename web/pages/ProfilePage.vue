<script setup lang="ts">
import { watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { footer, useFooter } from '../footer.ts'
import SwipeTile from '../components/SwipeTile.vue'
import TileSwiper from '../components/TileSwiper.vue'

const route = useRoute()
const router = useRouter()
const backHome = () => router.push('/')

useFooter({ save: backHome, cancel: backHome })

watchEffect(() => (footer.editing = route.params.id === 'new' || route.query.edit !== undefined))
</script>

<template>
  <TileSwiper>
    <SwipeTile>
      <h2>{{ route.params.id === 'new' ? 'Neues Profil' : `Profil ${route.params.id}` }}</h2>
      <p>Platzhalter, die Profil-Seite folgt in Phase 5.</p>
    </SwipeTile>
  </TileSwiper>
</template>
