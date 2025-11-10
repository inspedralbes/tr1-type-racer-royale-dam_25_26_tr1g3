import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import FitAI from '@/pages/FitAI.vue'
import ModoJuego from '@/pages/ModoJuego.vue'
import Multiplayer from '@/pages/Multiplayer.vue'
import Login from '@/pages/Login.vue' 
import Register from '@/pages/Register.vue'

// CORRECCIÓ: Importa el component de joc UNIFICAT
import Joc from '@/pages/Joc.vue'
// ESBORRA: Els imports de JuegoSolo i JuegoMultiplayer ja no són necessaris

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
    // CORRECCIÓ: Canvi de nom de la ruta per consistència
    path: '/seleccio/:ejercicio', 
    name: 'ModoJuego', 
    component: ModoJuego, 
    meta: { requiresAuth: true } 
  },
  { 
    path: '/multijugador/:ejercicio', 
    name: 'Multiplayer', 
    component: Multiplayer, 
    meta: { requiresAuth: true }
  },
  
  // --- CORRECCIÓ: RUTES UNIFICADES ---
  // Aquestes rutes reemplacen 'JuegoSolo' i 'JuegoMultiplayer'
  { 
    path: '/joc/:ejercicio/:sessionId', 
    name: 'Joc', 
    component: Joc,
    meta: { requiresAuth: true },
    props: true // Permet que 'ejercicio' i 'sessionId' es passin com props
  },
  
  // ESBORRA: Les rutes velles ja no són necessàries
  // { path: '/juego-solo/...' },
  // { path: '/juego-multi/...' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// --- CORRECCIÓ: Guàrdia de navegació millorada ---
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const needsAuth = to.meta.requiresAuth
  const isAuthenticated = authStore.isAuthenticated

  if (needsAuth && !isAuthenticated) {
    // Si necessita login i no està autenticat, l'enviem a Login
    // Afegim 'redirect' perquè sàpiga on tornar
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && isAuthenticated) {
    // Si ja està autenticat, no el deixis anar a Login, envia'l a Home
    next({ name: 'Home' })
  } else {
    // En qualsevol altre cas, deixa'l passar
    next() 
  }
})

export default router