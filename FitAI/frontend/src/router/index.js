import { createRouter, createWebHistory } from 'vue-router'
import FitAI from '@/pages/FitAI.vue'
import ModoJuego from '@/pages/ModoJuego.vue'
import JuegoSolo from '@/pages/JuegoSolo.vue' 
import Multiplayer from '@/pages/Multiplayer.vue'

const routes = [
  { path: '/', name: 'Home', component: FitAI },
  { path: '/modo/:ejercicio', name: 'ModoJuego', component: ModoJuego },
  { path: '/juego-solo/:ejercicio/:sessionId', name: 'JuegoSolo', component: JuegoSolo }, 
  { path: '/multiplayer/:ejercicio', name: 'Multiplayer', component: Multiplayer },
]
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router