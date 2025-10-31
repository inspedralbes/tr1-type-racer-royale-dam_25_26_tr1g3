<template>
  <v-container class="pa-6">
    <v-card class="pa-4 mx-auto" max-width="500">
      <v-card-title class="text-h5 text-center">
        🏋️ Multijugador: {{ ejercicio }}
      </v-card-title>

      <v-card-text>
        <!-- Pantalla principal -->
        <div v-if="!aSala">
          <v-btn color="primary" class="mr-2" @click="crearSala">
            Crear Sala
          </v-btn>

          <v-text-field
            label="Código de sala"
            v-model="codiSalaInput"
            class="mt-3"
            clearable
          />

          <v-btn color="success" @click="unirSala">
            Unirse a Sala
          </v-btn>
        </div>

        <!-- Dentro de la sala -->
        <div v-else>
          <p class="text-center">
            Estás en la sala <strong>{{ codiSala }}</strong>
          </p>
          <p class="text-center">
            Jugadores conectados: <strong>{{ jugadors.length }}</strong>
          </p>

          <v-list>
            <v-list-item v-for="j in jugadors" :key="j">
              <v-list-item-content>
                {{ j === hostId ? j + ' (Host)' : j }}
              </v-list-item-content>
            </v-list-item>
          </v-list>

          <v-btn
            color="primary"
            class="mt-4"
            :disabled="jugadors.length < 2"
            v-if="userId === hostId"
            @click="iniciarPartida"
          >
            Iniciar partida
          </v-btn>

          <v-btn color="error" class="mt-2" @click="salirManual">
            Salir
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const ejercicio = route.params.ejercicio; // ← viene de /multiplayer/:ejercicio

// URL del servidor WebSocket (ajusta si es necesario)
const WS_URL = "ws://localhost:4000";

let socket = null;
const aSala = ref(false);
const codiSala = ref("");
const codiSalaInput = ref("");
const jugadors = ref([]);
const hostId = ref("");
const userId = crypto.randomUUID(); // ID único por usuario

onBeforeUnmount(() => {
  sortirSala();
  if (socket) socket.close();
});

// === Funciones ===
async function crearSala() {
  try {
    const res = await fetch("http://localhost:4000/create-session");
    const data = await res.json();
    if (data.sessionId) {
      connectToSession(`${ejercicio}-${data.sessionId}`, true);
    }
  } catch (err) {
    alert("❌ Error al crear la sala");
  }
}

function unirSala() {
  if (!codiSalaInput.value.trim()) {
    alert("Introduce un código de sala");
    return;
  }
  connectToSession(codiSalaInput.value.trim());
}

function connectToSession(sessionId, isHost = false) {
  socket = new WebSocket(WS_URL);

  socket.addEventListener("open", () => {
    console.log("🔌 Conectado al servidor WS");
    codiSala.value = sessionId;
    aSala.value = true;
    hostId.value = isHost ? userId : "";
    socket.send(JSON.stringify({ type: "join", sessionId, userId }));
  });

  socket.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    console.log("📨 Mensaje:", msg);

    if (msg.type === "leaderboard") {
      jugadors.value = msg.leaderboard.map((p) => p.userId);
    } else if (msg.error) {
      alert(msg.error);
    }
  });

  socket.addEventListener("close", () => {
    console.log("❌ Conexión cerrada");
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

function salirManual() {
  sortirSala();
}

function iniciarPartida() {
  alert(`🎮 Iniciando partida de ${ejercicio}...`);
  router.push(`/juego-solo/${ejercicio}`);
}
</script>

<style scoped>
p {
  font-family: "Poppins", sans-serif;
  font-size: 16px;
}
</style>
