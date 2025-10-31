<template>
  <v-container class="text-center py-10">
    <h2 class="text-h4 font-weight-bold mb-6">
      {{ ejercicioLabel }}
    </h2>

    <p class="mb-8">¿Quieres jugar solo o multijugador?</p>

    <v-row justify="center" class="gap-4">
      <v-col cols="12" sm="4">
        <v-btn color="primary" large block @click="jugarSolo">
          Solo
        </v-btn>
      </v-col>

      <v-col cols="12" sm="4">
        <v-btn color="secondary" large block @click="jugarMultijugador">
          Multijugador
        </v-btn>
      </v-col>
    </v-row>

    <v-btn text class="mt-8" @click="$router.push('/')">
      Volver
    </v-btn>
  </v-container>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const ejercicio = route.params.ejercicio

const nombres = {
  flexiones: 'Flexiones',
  sentadillas: 'Sentadillas',
  saltos: 'Saltos',
  abdominales: 'Abdominales',
}
const ejercicioLabel = nombres[ejercicio] || 'Ejercicio'

const jugarSolo = async () => {
  try {
    const res = await fetch('http://localhost:4000/create-session')
    const data = await res.json()

    router.push({ 
      name: 'JuegoSolo', 
      params: { ejercicio, sessionId: data.sessionId } 
    })
  } catch (err) {
    alert('Error al crear la sesión: ' + err.message)
  }
}

const jugarMultijugador = () => {
  router.push({ name: 'Multiplayer', params: { ejercicio } })
}
</script>
