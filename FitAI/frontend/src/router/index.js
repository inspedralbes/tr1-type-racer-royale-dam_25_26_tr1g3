import { createRouter, createWebHistory } from 'vue-router'
import FitAI from '@/pages/FitAI.vue'
import ModoJuego from '@/pages/ModoJuego.vue'
import JuegoSolo from '@/pages/JuegoSolo.vue' // 👈 importa tu nuevo componente
import Multiplayer from '@/pages/Multiplayer.vue'
import JuegoMultiplayer from '../pages/JuegoMultiplayer.vue'

const routes = [
  { path: '/', name: 'Home', component: FitAI },
  { path: '/modo/:ejercicio', name: 'ModoJuego', component: ModoJuego },
  { path: '/juego-solo/:ejercicio', name: 'JuegoSolo', component: JuegoSolo }, // 👈 nueva ruta
  { path: '/multiplayer/:ejercicio', name: 'Multiplayer', component: Multiplayer },
  { path: '/juego-multi/:ejercicio/:sessionId', name: 'JuegoMultiplayer', component: JuegoMultiplayer },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router