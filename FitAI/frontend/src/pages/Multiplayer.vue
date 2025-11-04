<template>
  <v-app>
    <v-main
      class="d-flex align-center justify-center pa-10"
      style="min-height: 100vh; background: linear-gradient(135deg, #201f3a, #3b2d72, #5c2fa0);"
    >
      <v-container
        class="rounded-2xl pa-10 elevation-12 bg-glass"
        style="max-width: 700px; backdrop-filter: blur(18px);"
      >
        <v-row class="justify-center text-center">
          <v-col cols="12">
            <h1 class="text-h4 font-weight-bold text-purple-lighten-4 mb-2 drop-title">
              🏋️ Multijugador — {{ exercici }}
            </h1>
            <v-divider class="my-5" color="purple-lighten-2"></v-divider>
          </v-col>

          <!-- SIN SALA -->
          <v-col cols="12" v-if="!aSala">
            <v-btn
              color="deep-purple-accent-3"
              variant="elevated"
              size="large"
              class="main-btn mb-6"
              block
              rounded
              @click="crearSala"
            >
              <v-icon start>mdi-plus-circle-outline</v-icon>
              Crear nova sala
            </v-btn>

            <v-text-field
              label="Codi de sala"
              v-model="codiSalaInput"
              variant="outlined"
              color="deep-purple-accent-2"
              prepend-inner-icon="mdi-key"
              clearable
              hide-details
              class="mb-5 rounded-xl"
            />

            <v-btn
              color="green-accent-4"
              variant="elevated"
              size="large"
              class="main-btn mb-6"
              block
              rounded
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
              @click="tornarEnrere"
            >
              <v-icon start>mdi-arrow-left</v-icon>
              Tornar enrere
            </v-btn>
          </v-col>

          <!-- EN SALA -->
          <v-col cols="12" v-else>
            <v-card
              class="rounded-xl pa-6 text-center bg-light-card"
              elevation="6"
              style="border: 1px solid rgba(255,255,255,0.1);"
            >
              <h2 class="text-h5 font-weight-medium text-purple-lighten-4 mb-2">
                Sala: <span class="text-green-accent-3">{{ codiSala }}</span>
              </h2>
              <p class="text-body-2 text-grey-lighten-1 mb-5">
                Jugadors connectats: <strong>{{ jugadors.length }}</strong>
              </p>

              <v-list class="text-grey-lighten-4" density="comfortable">
                <v-list-item
                  v-for="j in jugadors"
                  :key="j"
                  class="rounded-lg mb-2 px-3 py-2"
                  :class="j === hostId ? 'bg-top1' : 'bg-top2'"
                >
                  <v-list-item-content class="d-flex align-center justify-space-between">
                    <span class="text-body-1 d-flex align-center">
                      <v-icon
                        v-if="j === hostId"
                        color="deep-purple-accent-3"
                        class="mr-2"
                      >
                        mdi-crown
                      </v-icon>
                      {{ j }}
                    </span>
                    <span v-if="j === userId" class="text-caption text-grey-lighten-1">(Tu)</span>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card>

            <v-btn
              v-if="userId === hostId"
              color="deep-purple-accent-3"
              variant="elevated"
              class="main-btn mt-6"
              size="large"
              block
              rounded
              :disabled="jugadors.length < 2"
              @click="iniciarPartida"
            >
              <v-icon start>mdi-play-circle</v-icon>
              Iniciar partida
            </v-btn>

            <v-btn
              color="red-darken-2"
              variant="outlined"
              class="main-btn mt-4"
              size="large"
              block
              rounded
              @click="sortirManual"
            >
              <v-icon start>mdi-exit-to-app</v-icon>
              Sortir de la sala
            </v-btn>

            <v-btn
              color="grey-lighten-1"
              variant="text"
              size="large"
              block
              rounded
              class="mt-4"
              @click="tornarEnrere"
            >
              <v-icon start>mdi-arrow-left</v-icon>
              Tornar enrere
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
.bg-glass {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.bg-light-card {
  background: rgba(255, 255, 255, 0.06);
}

.drop-title {
  text-shadow: 0px 3px 10px rgb(0, 0, 0);
}

.main-btn {
  transition: all 0.3s ease;
  font-weight: 600;
  letter-spacing: 0.4px;
}
.main-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(123, 97, 255, 0.4);
}

.bg-top1 {
  background: rgba(100, 255, 150, 0.08);
}
.bg-top2 {
  background: rgba(255, 255, 255, 0.02);
}
</style>
