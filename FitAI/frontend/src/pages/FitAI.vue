<template>
  <v-app>
    <v-main
      class="d-flex flex-column align-center justify-center min-h-screen pa-8"
      style="background: linear-gradient(135deg, #141e30, #243b55);"
    >

    <h1 class="text-h3 font-weight-bold mb-10 text-white text-center drop-shadow-lg">
        FitAI
      </h1>


      <v-container>
        <v-row justify="center" align="center" class="ga-8">
          <v-col
            v-for="exercici in exercicis"
            :key="exercici.nom"
            cols="12"
            sm="6"
            md="3"
            class="d-flex justify-center"
          >
            <v-hover v-slot="{ isHovering, props }">
              <v-card
                v-bind="props"
                class="rounded-2xl overflow-hidden transition-smooth"
                elevation="10"
                height="240"
                width="220"
                @click="anarAExercici(exercici.nom)"
              >

                <v-img
                  :src="exercici.imatge"
                  :alt="exercici.label"
                  cover
                  height="200"
                  class="transition-img"
                />


                <div
                  class="text-center py-2 bg-deep-purple-accent-4 text-white font-weight-bold text-subtitle-1 transition-name"
                  :class="{ 'shine': isHovering }"
                >
                  {{ exercici.label }}
                </div>
              </v-card>
            </v-hover>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const exercicis = [
  { nom: 'flexiones', label: 'Flexions', imatge: new URL('@/assets/flexiones.jpg', import.meta.url).href },
  { nom: 'sentadillas', label: 'Squats', imatge: new URL('@/assets/sentadilla.jpg', import.meta.url).href },
  { nom: 'saltos', label: 'Salts', imatge: new URL('@/assets/saltos.jpg', import.meta.url).href },
  { nom: 'abdominales', label: 'Abdominals', imatge: new URL('@/assets/abdominales.jpg', import.meta.url).href },
]

const anarAExercici = (nom) => {
  router.push({ name: 'ModoJuego', params: { ejercicio: nom } })
}
</script>

<style scoped>

.transition-smooth {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  border-radius: 20px;
  background: white;
}

.transition-smooth:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
}


.transition-img {
  transition: transform 0.4s ease;
}

.transition-smooth:hover .transition-img {
  transform: scale(1.08);
}


.transition-name {
  transition: background 0.4s ease, color 0.4s ease;
}

.shine {
  position: relative;
  overflow: hidden;
}

.shine::after {
  content: "";
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


.drop-shadow-lg {
  text-shadow: 0px 3px 6px rgba(0, 0, 0, 0.6);
}

.min-h-screen {
  min-height: 100vh;
}
</style>