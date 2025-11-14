<template>
  <div> <div class="d-flex justify-center px-4">
      <v-text-field
        v-model="searchQuery"
        placeholder="Buscar ejercicio..."
        variant="solo-filled"
        hide-details
        clearable
        class="search-bar elevation-6"
        prepend-inner-icon="mdi-magnify"
        density="comfortable"
        flat
        :style="{ width: $vuetify.display.mobile ? '95%' : '500px' }"
      ></v-text-field>
    </div>

    <v-divider class="divider-glow mx-auto mb-8"></v-divider>

    <v-container class="pa-0 pa-sm-4">
      <v-row
        justify="center"
        align="stretch"
        class="ga-4 ga-md-6"
      >
        <v-col
 v-for="exercici in filteredExercicis"
    :key="exercici.nom"
    cols="12"
    sm="6"
    md="4"   lg="3"   class="d-flex justify-center"
        >
          <v-card
            class="exercise-card elevation-12"
            @click="anarAExercici(exercici.nom)"
          >
            <v-img
              :src="exercici.imatge"
              :alt="exercici.label"
              height="200"
              cover
              class="transition-img"
            />

            <v-overlay
              contained
              scrim="#1a2238"
              class="d-none d-sm-flex align-center justify-center text-center pa-3"
              activator="parent"
              location="top"
            >
              <p class="text-white text-body-2 font-weight-light">
                {{ exercici.descripcio }}
              </p>
            </v-overlay>

            <div class="exercise-label-bottom text-white font-weight-bold text-h6 text-center pa-3">
              {{ exercici.label }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <div
        v-if="filteredExercicis.length === 0"
        class="text-white text-center mt-10 text-h6 font-weight-light"
      >
        No s'han trobat exercicis amb aquest nom. 🤖
      </div>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')

// --- DATOS Y LÓGICA DE EJERCICIOS ---
const exercicis = [
  {
    nom: 'Flexions',
    label: 'Flexions',
    imatge: new URL('@/assets/flexiones.jpg', import.meta.url).href,
    descripcio: 'Treballa pit, braços i espatlles amb aquest exercici clàssic.',
  },
  {
    nom: 'Squats',
    label: 'Squats',
    imatge: new URL('@/assets/sentadilla.jpg', import.meta.url).href,
    descripcio: 'Enforteix cames i glutis amb moviment controlat y profund.',
  },
  {
    nom: 'Salts',
    label: 'Salts',
    imatge: new URL('@/assets/saltos.jpg', import.meta.url).href,
    descripcio: 'Millora la potència explosiva i la coordinació.',
  },
  {
    nom: 'Abdominals',
    label: 'Abdominals',
    imatge: new URL('@/assets/abdominales.jpg', import.meta.url).href,
    descripcio: 'Tonifica el teu nucli i enforteix la zona abdominal.',
  },
  {
    nom: 'Fons',
    label: 'Fons',
    imatge: new URL('@/assets/fons.jpg', import.meta.url).href,
    descripcio: 'Exercici intens per tríceps, espatlles i pit.',
  },
  {
    nom: 'Pujades',
    label: 'Pujades',
    imatge: new URL('@/assets/pujades.jpg', import.meta.url).href,
    descripcio: 'Enforteix les cames de manera unilateral millorant l\'equilibri.',
  },
]

const filteredExercicis = computed(() =>
  exercicis.filter((e) =>
    (e.label + ' ' + e.descripcio)
      .toLowerCase()
      .includes(searchQuery.value.trim().toLowerCase())
  )
)

const anarAExercici = (nom) => {
  router.push({ name: 'ModoJuego', params: { ejercicio: nom } })
}
</script>

<style scoped>
/* ==================================== */
/* ======== TARJETAS (CARD) ======== */
/* ==================================== */
.exercise-card {
  width: 100%;
  max-width: 320px; 
  min-height: 180px;
  border-radius: 16px; 
  background: rgba(30, 30, 47, 0.7); 
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  backdrop-filter: blur(8px); 
}
.exercise-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.8); 
}

/* Imagen con zoom sutil en hover */
.transition-img {
  transition: transform 0.6s ease;
}
.exercise-card:hover .transition-img {
  transform: scale(1.05);
}

/* Franja inferior para el nombre */
.exercise-label-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(139, 92, 246, 0.7);
  backdrop-filter: blur(6px);
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* ==================================== */
/* ======== BUSCADOR (SEARCH BAR) ======== */
/* ==================================== */
.search-bar {
  max-width: 600px; 
  border-radius: 12px !important;
  color: white;
  transition: all 0.4s ease;
}

.search-bar :deep(.v-field__input) {
  color: rgb(0, 0, 0) !important;
  font-size: 1rem;
}
.search-bar :deep(.v-field__overlay) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  transition: background-color 0.4s ease;
}
.search-bar:hover :deep(.v-field__overlay) {
  background-color: rgba(255, 255, 255, 0.2) !important;
}
.search-bar:focus-within {
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.8) !important;
}
.search-bar :deep(.v-icon) {
  color: #8b5cf6 !important; 
}
</style>