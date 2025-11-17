<template>
  <v-container
    class="pa-0 pa-sm-4 mb-10"
    :style="{ width: $vuetify.display.mobile ? '100%' : '800px' }"
  >
    <v-divider class="divider-glow mx-auto my-8"></v-divider>
    <h2 class="text-h4 text-center mb-6 text-white ranking-title">
      🔥 Racha de Días Consecutivos
    </h2>
    <div class="d-flex justify-center align-center mb-6">
      <div class="streak-container">
        <v-img
          :src="rachaActual.imagen"
          :alt="`Racha día ${rachaActual.dias}`"
          class="streak-image"
          :width="rachaActual.size"
          :height="rachaActual.size"
        />
        <div class="streak-text text-center mt-3">
          <p class="text-h5 font-weight-bold text-white mb-1">
            {{ rachaActual.dias }} {{ rachaActual.dias === 1 ? 'Día' : 'Días' }}
          </p>
          <p class="text-body-2 text-white text-opacity-75">
            ¡Racha de inicio de sesión!
          </p>
        </div>
      </div>
    </div>
  </v-container>

  <v-dialog
    v-model="showStreakDialog"
    max-width="400"
    persistent
  >
    <v-card class="pa-4 rounded-xl glass-card-futuristic text-center">
      <v-card-title class="text-h5 font-weight-bold text-white">
        ¡Bienvenido de nuevo!
      </v-card-title>
      <v-card-text class="text-white">
        <p class="text-h6 mb-4">Tu racha actual es de:</p>
        <div class="d-flex justify-center align-center mb-4">
          <div class="streak-container-dialog">
            <v-img
              :src="rachaActual.imagen"
              :alt="`Racha día ${rachaActual.dias}`"
              class="streak-image"
              :width="rachaActual.size"
              :height="rachaActual.size"
            />
          </div>
        </div>
        <p class="text-h4 font-weight-bold text-amber-lighten-2">
          {{ rachaActual.dias }} {{ rachaActual.dias === 1 ? 'Día' : 'Días' }}
        </p>
        <p class="text-caption text-white text-opacity-75 mt-1">
          ¡Sigue así para mantener el fuego!
        </p>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn
          color="green-lighten-1"
          variant="flat"
          @click="showStreakDialog = false"
        >
          ¡Entendido!
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

// --- LÓGICA DE RACHAS ---
const rachaData = ref({
  dias: 1,
  ultimoAcceso: null
})
const showStreakDialog = ref(false)

// Imágenes de rachas
const rachaImagenes = [
  {
    dias: 1,
    imagen: new URL('@/assets/racha1.png', import.meta.url).href,
    size: 120
  },
  {
    dias: 2,
    imagen: new URL('@/assets/racha2.png', import.meta.url).href,
    size: 140
  },
  {
    dias: 3,
    imagen: new URL('@/assets/racha3.png', import.meta.url).href,
    size: 160
  }
]

// Computed para obtener la imagen de racha actual
const rachaActual = computed(() => {
  const dias = rachaData.value.dias
  
  // Si los días son mayores a 3, mostrar la imagen del día 3 (máximo)
  if (dias >= 3) {
    return { ...rachaImagenes[2], dias }
  } else if (dias === 2) {
    return rachaImagenes[1]
  } else {
    return rachaImagenes[0]
  }
})

// Función para cargar y actualizar la racha del usuario
const loadUserStreak = async () => {
  try {
    const response = await fetch('/api/user/streak', {
      credentials: 'include'
    })
    
    
    if (response.ok) {
      const data = await response.json()
      rachaData.value = data
      
      // Llama a updateUserStreak para registrar el inicio de sesión y actualizar la racha
      // El backend debe devolver la racha actualizada, y updateUserStreak se encarga de mostrar el diálogo
      await updateUserStreak()

    } else {
      // Si no existe racha (404), o hay otro error, intenta crear/actualizar la racha
      await updateUserStreak()
    }
  } catch (error) {
    console.error('Error al cargar la racha:', error)
    // Si hay un error de red, intenta crear/actualizar la racha
    await updateUserStreak()
  }
}

