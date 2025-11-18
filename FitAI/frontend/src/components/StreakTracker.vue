<template>
  <div class="w-100 pa-0">
    
    <h3 class="text-h5 text-center mb-4 text-white ranking-title-profile">
      🔥 Racha de Días Consecutivos
    </h3>
    
    <div class="d-flex justify-center align-center mb-6">
      <div class="streak-container">
        <v-img
          :src="rachaActual.imagen"
          :alt="`Racha día ${rachaActual.dias}`"
          class="streak-image"
          :width="rachaActual.size / 1.5"   :height="rachaActual.size / 1.5"  />
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
  </div>

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
import { useAuthStore } from '@/stores/authStore'; 

// --- LÓGICA DE RACHAS (Sense canvis, només funcionalitat) ---
const rachaData = ref({
  dias: 1,
  ultimoAcceso: null
})
const showStreakDialog = ref(false)
const authStore = useAuthStore(); 

// Imatges (Mantenim les mides originals aquí, ja que es divideixen al template)
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

const rachaActual = computed(() => {
  const dias = rachaData.value.dias
  if (dias >= 3) {
    return { ...rachaImagenes[2], dias }
  } else if (dias === 2) {
    return rachaImagenes[1]
  } else {
    return rachaImagenes[0]
  }
})

const loadUserStreak = async () => { /* ... */ }
const updateUserStreak = async () => { /* ... */ }

const checkAndUpdateUserStreak = async () => {
  try {
    const response = await fetch('/api/user/streak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      rachaData.value = data;

      if (rachaData.value.dias >= 1 && !authStore.hasShownStreakPopup) {
        nextTick(() => {
          showStreakDialog.value = true;
          authStore.setStreakPopupShown(); 
        })
      }

    } else {
      console.error('Error al comprovar/actualitzar la ratxa:', response.statusText);
    }
  } catch (error) {
    console.error('Error de xarxa en comprovar/actualitzar la ratxa:', error);
  }
}

onMounted(() => {
  checkAndUpdateUserStreak();
});
</script>

<style scoped>
/* ==================================== */
/* ======== DIÁLOGO Y GLASS (Sense canvis) ======== */
/* ==================================== */
.glass-card-futuristic {
  background: rgba(30, 30, 47, 0.9) !important; 
  border: 1px solid rgba(139, 92, 246, 0.3); 
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(10px); 
  -webkit-backdrop-filter: blur(10px);
}

.streak-container-dialog {
  padding: 10px;
  border-radius: 50%;
  background: rgba(255, 165, 0, 0.1);
  border: 2px solid rgba(255, 165, 0, 0.6);
  box-shadow: 0 0 20px rgba(255, 165, 0, 0.5);
}

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

/* ==================================== */
/* ======== NOU AJUST DE TÍTOL PER AL PERFIL ======== */
/* ==================================== */
.ranking-title-profile { 
  font-size: 1.5rem !important; 
  text-shadow: 0 0 10px rgba(255, 165, 0, 0.8);
  font-weight: 500;
}
</style>