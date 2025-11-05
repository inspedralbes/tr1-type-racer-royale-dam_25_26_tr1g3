<template>
  <v-app>
    <v-main class="d-flex align-center justify-center pa-4 bg-fitai-deep-space">
      <v-container
        class="rounded-3xl pa-6 pa-sm-10 elevation-20 bg-glass expanded-container"
        style="max-width: 600px; backdrop-filter: blur(20px); border: 2px solid rgba(255, 255, 255, 0.08);"
      >
        <v-row class="justify-center text-center">
          <v-col cols="12">
            <!-- Título del ejercicio (Animado Neón) -->
            <h1 class="text-h4 font-weight-bold text-purple-lighten-4 mb-2 exercise-title">
              🏋️ MULTIJUGADOR — {{ exerciciLabel }}
            </h1>
            <v-divider class="my-5" color="rgba(139, 92, 246, 0.3)"></v-divider>
          </v-col>

          <!-- SIN SALA (Crear o Unirse) -->
          <v-col cols="12" v-if="!aSala">
            <v-btn
              color="#8b5cf6"
              variant="flat"
              size="large"
              class="main-btn mb-6 neonglow-purple"
              block
              rounded="lg"
              elevation="6"
              @click="crearSala"
            >
              <v-icon start>mdi-plus-circle-outline</v-icon>
              Crear nova sala
            </v-btn>

            <v-text-field
              label="Codi de sala"
              v-model="codiSalaInput"
              variant="outlined"
              color="#3b82f6"
              prepend-inner-icon="mdi-key"
              clearable
              hide-details
              class="mb-5 rounded-lg text-white"
              style="border-color: rgba(59, 130, 246, 0.5);"
              bg-color="rgba(255, 255, 255, 0.05)"
            />

            <v-btn
              color="#3b82f6"
              variant="flat"
              size="large"
              class="main-btn mb-8 neonglow-blue"
              block
              rounded="lg"
              elevation="6"
              @click="unirSala"
            >
              <v-icon start>mdi-login</v-icon>
              Unir-se a una sala
            </v-btn>

            <v-btn
              color="grey-lighten-1"
              variant="text"
              size="large"
              block
              rounded
              class="back-btn-subtle"
              @click="tornarEnrere"
            >
              <v-icon start>mdi-arrow-left</v-icon>
              Tornar enrere
            </v-btn>
          </v-col>

          <!-- EN SALA (Lista de Jugadores) -->
          <v-col cols="12" v-else>
            <v-card
              class="rounded-xl pa-6 text-center bg-light-card room-card"
              elevation="6"
            >
              <h2 class="text-h5 font-weight-bold text-purple-lighten-2 mb-2">
                SALA: <span class="text-teal-accent-3 code-text">{{ codiSala }}</span>
              </h2>
              <p class="text-body-2 text-grey-lighten-3 mb-5">
                Jugadors connectats: <strong>{{ jugadors.length }}</strong>
              </p>

              <v-list class="text-grey-lighten-4 bg-transparent player-list" density="comfortable">
                <v-list-item
                  v-for="j in jugadors"
                  :key="j"
                  class="rounded-lg mb-2 px-3 py-2 list-item-glow"
                  :class="j === hostId ? 'bg-host' : 'bg-player'"
                  style="border: 1px solid rgba(255, 255, 255, 0.08);"
                >
                  <v-list-item-content class="d-flex align-center justify-space-between">
                    <span class="text-body-1 d-flex align-center font-weight-medium">
                      <v-icon
                        v-if="j === hostId"
                        color="yellow-accent-4"
                        class="mr-2"
                        size="small"
                      >
                        mdi-crown
                      </v-icon>
                      {{ j }}
                    </span>
                    <span v-if="j === userId" class="text-caption text-teal-accent-3">(Tu)</span>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card>

            <v-btn
              v-if="userId === hostId"
              color="#8b5cf6"
              variant="flat"
              class="main-btn mt-6 neonglow-purple"
              size="large"
              block
              rounded="lg"
              elevation="6"
              :disabled="jugadors.length < 2"
              @click="iniciarPartida"
            >
              <v-icon start>mdi-play-circle</v-icon>
              Iniciar partida ({{ jugadors.length }}/2)
            </v-btn>
             <v-alert
               v-else-if="userId !== hostId"
               type="info"
               variant="tonal"
               class="mt-6 text-body-2"
               density="compact"
               color="#3b82f6"
             >
               Esperant que l'amfitrió ({{ hostId.substring(0, 10) }}...) iniciï la partida.
             </v-alert>


            <v-btn
              color="red-darken-1"
              variant="outlined"
              class="main-btn mt-4 exit-btn"
              size="large"
              block
              rounded="lg"
              @click="sortirManual"
            >
              <v-icon start>mdi-exit-to-app</v-icon>
              Sortir de la sala
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const exercici = route.params.ejercicio;

const WS_URL = "ws://localhost:4000";

let socket = null;
const aSala = ref(false);
const codiSala = ref("");
const codiSalaInput = ref("");
const jugadors = ref([]);
const hostId = ref("");
const userId = crypto.randomUUID();