// Función para actualizar la racha del usuario
const updateUserStreak = async () => {
  try {
    const response = await fetch('/api/user/streak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    
    if (response.ok) {
      const data = await response.json()
      rachaData.value = data
      
      // Mostrar el diálogo después de actualizar/crear la racha
      if (rachaData.value.dias >= 1) {
        nextTick(() => {
          showStreakDialog.value = true
        })
      }
    } else {
      // Si el backend falla, mostramos un error en consola, pero no forzamos el incremento
      console.error('Error al actualizar la racha en el backend:', response.statusText)
    }
  } catch (error) {
    console.error('Error de red al actualizar la racha:', error)
  }
}

// Funció per actualitzar I OBTENIR la ratxa
const checkAndUpdateUserStreak = async () => {
  try {
    // Aquesta crida POST hauria de fer tota la feina:
    // 1. Comprovar si és un nou dia.
    // 2. Actualitzar la ratxa si cal.
    // 3. Retornar la ratxa actualitzada (o la d'avui si no s'ha actualitzat).
    const response = await fetch('/api/user/streak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      rachaData.value = data;

      // Mostrar el diàleg
      if (rachaData.value.dias >= 1) {
        nextTick(() => {
          showStreakDialog.value = true;
        });
      }
    } else {
      console.error('Error al comprovar/actualitzar la ratxa:', response.statusText);
    }
  } catch (error) {
    console.error('Error de xarxa en comprovar/actualitzar la ratxa:', error);
  }
}

onMounted(() => {
  // Cridem només a la funció POST
  checkAndUpdateUserStreak();
});
</script>

<style scoped>
/* ==================================== */
/* ======== DIÁLOGO Y GLASS ======== */
/* ==================================== */
.glass-card-futuristic {
  background: rgba(30, 30, 47, 0.9) !important; /* Fondo oscuro semitransparente */
  border: 1px solid rgba(139, 92, 246, 0.3); /* Borde morado sutil */
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(10px); /* Efecto glassmorphism */
  -webkit-backdrop-filter: blur(10px);
}

.streak-container-dialog {
  padding: 10px;
  border-radius: 50%;
  background: rgba(255, 165, 0, 0.1);
  border: 2px solid rgba(255, 165, 0, 0.6);
  box-shadow: 0 0 20px rgba(255, 165, 0, 0.5);
}

/* Colores específicos para el diálogo */
.text-amber-lighten-2 {
  color: #ffd54f !important;
  text-shadow: 0 0 8px rgba(255, 213, 79, 0.8);
}

/* ==================================== */
/* ======== SECCIÓN DE RACHA ======== */
/* ==================================== */
.streak-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: rgba(30, 30, 47, 0.5);
  border-radius: 20px;
  border: 2px solid rgba(255, 165, 0, 0.4);
  box-shadow: 0 0 30px rgba(255, 165, 0, 0.3);
  backdrop-filter: blur(10px);
  animation: streakGlow 3s ease-in-out infinite;
}

@keyframes streakGlow {
  0%, 100% {
    box-shadow: 0 0 30px rgba(255, 165, 0, 0.3);
    border-color: rgba(255, 165, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 50px rgba(255, 165, 0, 0.6);
    border-color: rgba(255, 165, 0, 0.7);
  }
}

.streak-image {
  filter: drop-shadow(0 0 20px rgba(255, 165, 0, 0.8));
  animation: streakPulse 2s ease-in-out infinite;
}

@keyframes streakPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.streak-text {
  text-shadow: 0 0 10px rgba(255, 165, 0, 0.8);
}

/* Título (copiado del original para consistencia) */
.ranking-title {
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.85);
  font-weight: 700;
}

/* Divisor (copiado del original) */
.divider-glow {
    max-width: 85%;
    height: 1px;
    border-radius: 4px;
    background: linear-gradient(90deg, transparent 0%, #3b82f6, #8b5cf6, #3b82f6, transparent 100%);
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
    opacity: 0.7;
}
@media (min-width: 600px) {
    .divider-glow {
        max-width: 600px;
        height: 2px;
    }
}
</style>