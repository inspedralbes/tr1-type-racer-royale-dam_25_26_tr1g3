<template>
  <v-app>
    <v-main
      class="d-flex flex-column align-center justify-center text-center min-h-screen pa-8"
      style="background: linear-gradient(135deg, #1a2038, #2b3b63, #1a2038);"
    >
      <v-container class="text-center text-white move-up fade-in-container">

        <!-- Título del ejercicio -->
        <h2 class="exercise-title mb-4">
          {{ exerciciLabel }}
        </h2>

        <!-- Subtítulo -->
        <p class="subtitle mb-12">
          Vols jugar sol o multijugador?
        </p>

        <!-- Opciones -->
        <v-row justify="center" align="center" class="gap-10 mt-n4">
          <v-col cols="12" sm="6" md="4" lg="3" class="d-flex justify-center">
            <v-card
              class="option-card solo-card d-flex flex-column align-center justify-center"
              elevation="14"
              height="200"
              width="300"
              @click="jugarSol"
            >
              <div class="option-title">Mode Sol</div>
              <p class="option-desc">
                Entrena al teu ritme i millora les teves marques.
              </p>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4" lg="3" class="d-flex justify-center">
            <v-card
              class="option-card multi-card d-flex flex-column align-center justify-center"
              elevation="14"
              height="200"
              width="300"
              @click="jugarMultijugador"
            >
              <div class="option-title">Multijugador</div>
              <p class="option-desc">
                Reta els teus amics i competeix en temps real.
              </p>
            </v-card>
          </v-col>
        </v-row>

        <!-- Botón volver -->
        <div class="text-center mt-12">
          <v-btn
            class="back-btn text-subtitle-1 font-weight-bold"
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

const nombres = {
  flexiones: 'Flexions',
  sentadillas: 'Squats',
  saltos: 'Salts',
  abdominales: 'Abdominals',
}

const exerciciLabel = nombres[exercici] || 'Exercici'

const jugarSol = async () => {
  try {
    const res = await fetch('http://localhost:4000/create-session')
    const data = await res.json()
    router.push({
      name: 'JuegoSolo',
      params: { ejercicio: exercici, sessionId: data.sessionId },
    })
  } catch (err) {
    alert('Error en crear la sessió: ' + err.message)
  }
}

const jugarMultijugador = () => {
  router.push({ name: 'Multiplayer', params: { ejercicio: exercici } })
}
</script>

<style scoped>
/* ======== ANIMACIONES ======== */
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
.fade-in-container {
  animation: fadeInUp 0.8s ease-out forwards;
}

/* ======== TÍTULO ======== */
.exercise-title {
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 1px;
  color: #ffffff;
  text-transform: uppercase;
  text-shadow: 0 4px 15px rgba(0, 0, 0, 0.603);
  background: linear-gradient(90deg, #9b6bff, #3b4ef6, #8851ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradientShift 6s ease infinite;
  position: relative;
}
.exercise-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  width: 120px;
  height: 3px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.8);
  animation: pulseGlow 2.5s infinite ease-in-out;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.8; box-shadow: 0 0 12px rgba(139, 92, 246, 0.4); }
  50% { opacity: 1; box-shadow: 0 0 20px rgba(139, 92, 246, 0.8); }
}

/* ======== SUBTÍTULO ======== */
.subtitle {
  font-size: 1.25rem;
  color: #d1d5db;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}

/* ======== CARTAS ======== */
.option-card {
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.35s ease;
  color: white;
  backdrop-filter: blur(12px);
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.option-title {
  font-size: 1.6rem;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.option-desc {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  max-width: 85%;
}

/* --- MODO SOLO --- */
.solo-card {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.4);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}
.solo-card:hover {
  transform: scale(1.07);
  background: rgba(59, 130, 246, 0.35);
  box-shadow: 0 10px 40px rgba(59, 130, 246, 0.7);
}

/* --- MULTIJUGADOR --- */
.multi-card {
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.4);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
}
.multi-card:hover {
  transform: scale(1.07);
  background: rgba(139, 92, 246, 0.35);
  box-shadow: 0 10px 40px rgba(139, 92, 246, 0.7);
}

/* ======== BOTÓN “TORNAR A L'INICI” ======== */
.back-btn {
  border: 2px solid rgb(255, 255, 255);
  border-radius: 14px;
  padding: 7px 36px;
  transition: all 0.35s ease;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}
.back-btn:hover {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3));
  box-shadow: 0 0 20px rgba(101, 40, 243, 0.8);
  border-color: transparent;
  transform: scale(1.05);
}

/* ======== POSICIONAMIENTO ======== */
.move-up {
  transform: translateY(-120px);
}

.min-h-screen {
  min-height: 100vh;
}
</style>
