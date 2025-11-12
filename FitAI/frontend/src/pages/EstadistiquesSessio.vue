<template>
  <v-app>
    <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
      <v-container class="text-center text-white pa-4" style="max-width: 800px;">
        <v-card class="rounded-xl pa-6" elevation="10" style="backdrop-filter: blur(10px); background: rgba(0, 0, 0, 0.4);">
          <h2 class="text-h5 font-weight-bold mb-4 text-teal-accent-3">📊 Estadístiques de la sessió</h2>

          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <v-card class="pa-4 rounded-xl" color="rgba(139,92,246,0.1)">
                <h3 class="text-h6 font-weight-bold mb-2">Exercici</h3>
                <p class="text-h6">{{ exerciciLabel }}</p>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card class="pa-4 rounded-xl" color="rgba(59,130,246,0.1)">
                <h3 class="text-h6 font-weight-bold mb-2">Repeticions totals</h3>
                <p class="text-h6">{{ reps }}</p>
              </v-card>
            </v-col>
          </v-row>

          <v-btn
            color="#8b5cf6"
            class="mt-6"
            large
            rounded
            @click="$router.back()"
          >
            Tornar
          </v-btn>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const reps = route.params.reps || 0
const exercici = route.params.ejercicio || 'EXERCICI'

const noms = {
  Flexions: 'FLEXIONS',
  Squats: 'SQUATS',
  Salts: 'SALTS',
  Abdominals: 'ABDOMINALS',
  Fons: 'FONS',
  Pujades: 'PUJADES',
  flexiones: 'FLEXIONS',
  sentadillas: 'ESQUATS',
  saltos: 'SALTS',
  abdominales: 'ABDOMINALS',
  fons: 'FONS',
  pujades: 'PUJADES',
}

const exerciciLabel = noms[exercici] || exercici
</script>

<style scoped>
.bg-fitai-deep-space {
  background:
    radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
    radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 40%),
    linear-gradient(135deg, #0e111d, #141829 50%, #0e111d 100%);
  background-attachment: fixed;
  background-size: cover;
  min-height: 100vh;
}
</style>
