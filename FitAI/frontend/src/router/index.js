import { createRouter, createWebHistory } from 'vue-router'
import FitAI from '@/pages/FitAI.vue'
import ModoJuego from '@/pages/ModoJuego.vue'

const routes = [
  { path: '/', name: 'Home', component: FitAI },
  { path: '/modo/:ejercicio', name: 'ModoJuego', component: ModoJuego },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
