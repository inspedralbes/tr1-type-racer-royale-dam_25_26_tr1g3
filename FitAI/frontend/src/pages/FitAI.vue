<template>
  <v-app>
    <v-main
      class="d-flex flex-column align-center pa-4 bg-fitai-bright"
      style="min-height: 100vh"
    >
      <div class="header-content pt-4 pb-6 w-100">
        <h1 class="nextrep-title mb-6">
          <span class="next">Next</span><span class="rep">Rep</span>
        </h1>

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
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')

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
    descripcio: 'Enforteix cames i glutis amb moviment controlat i profund.',
  },
  {
    nom: 'Salts',
    label: 'Salts',
    imatge: new URL('@/assets/saltos.jpg', import.meta.url).href,
    descripcio: 'Millora la potència explosiva i la coordinació.',
  },
  {
    nom: 'Abdominles',
    label: 'Abdominals',
    imatge: new URL('@/assets/abdominales.jpg', import.meta.url).href,
    descripcio: 'Tonifica el teu nucli i enforteix la zona abdominal.',
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
  /* Tamaño de fuente más adaptado a móvil */
  font-size: 3.5rem; /* Ajuste en móvil */
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-align: center;
  color: white;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.85);
  line-height: 1;
  user-select: none;
}

/* Ajuste del título en escritorio */
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

/* Línea luminosa decorativa (más sutil) */
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
/* ======== TARJETAS (CARD) ======== */
/* ==================================== */
.exercise-card {
  width: 100%;
  max-width: 320px; /* Tamaño máximo más adecuado para móvil */
  min-height: 250px;
  border-radius: 16px; /* Bordes más redondeados */
  background: rgba(30, 30, 47, 0.7); /* Fondo semi-transparente */
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  backdrop-filter: blur(8px); /* Efecto cristalizado (Glassmorphism) */
}
.exercise-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.8); /* Brillo intenso en hover */
}

/* Imagen con zoom sutil en hover */
.transition-img {
  transition: transform 0.6s ease;
}
.exercise-card:hover .transition-img {
  transform: scale(1.05);
}

/* Franja inferior para el nombre (siempre visible, reemplaza el label central) */
.exercise-label-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  /* Fondo más vibrante y semitransparente */
  background: rgba(139, 92, 246, 0.7);
  backdrop-filter: blur(6px);
  /* Brillo sutil */
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* ==================================== */
/* ======== BUSCADOR (SEARCH BAR) ======== */
/* ==================================== */
.search-bar {
  max-width: 600px; /* Limita el ancho del buscador en pantallas grandes */
  border-radius: 12px !important;
  color: white;
  transition: all 0.4s ease;
}

/* Estilo del campo de texto interno (Vuetify overides) */
.search-bar .v-field__input {
  color: white !important;
  font-size: 1rem;
}
.search-bar .v-field__overlay {
  background-color: rgba(255, 255, 255, 0.1) !important;
  transition: background-color 0.4s ease;
}
.search-bar:hover .v-field__overlay {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

/* Estilo de la barra de búsqueda al estar enfocada */
.search-bar:focus-within {
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.8) !important;
}

/* Estilo de los iconos (lupa y limpiar) */
.search-bar .v-icon {
  color: #8b5cf6 !important; /* Color neón morado para los iconos */
}

/* ==================================== */
/* ======== ANIMACIONES Y UTILS ======== */
/* ==================================== */
.min-h-screen {
  min-height: 100vh;
}
</style>