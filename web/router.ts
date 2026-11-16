import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import SettingsPage from './pages/SettingsPage.vue'
import { useFooter } from './footer.ts'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/settings', component: SettingsPage },
  ],
})

router.beforeEach((to, from) => {
  if (to.matched[0] !== from.matched[0]) useFooter({})
})

export default router
