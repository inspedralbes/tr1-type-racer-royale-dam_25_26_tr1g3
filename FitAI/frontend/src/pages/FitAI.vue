<template>
  <v-app>
    <v-main
      class="d-flex flex-column align-center pa-4 bg-fitai-bright"
      style="min-height: 100vh"
    >
      <div class="header-content pt-4 pb-6 w-100">
        <div class="d-flex justify-space-between align-center px-4">
            
          <v-btn
            icon
            size="large"
            variant="tonal"
            class="profile-btn-glow"
            @click="goToProfile"
          >
            <v-icon size="24">mdi-account-circle</v-icon>
            <v-tooltip activator="parent" location="bottom">
              El meu Perfil
            </v-tooltip>
          </v-btn>
          
          <div class="d-flex justify-center logo-title-container" style="flex-grow: 1;">
            <v-img
              src="@/assets/LOGO.png"
              alt="Logo NextRep"
              max-height="60"
              max-width="60"
              class="logo-home mr-3 mt-1"
              contain
            />
            <h1 class="nextrep-title">
              <span class="next">Next</span><span class="rep">Rep</span>
            </h1>
          </div>
          
          <div style="width: 52px; height: 52px;"></div>
        </div>
      </div>

      <ExerciseList class="w-100" />

      <v-divider class="divider-glow mx-auto my-8"></v-divider>

      <GlobalRanking />

      <StreakTracker />

    </v-main>
  </v-app>
</template>

<script setup>
import { useRouter } from 'vue-router' // Importa useRouter per a la navegació
// Importar els nous components
import ExerciseList from '@/components/ExerciseList.vue'
import GlobalRanking from '@/components/GlobalRanking.vue'
import StreakTracker from '@/components/StreakTracker.vue'

const router = useRouter()

/**
 * Funció per navegar a la pàgina de perfil.
 * Assegura't que el nom de la ruta ('Profile') coincideix amb el teu router/index.js
 */
const goToProfile = () => {
  router.push({ name: 'Profile' });
}
</script>

<style>
/* NOTA: AQUEST BLOC NO ÉS 'scoped'. 
  Això permet que .bg-fitai-bright i .divider-glow 
  s'apliquin correctament a la vista i als fills.
*/

/* ==================================== */
/* ======== NUEVO ESTILO DE LOGO ======== */
/* ==================================== */
.logo-home {
    /* Mismo filtro de brillo que en Login/Registro, pero más sutil para la Home */
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
}

/* ==================================== */
/* ======== FONDO NEÓN BRILLANTE ======== */
/* ==================================== */
.bg-fitai-bright {
  background:
    radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.25) 0%, transparent 45%),
    radial-gradient(circle at 90% 10%, rgba(147, 51, 234, 0.25) 0%, transparent 45%),
    linear-gradient(135deg, #1a2238, #16213e 50%, #0f172a 100%);
  background-attachment: fixed;
  background-size: cover;
  animation: bgShine 18s ease-in-out infinite;
}

@keyframes bgShine {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ==================================== */
/* ======== TÍTULO NEXTREP ======== */
/* ==================================== */
.nextrep-title {
  font-size: 3.5rem; 
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: white;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.85);
  line-height: 1;
  user-select: none;
}

@media (min-width: 600px) {
  .nextrep-title {
    font-size: 4.5rem;
    letter-spacing: 2px;
  }
}

.next {
  color: #ffffff;
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
}

.rep {
  background: linear-gradient(90deg, #9b6bff, #3b82f6, #9b6bff);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-style: italic;
  animation: gradientShift 5s ease infinite;
  text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Línea luminosa decorativa (aplicada globalmente) */
.divider-glow {
    max-width: 85%;
    height: 1px;
    border-radius: 4px;
    background: linear-gradient(90deg, transparent 0%, #3b82f6, #8b5cf6, #3b82f6, transparent 100%);
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
    opacity: 0.7;
}
@media (min-width: 600px) {
    .divider-glow {
        max-width: 600px;
        height: 2px;
    }
}

/* ==================================== */
/* ======== NOU ESTIL BOTÓ PERFIL ======== */
/* ==================================== */
.profile-btn-glow {
    /* Estil base del botó Vuetify (icon, tonal) */
    background-color: rgba(139, 92, 246, 0.15) !important;
    border: 1px solid rgba(139, 92, 246, 0.4);
    color: #a78bfa !important;
    transition: all 0.3s ease-in-out;
}

.profile-btn-glow:hover {
    background-color: rgba(139, 92, 246, 0.3) !important;
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.8) !important;
    transform: scale(1.05);
}
</style>