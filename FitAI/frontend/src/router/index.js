import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import FitAI from '@/pages/FitAI.vue'
import ModoJuego from '@/pages/ModoJuego.vue'
import JuegoSolo from '@/pages/JuegoSolo.vue'
import Multiplayer from '@/pages/Multiplayer.vue'
import Login from '@/pages/Login.vue' 
import Register from '@/pages/Register.vue'
import JuegoMultiplayer from '../pages/JuegoMultiplayer.vue'

const routes = [
  { 
    path: '/login', 
    name: 'Login', 
    component: Login 
  },
  { 
    path: '/register', 
    name: 'Register', 
    component: Register 
  },

  { 
    path: '/', 
    name: 'Home', 
    component: FitAI, 
    meta: { requiresAuth: true }
  },
  { 
    path: '/modo/:ejercicio', 
    name: 'ModoJuego', 
    component: ModoJuego, 
    meta: { requiresAuth: true } 
  },
  { 
    path: '/juego-solo/:ejercicio/:sessionId', 
    name: 'JuegoSolo', 
    component: JuegoSolo, 
    meta: { requiresAuth: true }
  },
  { 
    path: '/multiplayer/:ejercicio', 
    name: 'Multiplayer', 
    component: Multiplayer, 
    meta: { requiresAuth: true }
  },
  { path: '/juego-multi/:ejercicio/:sessionId', name: 'JuegoMultiplayer', component: JuegoMultiplayer },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  
  const authStore = useAuthStore()
  
  const needsAuth = to.meta.requiresAuth
  const isAuthenticated = authStore.isAuthenticated

  if (needsAuth && !isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && isAuthenticated) {
    next({ name: 'Home' })
  } else {
    next() 
  }
})

export default router