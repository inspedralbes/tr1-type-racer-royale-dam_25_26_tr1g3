import { createRouter, createWebHistory } from 'vue-router'
import FitAI from '@/pages/FitAI.vue'
import ModoJuego from '@/pages/ModoJuego.vue'
import JuegoSolo from '@/pages/JuegoSolo.vue' // 👈 importa tu nuevo componente

const routes = [
  { path: '/', name: 'Home', component: FitAI },
  { path: '/modo/:ejercicio', name: 'ModoJuego', component: ModoJuego },
  { path: '/juego-solo/:ejercicio', name: 'JuegoSolo', component: JuegoSolo }, // 👈 nueva ruta
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router