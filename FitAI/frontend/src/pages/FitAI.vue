<template>
  <v-app>
    <v-main
      class="d-flex flex-column align-center pa-4 bg-fitai-bright"
      style="min-height: 100vh"
    >
      <div class="header-content pt-4 pb-6 w-100">
        <div class="d-flex justify-center logo-title-container mb-6">
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
      </div>

      <ExerciseList class="w-100" />

      <v-divider class="divider-glow mx-auto my-8"></v-divider>

      <GlobalRanking />

    </v-main>
  </v-app>
</template>

<script setup>
// Importar els nous components
import ExerciseList from '@/components/ExerciseList.vue'
import GlobalRanking from '@/components/GlobalRanking.vue'
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
</style>