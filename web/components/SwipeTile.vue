<template>
  <section class="swipe-tile">
    <slot />
  </section>
</template>

<style scoped>
.swipe-tile {
  flex: 0 0 100%;
  box-sizing: border-box;
  padding: 1.5rem 2.5rem;
  overflow-y: auto;
  scroll-snap-align: center;
}
</style>
