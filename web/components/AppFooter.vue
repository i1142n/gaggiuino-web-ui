<script setup lang="ts">
import { Coffee, Pencil, Plus, Save, Trash2, X } from '@lucide/vue'
import { footer } from '../footer.ts'
import IconButton from './IconButton.vue'

function startEditing() {
  footer.editing = true
  footer.actions.edit?.()
}
</script>

<template>
  <footer class="app-footer">
    <div class="left">
      <IconButton v-if="footer.actions.create" :icon="Plus" label="Neues Profil" text @click="footer.actions.create?.()" />
    </div>
    <div class="center">
      <IconButton :icon="Coffee" label="Brew" text disabled hint="noch nicht verfügbar" />
    </div>
    <div class="right">
      <template v-if="footer.editing">
        <IconButton v-if="footer.actions.remove" :icon="Trash2" label="Löschen" text tone="red" @click="footer.actions.remove?.()" />
        <IconButton :icon="Save" label="Speichern" text tone="green" @click="footer.actions.save?.()" />
        <IconButton :icon="X" label="Abbrechen" text tone="grey" @click="footer.actions.cancel?.()" />
      </template>
      <IconButton v-else-if="footer.actions.save" :icon="Pencil" label="Bearbeiten" text @click="startEditing" />
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--color-line);
}

.center {
  display: flex;
  justify-content: center;
}

.right {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
}
</style>
