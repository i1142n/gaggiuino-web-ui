<template>
  <div class="with-sidebar">
    <div class="main">
      <slot />
    </div>
    <aside class="sidebar">
      <slot name="sidebar" />
    </aside>
  </div>
</template>

<style scoped>
.with-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.main {
  height: 60dvh;
}

.sidebar {
  flex: 1;
  padding: 1rem 1.5rem;
  background: var(--color-surface);
}

@media (min-width: 768px) {
  .with-sidebar {
    flex-direction: row-reverse;
    height: 100%;
  }

  .main {
    flex: 1;
    min-width: 0;
    height: auto;
  }

  .sidebar {
    flex: none;
    width: 16rem;
    overflow-y: auto;
  }
}
</style>