onBeforeUnmount(() => {
  sortirSala();
  if (socket) socket.close();
});

async function crearSala() {
  try {
    const res = await fetch("http://localhost:4000/create-session");
    const data = await res.json();
    if (data.sessionId) {
      connectToSession(`${exercici}-${data.sessionId}`, true);
    }
  } catch (err) {
    alert("Error en crear la sala");
  }
}

function unirSala() {
  if (!codiSalaInput.value.trim()) {
    alert("Introdueix un codi de sala vàlid");
    return;
  }
  connectToSession(codiSalaInput.value.trim());
}

function connectToSession(sessionId, isHost = false) {
  socket = new WebSocket(WS_URL);

  socket.addEventListener("open", () => {
    console.log("🔌 Connectat al servidor WS");
    codiSala.value = sessionId;
    aSala.value = true;
    hostId.value = isHost ? userId : "";
    socket.send(JSON.stringify({ type: "join", sessionId, userId }));
  });

  socket.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "leaderboard") {
      jugadors.value = msg.leaderboard.map((p) => p.userId);
      if (!hostId.value && msg.leaderboard.length > 0) {
        hostId.value = msg.leaderboard[0].userId;
      }
    } else if (msg.error) {
      alert(msg.error);
    }
  });

  socket.addEventListener("close", () => {
    aSala.value = false;
  });
}

function sortirSala() {
  if (socket && aSala.value) {
    socket.send(JSON.stringify({ type: "leave" }));
    socket.close();
  }
  aSala.value = false;
  codiSala.value = "";
  jugadors.value = [];
}

function sortirManual() {
  sortirSala();
}

function iniciarPartida() {
  router.push(`/joc-solo/${exercici}`);
}

function tornarEnrere() {
  router.back();
}
</script>

<style scoped>
/* ==================================== */
/* ======== FONDO Y LAYOUT (DEEP SPACE) ======== */
/* ==================================== */
.bg-fitai-deep-space {
  /* Fondo oscuro dinámico con brillo sutil */
  background:
    radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
    radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 40%),
    linear-gradient(135deg, #0e111d, #141829 50%, #0e111d 100%);
  background-attachment: fixed;
  background-size: cover;
}

.bg-glass {
  /* Contenedor principal glassy */
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
}

/* ==================================== */
/* ======== TÍTULO (NEON ANIMADO) ======== */
/* ==================================== */
.exercise-title {
  font-size: 1.5rem; /* Ajuste para móvil */
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: linear-gradient(90deg, #8b5cf6, #3b82f6, #00ffaa); /* Mezcla de colores neón */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradientShift 6s ease infinite;
  text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}
@media (min-width: 600px) {
  .exercise-title {
    font-size: 1.8rem;
  }
}
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ==================================== */
/* ======== BOTONES DE ACCIÓN (NEON GLOW) ======== */
/* ==================================== */
.main-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 700;
  letter-spacing: 0.5px;
  border-radius: 8px !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}

.main-btn:disabled {
    opacity: 0.6;
    box-shadow: none !important;
}

/* Neón Morado (Crear Sala / Iniciar) */
.neonglow-purple {
    background: #8b5cf6 !important;
}
.neonglow-purple:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 0 20px rgba(139, 92, 246, 1), 0 8px 15px rgba(0, 0, 0, 0.5);
}

/* Neón Azul (Unirse a Sala) */
.neonglow-blue {
    background: #3b82f6 !important;
}
.neonglow-blue:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 0 20px rgba(59, 130, 246, 1), 0 8px 15px rgba(0, 0, 0, 0.5);
}

.exit-btn {
    border-color: rgba(239, 68, 68, 0.5) !important;
    color: #ef4444 !important;
    font-weight: 500;
}
.exit-btn:hover {
    background-color: rgba(239, 68, 68, 0.1) !important;
    transform: none;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
}

.back-btn-subtle {
    color: #a0a0b9 !important;
}
.back-btn-subtle:hover {
    color: white !important;
    background-color: rgba(255, 255, 255, 0.05) !important;
}


/* ==================================== */
/* ======== EN SALA CARD (GLASSY) ======== */
/* ==================================== */
.room-card {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 2px solid rgba(139, 92, 246, 0.2) !important;
}
.code-text {
    font-weight: 900;
    letter-spacing: 1px;
    text-shadow: 0 0 8px rgba(0, 255, 170, 0.8);
}

/* LISTA DE JUGADORES */
.player-list {
    background-color: transparent !important;
}
.bg-host {
    background: rgba(255, 215, 0, 0.15) !important; /* Oro más opaco para el host */
    border-left: 4px solid #ffd700 !important;
}
.bg-player {
    background: rgba(255, 255, 255, 0.05) !important;
    border-left: 4px solid transparent !important;
}
.list-item-glow {
    transition: all 0.3s ease;
}
.list-item-glow:hover {
    transform: translateX(4px);
    background: rgba(139, 92, 246, 0.1) !important;
}
</style>