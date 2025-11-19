<template>
  <v-app>
    <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
      <v-container class="text-center text-white pa-4" style="max-width: 500px;">
        
        <h1 class="results-title-neon text-h4 text-sm-h3 font-weight-bold mb-10 mt-6">
            SESSIÓ COMPLETADA
        </h1>

        <v-card 
          class="results-card rounded-xl pa-6 pa-sm-8 elevation-8" 
        >
          
          <h2 class="text-h6 font-weight-bold mb-6 text-white ranking-title">RESUM D'ESTADÍSTIQUES</h2>

          <v-row class="justify-center">
            <v-col cols="12" sm="8" md="6" class="px-0"> 
              
              <v-row class="mb-4 ga-3">
                <v-col cols="12" class="d-flex">
                  <v-card class="data-card pa-3 rounded-lg flex-grow-1 blue-glow-card" color="#0e111d">
                    <h3 class="text-caption font-weight-light text-blue-lighten-2">EXERCICI</h3>
                    <p class="text-subtitle-1 font-weight-bold text-uppercase">{{ exerciciLabel }}</p>
                  </v-card>
                </v-col>
              </v-row>
              
              <v-row class="mb-4 ga-3">
                <v-col cols="12" class="d-flex">
                  <v-card class="data-card reps-card pa-3 rounded-lg flex-grow-1 purple-glow-card" color="#0e111d">
                    <h3 class="text-caption font-weight-light text-purple-lighten-2">REPETICIONS TOTALS</h3>
                    <p class="text-h6 font-weight-black reps-number">{{ reps }}</p>
                  </v-card>
                </v-col>
              </v-row>
              
              <v-row class="mb-8 ga-3"> 
                <v-col cols="12" class="d-flex">
                  <v-card class="data-card time-card pa-3 rounded-lg flex-grow-1 cyan-glow-card" color="#0e111d">
                    <h3 class="text-caption font-weight-light text-cyan-lighten-2">TEMPS TOTAL</h3>
                    <p class="text-h6 font-weight-black time-value">{{ formattedTime }}</p>
                  </v-card>
                </v-col>
              </v-row>

            </v-col>
          </v-row>

          <v-divider class="divider-subtle mx-auto my-6"></v-divider>

          <v-btn
            color="#8b5cf6"
            class="mt-4 clean-button"
            height="48"
            @click="goHome" 
          >
            TORNAR A LA PANTALLA PRINCIPAL
            <v-icon end class="ml-2">mdi-home-outline</v-icon>
          </v-btn>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// ---------------------------------------------------------
// OBTENCIÓN DE DATOS
// ---------------------------------------------------------
const reps = Number(route.params.reps) || 0
const tempsTotal = Number(route.params.tempsTotal) || 0 
const exercici = route.params.ejercicio || 'EXERCICI'

// Diccionari per mapejar els noms dels exercicis
const noms = {
  Flexions: 'FLEXIONS', Squats: 'SQUATS', Salts: 'SALTS', Abdominals: 'ABDOMINALS', Fons: 'FONS', Pujades: 'PUJADES',
  flexiones: 'FLEXIONS', sentadillas: 'ESQUATS', saltos: 'SALTS', abdominales: 'ABDOMINALS', fons: 'FONS', pujades: 'PUJADES',
}

const exerciciLabel = computed(() => noms[exercici] || exercici)

// Funció per formatar el temps de segons a MM:SS
const formattedTime = computed(() => {
  const minuts = Math.floor(tempsTotal / 60)
  const segons = tempsTotal % 60
  return `${minuts.toString().padStart(2, '0')}:${segons.toString().padStart(2, '0')}`
})

const goHome = () => {
  router.push('/')
}

// Actualizar estadísticas globales del usuario en segundo plano
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await authStore.refreshUser()
  }
})
</script>

<style scoped>
/* ==================================== */
/* ======== FONDO Y ANIMACIÓN ======== */
/* ==================================== */
.bg-fitai-deep-space {
  background:
    radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 40%), 
    radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 40%), 
    linear-gradient(135deg, #0e111d, #141829 50%, #0e111d 100%); /* Fons més fosc per contrast */
  background-attachment: fixed;
  background-size: cover;
  min-height: 100vh;
  animation: backgroundPulse 12s ease infinite alternate;
}

