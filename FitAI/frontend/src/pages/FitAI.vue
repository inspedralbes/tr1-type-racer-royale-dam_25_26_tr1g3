<template>
  <v-app>
<v-main
  class="d-flex flex-column align-center justify-center min-h-screen pa-8 bg-fitai-bright"
>

      <!-- ======== TÍTULO PRINCIPAL ======== -->
<h1 class="nextrep-title mb-8">
  <span class="next">Next</span><span class="rep">Rep</span>
</h1>


      <!-- ======== BUSCADOR ======== -->
      <div class="search-container">
        <v-text-field
          v-model="searchQuery"
          placeholder="Buscar ejercicio..."
          variant="outlined"
          hide-details
          clearable
          class="search-bar"
          prepend-inner-icon="mdi-magnify"
          density="compact"
        ></v-text-field>
      </div>

      <!-- ======== TARJETAS DE EJERCICIOS ======== -->
      <v-container>
        <v-row justify="center" align="center" class="ga-8">
          <v-col
            v-for="exercici in filteredExercicis"
            :key="exercici.nom"
            cols="12"
            sm="6"
            md="4"
            lg="3"
            class="d-flex justify-center"
          >
            <v-hover v-slot="{ isHovering, props }">
              <v-card
                v-bind="props"
                class="exercise-card overflow-hidden"
                elevation="12"
                @click="anarAExercici(exercici.nom)"
              >
                <v-img
                  :src="exercici.imatge"
                  :alt="exercici.label"
                  height="260"
                  cover
                  class="transition-img"
                />

                <!-- Overlay descriptivo -->
                <div v-if="isHovering" class="overlay-description">
                  <p class="text-white text-center px-4">
                    {{ exercici.descripcio }}
                  </p>
                </div>

                <!-- Franja central semitransparente -->
                <div
                  class="exercise-label text-white font-weight-bold text-h5"
                  :class="{ 'shine': isHovering }"
                >
                  {{ exercici.label }}
                </div>
              </v-card>
            </v-hover>
          </v-col>
        </v-row>

        <div
          v-if="filteredExercicis.length === 0"
          class="text-white text-center mt-10"
        >
          No s'han trobat exercicis amb aquest nom.
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
    nom: 'flexiones',
    label: 'Flexions',
    imatge: new URL('@/assets/flexiones.jpg', import.meta.url).href,
    descripcio: 'Treballa pit, braços i espatlles amb aquest exercici clàssic.',
  },
  {
    nom: 'sentadillas',
    label: 'Esquats',
    imatge: new URL('@/assets/sentadilla.jpg', import.meta.url).href,
    descripcio: 'Enforteix cames i glutis amb moviment controlat i profund.',
  },
  {
    nom: 'saltos',
    label: 'Salts',
    imatge: new URL('@/assets/saltos.jpg', import.meta.url).href,
    descripcio: 'Millora la potència explosiva i la coordinació.',
  },
  {
    nom: 'abdominales',
    label: 'Abdominals',
    imatge: new URL('@/assets/abdominales.jpg', import.meta.url).href,
    descripcio: 'Tonifica el teu nucli i enforteix la zona abdominal.',
  },
]

const filteredExercicis = computed(() =>
  exercicis.filter((e) =>
    (e.label + e.descripcio)
      .toLowerCase()
      .includes(searchQuery.value.trim().toLowerCase())
  )
)

const anarAExercici = (nom) => {
  router.push({ name: 'ModoJuego', params: { ejercicio: nom } })
}
</script>

<style scoped>
/* ======== FONDO NEÓN BRILLANTE ======== */
.bg-fitai-bright {
  background:
    radial-gradient(circle at 30% 20%, rgba(147, 51, 234, 0.25) 0%, transparent 45%),
    radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.25) 0%, transparent 45%),
    linear-gradient(135deg, #1a2238, #16213e 50%, #0f172a 100%);
  background-attachment: fixed;
  background-size: cover;
  animation: bgShine 18s ease-in-out infinite;
}

/* Animación sutil de respiración luminosa */
@keyframes bgShine {
  0% {
    filter: brightness(1);
    background-position: 0% 50%;
  }
  50% {
    filter: brightness(1.25);
    background-position: 100% 50%;
  }
  100% {
    filter: brightness(1);
    background-position: 0% 50%;
  }
}


/* ======== TÍTULO NEXTREP ======== */
.nextrep-title {
  font-size: 4.5rem;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-align: center;
  position: relative;
  color: white;
  text-shadow: 0 4px 15px rgba(0, 0, 0, 0.85);
  margin-bottom: 2.5rem;
  animation: fadeIn 1.2s ease-in-out;
  line-height: 1.1;
  user-select: none;
}

/* Parte “Next” — blanco con sutil brillo azul */
.next {
  color: #ffffff;
  filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.6));
  transition: filter 0.3s ease;
}

/* Parte “Rep” — degradado morado brillante animado */
.rep {
  background: linear-gradient(90deg, #9b6bff, #3b82f6, #9b6bff);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-style: italic;
  position: relative;
  animation: gradientShift 5s ease infinite;
  text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
  transition: filter 0.3s ease;
}

/* Movimiento suave del degradado */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Línea luminosa debajo del título */
.nextrep-title::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 49%;
  width: 315px;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
  transform: translateX(-50%);
  box-shadow: 0 0 18px rgba(139, 92, 246, 0.7);
  animation: pulseGlow 2.5s ease-in-out infinite;
}

/* Animación del brillo de la línea */
@keyframes pulseGlow {
  0%, 100% { opacity: 0.8; box-shadow: 0 0 12px rgba(139, 92, 246, 0.4); }
  50% { opacity: 1; box-shadow: 0 0 20px rgba(139, 92, 246, 0.8); }
}

/* Animación de entrada */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ======== TARJETAS ======== */
.exercise-card {
  width: 100%;
  max-width: 340px;
  height: 230px;
  border-radius: 12px;
  background: #1e1e2f;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}
.exercise-card:hover {
  transform: scale(1.05);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
}

/* Imagen */
.transition-img {
  transition: transform 0.4s ease;
}
.exercise-card:hover .transition-img {
  transform: scale(1.1);
}

/* Overlay descriptivo */
.overlay-description {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 10, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: opacity 0.4s ease;
}

/* Franja morada central */
.exercise-label {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  transform: translateY(-50%);
  background: rgba(139, 92, 246, 0.55);
  text-align: center;
  padding: 10px 0;
  letter-spacing: 1px;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
}

/* ======== BUSCADOR ======== */
.search-container {
  display: flex;
  justify-content: center;
  width: 53%;
  margin-bottom: 2.5rem;
}
.search-bar {
  width: 260px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: white;
  transition: all 0.3s ease;
}
.search-bar .v-field__input {
  color: white !important;
  font-size: 0.95rem;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  min-height: 34px !important;
}
.search-bar:hover {
  background: rgba(255, 255, 255, 0.15);
}
.search-bar:focus-within {
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
}

/* Efecto brillo */
.shine {
  position: relative;
  overflow: hidden;
}
.shine::after {
  content: '';
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    120deg,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(255, 255, 255, 0.3) 100%
  );
  transform: skewX(-20deg);
  animation: shineMove 1s forwards;
}
@keyframes shineMove {
  to {
    left: 125%;
  }
}

/* ======== ANIMACIONES ======== */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ======== OTROS ======== */
.min-h-screen {
  min-height: 100vh;
}
</style>