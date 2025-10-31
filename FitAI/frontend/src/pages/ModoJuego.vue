<template>
  <v-app>
    <v-main
      class="d-flex flex-column align-center justify-center text-center min-h-screen pa-8"
      style="background: linear-gradient(135deg, #141e30, #243b55);"
    >
      <v-container class="text-center text-white move-up">
        <!-- Títol -->
        <h2 class="text-h3 font-weight-bold mb-4 drop-shadow-lg animate-fade">
          {{ exerciciLabel }}
        </h2>

        <p class="text-h6 mb-12 text-grey-lighten-3 animate-fade-delay">
          Vols jugar sol o en mode multijugador?
        </p>

        <!-- Opcions de joc -->
        <v-row justify="center" align="center" class="gap-6 mt-n4">
          <!-- Mode Sol -->
          <v-col cols="12" sm="5" md="3" class="d-flex justify-center">
            <v-card
              class="option-card pa-8 text-center solo-card"
              elevation="10"
              height="140"
              width="240"
              @click="jugarSol"
            >
              <div class="text-h5 font-weight-bold text-white mb-2">
                Mode Sol
              </div>
              <p class="text-body-2 text-grey-lighten-3">
                Entrena al teu ritme i millora les teves marques.
              </p>
            </v-card>
          </v-col>

          <!-- Mode Multijugador -->
          <v-col cols="12" sm="5" md="3" class="d-flex justify-center">
            <v-card
              class="option-card pa-8 text-center multi-card"
              elevation="10"
              height="140"
              width="240"
              @click="jugarMultijugador"
            >
              <div class="text-h5 font-weight-bold text-white mb-2">
                Multijugador
              </div>
              <p class="text-body-2 text-grey-lighten-3">
                Repta els teus amics i competeix en temps real.
              </p>
            </v-card>
          </v-col>
        </v-row>

        <!-- Botó tornar -->
        <div class="d-flex justify-center">
          <v-btn
            class="mt-10 px-8 py-4 text-subtitle-1 font-weight-bold centered-btn"
            variant="outlined"
            color="white"
            @click="$router.push('/')"
          >
            Tornar a l'inici
          </v-btn>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const exercici = route.params.ejercicio

const noms = {
  flexiones: 'Flexions',
  sentadillas: 'Sentadilles',
  saltos: 'Sals',
  abdominales: 'Abdominals',
}

const exerciciLabel = noms[exercici] || 'Exercici'

const jugarSol = () => {
  router.push({ name: 'JuegoSolo', params: { ejercicio: exercici } })
}

const jugarMultijugador = () => {
  alert(`Has triat mode multijugador: ${exerciciLabel}`)
}
</script>

<style scoped>
.move-up {
  transform: translateY(-160px);
}

/* ----- TARJETES ----- */
.option-card {
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  color: white;
  backdrop-filter: blur(8px);
}

/* 🔵 Mode Sol */
.solo-card {
  background: rgba(33, 150, 243, 0.25);
  border: 1px solid rgba(33, 150, 243, 0.4);
}
.solo-card:hover {
  transform: scale(1.05);
  background: rgba(33, 150, 243, 0.45);
  box-shadow: 0 8px 25px rgba(33, 150, 243, 0.6);
}

/* 🟣 Mode Multijugador */
.multi-card {
  background: rgba(156, 39, 176, 0.25);
  border: 1px solid rgba(156, 39, 176, 0.4);
}
.multi-card:hover {
  transform: scale(1.05);
  background: rgba(156, 39, 176, 0.45);
  box-shadow: 0 8px 25px rgba(156, 39, 176, 0.6);
}

.centered-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  letter-spacing: 0.5px;
}

.drop-shadow-lg {
  text-shadow: 0px 3px 6px rgba(0, 0, 0, 0.6);
}

.min-h-screen {
  min-height: 100vh;
}

/* Animacions */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade {
  animation: fadeInUp 0.6s ease forwards;
}

.animate-fade-delay {
  animation: fadeInUp 0.9s ease forwards;
}
</style>
