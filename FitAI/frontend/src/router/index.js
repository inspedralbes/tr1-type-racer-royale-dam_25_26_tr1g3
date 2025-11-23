import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import FitAI from '@/pages/FitAI.vue'
import ModoJuego from '@/pages/ModoJuego.vue'
import JuegoSolo from '@/pages/JuegoSolo.vue'
import Multiplayer from '@/pages/Multiplayer.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import JuegoMultiplayer from '../pages/JuegoMultiplayer.vue'
import EstadistiquesSessio from '@/pages/EstadistiquesSessio.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },

  {
    path: '/estadistiques/:ejercicio/:reps/:tempsTotal',
    name: 'EstadistiquesSessio',
    component: EstadistiquesSessio,
    props: true 
  },

  {
    path: '/register',
    name: 'Register',
    component: Register
  },

  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile.vue'),
    meta: { requiresAuth: true }
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
    path: '/juego-solo/:ejercicio/:codi_acces',
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
  {
    path: '/juego-multi/:ejercicio/:codi_acces',
    name: 'JuegoMultiplayer',
    component: JuegoMultiplayer,
    props: true
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => { 

  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  if (!authStore.isAuthenticated && to.name !== 'Login' && to.name !== 'Register') {
    await authStore.checkAuth();
  }

  const needsAuth = to.meta.requiresAuth
  const isAuthenticated = authStore.isAuthenticated

  if (needsAuth && !isAuthenticated) {
    next({ name: 'Login' })
  } else if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router