@keyframes backgroundPulse {
  0% { filter: brightness(1); }
  100% { filter: brightness(1.03); }
}

/* ==================================== */
/* ======== NOU TÍTOL NEÓ ESTILITZAT ======== */
/* ==================================== */
.results-title-neon {
  /* Estil copiat de l'exemple */
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: linear-gradient(90deg, #9b6bff, #3b4ef6, #8851ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradientShift 6s ease infinite;
  position: relative;
  line-height: 1.1;
  text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}

.results-title-neon::after {
  /* Subratllat neó */
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  width: 160px; /* Reduïm l'amplada */
  height: 3px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.9);
  animation: pulseGlow 2.5s infinite ease-in-out;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.7; box-shadow: 0 0 12px rgba(139, 92, 246, 0.4); }
  50% { opacity: 1; box-shadow: 0 0 25px rgba(139, 92, 246, 0.9); }
}

/* Títol de les estadístiques - mantenim l'estil anterior */
.ranking-title {
    color: #ffffff; 
    text-shadow: 0 0 8px rgba(139, 92, 246, 0.5); 
    letter-spacing: 1.5px;
    text-transform: uppercase;
}


/* ==================================== */
/* ======== TARGETES DE DADES (MÉS COLORIDES) ======== */
/* ==================================== */
.results-card {
    background: rgba(30, 30, 47, 0.75) !important; 
    backdrop-filter: blur(12px);
    border: 1px solid rgba(139, 92, 246, 0.3); 
    box-shadow: 
        0 0 8px rgba(139, 92, 246, 0.2), 
        0 8px 25px rgba(0, 0, 0, 0.7); 
    transition: all 0.4s ease;
}

/* Fons de les targetes de dades canviat a un fons més fosc #0e111d per contrast */
.data-card {
    background-color: #0e111d !important; 
    border: 1px solid rgba(255, 255, 255, 0.1); /* Vora subtil per defecte */
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.data-card:hover {
    transform: translateY(-2px);
}

/* Estils de color neó millorats per cada quadre */

.blue-glow-card { /* EXERCICI */
    border: 1px solid #81d4fa;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}
.blue-glow-card:hover {
    box-shadow: 0 0 15px rgba(59, 130, 246, 1);
}

.purple-glow-card { /* REPETICIONS */
    border: 1px solid #ce93d8;
    box-shadow: 0 0 8px rgba(139, 92, 246, 0.5); 
}
.purple-glow-card:hover {
    box-shadow: 0 0 15px rgba(139, 92, 246, 1);
}

.cyan-glow-card { /* TEMPS */
    border: 1px solid #00ffaa;
    box-shadow: 0 0 8px rgba(0, 255, 170, 0.5); 
}
.cyan-glow-card:hover {
    box-shadow: 0 0 15px rgba(0, 255, 170, 1);
}

/* Estilo para los números grandes (Colores mantenidos) */
.reps-number {
    color: #81d4fa !important;
    text-shadow: 0 0 5px rgba(129, 212, 250, 0.6);
}

.time-value {
    color: #00ffaa !important; /* Verd Neón */
    text-shadow: 0 0 5px rgba(0, 255, 170, 0.6);
}


/* Estilo para los títulos de las tarjetas (Mantenidos) */
.text-blue-lighten-2 {
    color: #81d4fa !important;
    opacity: 0.9;
}
.text-purple-lighten-2 {
    color: #ce93d8 !important;
    opacity: 0.9;
}
.text-cyan-lighten-2 { 
    color: #00ffaa !important;
    opacity: 0.9;
}


/* ==================================== */
/* ======== DIVIDER Y BOTÓN LIMPIO ======== */
/* ==================================== */
.divider-subtle {
    max-width: 90%;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, #3b82f6, #8b5cf6, transparent 100%);
    box-shadow: 0 0 5px rgba(139, 92, 246, 0.4);
    opacity: 0.5;
}

.clean-button {
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 1px;
    border-radius: 8px;
    box-shadow: 
        0 0 8px rgba(139, 92, 246, 0.3),
        0 4px 10px rgba(0, 0, 0, 0.5) !important;
    transition: all 0.2s ease;
}

.clean-button:hover {
    transform: translateY(-1px);
    box-shadow: 
        0 0 12px rgba(139, 92, 246, 0.6), 
        0 6px 15px rgba(0, 0, 0, 0.7) !important;
}
</style>