<template>
  <v-container
    class="d-flex align-center justify-center pa-8"
    style="min-height: 100vh; background: linear-gradient(135deg, #1e1e2f, #2a2a4f, #3a0ca3);"
  >
    <v-card
      class="pa-6 rounded-xl elevation-10"
      max-width="500"
      style="background-color: #fff; border: 1px solid #e0e0e0;"
    >
      <v-card-title class="text-h5 text-center font-weight-bold text-deep-purple-darken-3">
        🏋️ Multijugador — {{ exercici }}
      </v-card-title>

      <v-divider class="my-3"></v-divider>

      <v-card-text>
        <!-- Sense sala -->
        <div v-if="!aSala" class="text-center">
          <v-btn
            color="deep-purple-accent-4"
            variant="elevated"
            size="large"
            class="mb-4"
            block
            @click="crearSala"
          >
            <v-icon start>mdi-plus-circle-outline</v-icon>
            Crear nova sala
          </v-btn>

          <v-text-field
            label="Codi de sala"
            v-model="codiSalaInput"
            variant="outlined"
            clearable
            density="comfortable"
            prepend-inner-icon="mdi-key"
          />

          <v-btn
            color="green-accent-4"
            variant="elevated"
            size="large"
            class="mt-2"
            block
            @click="unirSala"
          >
            <v-icon start>mdi-login</v-icon>
            Unir-se a una sala
          </v-btn>

          <v-btn
            color="grey-darken-1"
            variant="text"
            class="mt-4"
            block
            @click="tornarEnrere"
          >
            <v-icon start>mdi-arrow-left</v-icon>
            Tornar enrere
          </v-btn>
        </div>

        <!-- En sala -->
        <div v-else class="text-center">
          <p class="text-h6 font-weight-medium mb-1">
            Sala: <strong class="text-deep-purple-darken-2">{{ codiSala }}</strong>
          </p>

          <p class="text-body-2 text-grey-darken-1 mb-4">
            Jugadors connectats: <strong>{{ jugadors.length }}</strong>
          </p>

          <v-card
            class="rounded-lg mb-4 pa-2"
            elevation="4"
            color="#f9f9ff"
            style="border: 1px solid #ddd;"
          >
            <v-list density="compact">
              <v-list-item
                v-for="j in jugadors"
                :key="j"
                class="rounded-lg my-1"
                :class="j === hostId ? 'bg-green-lighten-5' : ''"
              >
                <v-list-item-content class="d-flex align-center justify-space-between">
                  <span class="text-body-1">
                    <v-icon
                      v-if="j === hostId"
                      color="deep-purple-accent-4"
                      class="mr-2"
                    >
                      mdi-crown
                    </v-icon>
                    {{ j }}
                  </span>
                  <span v-if="j === userId" class="text-caption text-grey">
                    (Tu)
                  </span>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card>

          <v-btn
            v-if="userId === hostId"
            color="deep-purple-accent-4"
            variant="elevated"
            class="mb-2"
            size="large"
            block
            :disabled="jugadors.length < 2"
            @click="iniciarPartida"
          >
            <v-icon start>mdi-play-circle</v-icon>
            Iniciar partida
          </v-btn>

          <v-btn
            color="error"
            variant="outlined"
            size="large"
            block
            @click="sortirManual"
          >
            <v-icon start>mdi-exit-to-app</v-icon>
            Sortir de la sala
          </v-btn>

          <v-btn
            color="grey-darken-1"
            variant="text"
            class="mt-3"
            block
            @click="tornarEnrere"
          >
            <v-icon start>mdi-arrow-left</v-icon>
            Tornar enrere
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
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
    alert("❌ Error en crear la sala");
  }
}

function unirSala() {
  if (!codiSalaInput.value.trim()) {
    alert("⚠️ Introdueix un codi de sala vàlid");
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
    console.log("📨 Missatge:", msg);

    if (msg.type === "leaderboard") {
      jugadors.value = msg.leaderboard.map((p) => p.userId);
      if (!hostId.value && msg.leaderboard.length > 0) {
        hostId.value = msg.leaderboard[0].userId; // primer usuari = host
      }
    } else if (msg.error) {
      alert(msg.error);
    }
  });

  socket.addEventListener("close", () => {
    console.log("❌ Connexió tancada");
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
  alert(`🎮 Iniciant partida de ${exercici}...`);
  router.push(`/joc-solo/${exercici}`);
}

function tornarEnrere() {
  router.back();
}
</script>

<style scoped>
.v-card-title {
  font-family: "Poppins", sans-serif;
}
.v-btn {
  text-transform: none;
  font-weight: 500;
}
</style>
