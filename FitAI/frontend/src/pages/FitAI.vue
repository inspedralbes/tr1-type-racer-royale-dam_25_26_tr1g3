<template>
  <v-app>
    <v-main class="pa-6 text-center bg-grey-lighten-4">
      <h1 class="text-h3 font-weight-bold mb-8 text-grey-darken-4">FitAI</h1>

      <v-container>
        <v-row justify="center" align="center" class="ga-6">
          <v-col
            v-for="ejercicio in ejercicios"
            :key="ejercicio.nombre"
            cols="12"
            sm="4"
            md="3"
          >
            <v-hover v-slot="{ isHovering, props }">
              <v-card
                v-bind="props"
                class="mx-auto rounded-lg transition-smooth"
                elevation="4"
                height="160"
                width="160"
                @click="irAEjercicio(ejercicio.nombre)"
              >
                <v-img
                  :src="ejercicio.imagen"
                  :alt="ejercicio.nombre"
                  cover
                  height="160"
                  width="160"
                >
                  <template v-slot:default>
                    <div
                      v-if="isHovering"
                      class="absolute inset-0 d-flex align-center justify-center bg-black bg-opacity-40"
                    >
                      <span class="text-h6 text-white font-weight-bold">
                        {{ ejercicio.label }}
                      </span>
                    </div>
                  </template>
                </v-img>
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

const ejercicios = [
  { nombre: 'flexiones', label: 'Flexiones', imagen: new URL('@/assets/flexiones.jpg', import.meta.url).href },
  { nombre: 'sentadillas', label: 'Sentadillas', imagen: new URL('@/assets/sentadilla.jpg', import.meta.url).href },
  { nombre: 'saltos', label: 'Saltos', imagen: new URL('@/assets/saltos.jpg', import.meta.url).href },
  { nombre: 'abdominales', label: 'Abdominales', imagen: new URL('@/assets/abdominales.jpg', import.meta.url).href }, // 👈 NUEVA LÍNEA
]


const irAEjercicio = (nombre) => {
  router.push({ name: 'ModoJuego', params: { ejercicio: nombre } })
}
</script>

<style scoped>
.transition-smooth {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;
}

.transition-smooth:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}
</style>