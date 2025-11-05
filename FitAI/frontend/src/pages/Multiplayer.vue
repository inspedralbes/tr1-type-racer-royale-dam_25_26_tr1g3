<template>
  <v-app>
    <v-main class="d-flex flex-column align-center justify-center pa-8 bg-fitai-bright" style="min-height: 100vh">
      <v-card class="pa-6 rounded-2xl elevation-12 glass-card" max-width="500">
        <v-card-title class="text-h4 text-center font-weight-bold nextrep-title mb-4">
          <span class="next">Multijugador —</span> <span class="rep">{{ exercici }}</span>
        </v-card-title>

        <v-divider class="divider-glow mx-auto my-6"></v-divider>

        <v-card-text>
          <div v-if="!aSala" class="text-center">
            <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4 glass-alert">
              {{ errorMsg }}
            </v-alert>

            <v-btn class="neon-btn mb-4" variant="elevated" size="large" block @click="crearSala">
              <v-icon start>mdi-plus-circle-outline</v-icon>
              Crear nova sala
            </v-btn>

            <v-text-field label="Codi de sala" v-model="codiSalaInput" variant="solo-filled" clearable
              density="comfortable" prepend-inner-icon="mdi-key" maxlength="5" class="search-bar mb-2"
              @input="codiSalaInput = codiSalaInput.toUpperCase().slice(0, 5)" />

            <v-btn class="neon-btn-green mt-2" variant="elevated" size="large" block @click="unirSala">
              <v-icon start>mdi-login</v-icon>
              Unir-se a una sala
            </v-btn>

            <v-btn variant="text" class="mt-4 text-white" block @click="tornarEnrere">
              <v-icon start>mdi-arrow-left</v-icon>
              Tornar enrere
            </v-btn>
          </div>

          <div v-else class="text-center text-white">
            <p class="text-h6 font-weight-medium mb-1">
              Sala: <strong class="rep">{{ codiSala }}</strong>
            </p>

            <p class="text-body-2 text-grey-lighten-2 mb-4">
              Jugadors connectats: <strong>{{ jugadors.length }}</strong>
            </p>

            <v-card class="rounded-xl mb-4 pa-2 elevation-6 glass-list">
              <v-list density="compact">
                <v-list-item v-for="j in jugadors" :key="j" class="rounded-lg my-1"
                  :class="j === hostId ? 'bg-host' : 'bg-player'">
                  <v-list-item-content class="d-flex align-center justify-space-between text-white">
                    <span class="text-body-1">
                      <v-icon v-if="j === hostId" color="#8b5cf6" class="mr-2">
                        mdi-crown
                      </v-icon>
                      {{ j }}
                    </span>
                    <span v-if="j === userId" class="text-caption text-grey-lighten-1">
                      (Tu)
                    </span>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card>

            <v-btn v-if="userId === hostId" class="neon-btn mb-3" variant="elevated" size="large" block
              :disabled="jugadors.length < 2" @click="iniciarPartida">
              <v-icon start>mdi-play-circle</v-icon>
              Iniciar partida
            </v-btn>

            <v-btn class="neon-btn-red mb-2" variant="outlined" size="large" block @click="sortirManual">
              <v-icon start>mdi-exit-to-app</v-icon>
              Sortir de la sala
            </v-btn>

            <v-btn variant="text" class="mt-3 text-white" block @click="tornarEnrere">
              <v-icon start>mdi-arrow-left</v-icon>
              Tornar enrere
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
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
const errorMsg = ref("");

onBeforeUnmount(() => {
  sortirSala();
  if (socket) socket.close();
});

function generarCodiSala() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codi = "";
  for (let i = 0; i < 5; i++) {
    codi += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codi;
}

async function crearSala() {
  try {
    const codi = generarCodiSala();
    const sessionId = `${exercici}-${codi}`;
    connectToSession(sessionId, true);
  } catch (err) {
    errorMsg.value = "Error en crear la sala.";
  }
}

async function unirSala() {
  if (!codiSalaInput.value.trim()) return;
  const sessionId = `${exercici}-${codiSalaInput.value.trim().toUpperCase()}`;
  errorMsg.value = "";

  try {
    const res = await fetch(`http://localhost:4000/check-session/${sessionId}`);

    if (!res.ok) {
      errorMsg.value = "Sala no trobada. Comprova el codi i torna-ho a intentar.";
      sortirSala();
      return;
    }

    connectToSession(sessionId);
  } catch (err) {
    errorMsg.value = "Error en la connexió amb el servidor.";
    sortirSala();
  }
}

function connectToSession(sessionId, isHost = false) {
  socket = new WebSocket(WS_URL);

  socket.addEventListener("open", () => {
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
    }
  });

  socket.addEventListener("close", () => {
    aSala.value = false;
  });
}

function sortirSala() {
  if (socket) {
    try {
      socket.send(JSON.stringify({ type: "leave" }));
      socket.close();
    } catch (e) { }
    socket = null;
  }

  aSala.value = false;
  codiSala.value = "";
  jugadors.value = [];
  hostId.value = "";
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
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.nextrep-title {
  font-size: 2.2rem;
  font-weight: 900;
  text-transform: uppercase;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.85);
  user-select: none;
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
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.divider-glow {
  max-width: 85%;
  height: 2px;
  border-radius: 4px;
  background: linear-gradient(90deg, transparent 0%, #3b82f6, #8b5cf6, #3b82f6, transparent 100%);
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
  opacity: 0.7;
}

.glass-card {
  background: rgba(30, 30, 47, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  color: white;
}

.glass-list {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(6px);
}

.bg-host {
  background: rgba(59, 130, 246, 0.3);
}

.bg-player {
  background: rgba(139, 92, 246, 0.2);
}

.neon-btn {
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  color: white;
  border-radius: 12px;
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.6);
  transition: all 0.3s ease;
}

.neon-btn:hover {
  box-shadow: 0 0 25px rgba(139, 92, 246, 0.9);
  transform: scale(1.03);
}

.neon-btn-green {
  background: linear-gradient(90deg, #22c55e, #3b82f6);
  color: white;
  border-radius: 12px;
  box-shadow: 0 0 15px rgba(34, 197, 94, 0.6);
  transition: all 0.3s ease;
}

.neon-btn-green:hover {
  box-shadow: 0 0 25px rgba(34, 197, 94, 0.9);
  transform: scale(1.03);
}

.neon-btn-red {
  border-color: rgba(239, 68, 68, 0.6);
  color: #ef4444;
  transition: all 0.3s ease;
}

.neon-btn-red:hover {
  background: rgba(239, 68, 68, 0.1);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.7);
}

.search-bar .v-field__input {
  color: white !important;
}

.search-bar .v-field__overlay {
  background-color: rgba(255, 255, 255, 0.1) !important;
  transition: background-color 0.4s ease;
}

.search-bar:hover .v-field__overlay {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

.search-bar .v-icon {
  color: #8b5cf6 !important;
}
</style>