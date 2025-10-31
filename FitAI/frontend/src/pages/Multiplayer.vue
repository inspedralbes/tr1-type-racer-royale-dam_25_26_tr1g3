<template>
    <v-container class="pa-6">
        <v-card class="pa-4 mx-auto" max-width="500">
            <v-card-title class="text-h5 text-center">Multijugador</v-card-title>
            <v-card-text>
                <div v-if="!aSala">
                    <v-btn color="primary" class="mr-2" @click="crearSala">
                        Crear Sala
                    </v-btn>
                    <v-text-field label="Codi de sala" v-model="codiSalaInput" class="mt-3" />
                    <v-btn color="success" @click="unirSala">
                        Unir-se a Sala
                    </v-btn>
                </div>

                <div v-else>
                    <p>Ets a la sala <strong>{{ codiSala }}</strong></p>
                    <p>Jugadors connectats: {{ jugadors.length }}</p>
                    <v-list>
                        <v-list-item v-for="j in jugadors" :key="j">{{ j }}</v-list-item>
                    </v-list>

                    <v-btn
                        color="primary"
                        class="mt-4"
                        :disabled="jugadors.length < 2"
                        v-if="socket.id === hostId"
                        @click="iniciarPartida"
                    >
                        INICIAR
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

const aSala = ref(false);
const codiSala = ref("");
const codiSalaInput = ref("");
const jugadors = ref([]);
const hostId = ref("");

onMounted(() => {
    socket.on("jugadorUnit", (llistaJugadors) => {
        jugadors.value = llistaJugadors;
    });

    window.addEventListener("beforeunload", sortirSala);
});

onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", sortirSala);
});

function crearSala() {
    socket.emit("crearSala", (res) => {
        if (res.success) {
            codiSala.value = res.codiSala;
            aSala.value = true;
            jugadors.value = [socket.id];
            hostId.value = socket.id;
        }
    });
}

function unirSala() {
    socket.emit("unirSala", codiSalaInput.value.toUpperCase(), (res) => {
        if (res.success) {
            codiSala.value = res.codiSala;
            aSala.value = true;
        } else {
            alert(res.message);
        }
    });
}

function sortirSala() {
    if (aSala.value) {
        socket.emit("sortirSala", codiSala.value);
    }
}

function iniciarPartida() {
    window.location.href = `/partida/${codiSala.value}`;
}
</script>
