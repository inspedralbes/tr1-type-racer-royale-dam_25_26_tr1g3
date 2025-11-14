<template>
  <div>
    <div class="d-flex justify-center px-4">
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
          md="4"
          lg="3"
          class="d-flex justify-center"
        >
          <v-card
            class="exercise-card elevation-12"
            @click="anarAExercici(exercici.nom)"
          >
            
            <div class="exercise-description-overlay d-flex align-center justify-center text-center pa-4">
              <span class="text-white font-weight-light text-body-1">{{ exercici.descripcio }}</span>
            </div>

            <v-img
              :src="exercici.imatge"
              :alt="exercici.label"
              height="250"
              cover
              class="transition-img"
            />

            <div class="exercise-label-bottom text-white font-weight-bold text-h6 text-center pa-1">
              {{ exercici.label }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <div
        v-if="filteredExercicis.length === 0"
        class="text-white text-center mt-10 text-h6 font-weight-light"
      >
        No s'han trobat exercicis con este nombre. 🤖
      </div>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')

// --- DATOS Y LÓGICA DE EJERCICIOS (Sin cambios) ---
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
  max-width: 380px;
  min-height: 180px;
  border-radius: 16px;
  background: rgba(30, 30, 47, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  backdrop-filter: blur(8px);
  position: relative; 
}

/* Overlay de descripción con animación de entrada */
.exercise-description-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(62, 93, 231, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem;
  opacity: 0; 
  transform: translateY(10px); 
  transition: opacity 0.3s ease, transform 0.3s ease;
  z-index: 2; 
  border-radius: 16px;
}

.exercise-card:hover .exercise-description-overlay {
  opacity: 1; 
  transform: translateY(0); 
}

/* Franja inferior para el nombre */
.exercise-label-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(62, 93, 231, 0.7);
  backdrop-filter: blur(6px);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.6);
  letter-spacing: 1px;
  text-transform: uppercase;
  z-index: 1; 
  transition: all 0.3s ease; /* AÑADIDO: Para animar la salida */
}

/* ANIMACIÓN DE SALIDA: Cuando se hace hover en la tarjeta, la etiqueta desaparece */
.exercise-card:hover .exercise-label-bottom {
  opacity: 0; /* Desaparece */
  transform: translateY(100%); /* Se desliza fuera de la tarjeta hacia abajo */
}

/* Resto de estilos (sin cambios) */
.transition-img {
  transition: transform 0.6s ease;
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
.search-bar:focus-within {
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.8) !important;
}
.search-bar :deep(.v-icon) {
  color: #8b5cf6 !important;
}
</style>