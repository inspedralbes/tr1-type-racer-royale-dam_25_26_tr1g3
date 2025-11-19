<template>
  <v-card
    class="py-4 px-5 text-center rounded-xl timer-card"
    color="transparent"
    elevation="10"
    style="border: 2px solid rgba(139, 92, 246, 0.3); backdrop-filter: blur(10px); background: rgba(139, 92, 246, 0.1);"
  >
    <h3 class="text-h6 font-weight-regular mb-3 text-purple-lighten-2">⏱️ TEMPORITZADOR</h3>
    
    <div v-if="preCount > 0" class="text-center">
      <h2 class="text-h1 font-weight-black text-red-lighten-1 mb-2 pre-count-value">{{ preCount }}</h2>
      <p class="text-h6 text-red-lighten-2 font-weight-bold">¡Prepárate!</p>
    </div>
    
    <div v-else>
      <h2 class="text-h3 font-weight-bold text-purple-lighten-1 mb-2">{{ formattedTime }}</h2>
    </div>

    <div class="d-flex justify-center gap-2 mb-3 mt-4">
      <v-btn
        v-if="!timerActive && preCount === 0 && !timerFinished"
        color="green-darken-1"
        variant="flat"
        size="small"
        rounded="lg"
        @click="startPreCount"
        :disabled="timerActive || preCount > 0"
      >
        <v-icon start>mdi-timer-1</v-icon>
        1 Minuto
      </v-btn>
      
      <v-btn
        v-if="timerActive || preCount > 0"
        color="red-darken-1"
        variant="outlined"
        size="small"
        rounded="lg"
        @click="stopTimer"
      >
        <v-icon start>mdi-pause</v-icon>
        Parar
      </v-btn>
      
      <v-btn
        v-if="!timerActive && timeRemaining < 60 || timerFinished"
        color="blue-grey-lighten-2"
        variant="outlined"
        size="small"
        rounded="lg"
        @click="resetTimer"
      >
        <v-icon start>mdi-refresh</v-icon>
        Restablecer
      </v-btn>
    </div>

    <p v-if="!timerActive && preCount === 0 && !timerFinished && timeRemaining === 60" class="text-caption text-grey-lighten-1 mt-2">
      Premeu 1 Minuto per començar
    </p>
    <p v-if="timerActive" class="text-caption text-green-lighten-2 mt-2 font-weight-bold">
      🟢 Comptant...
    </p>
    <p v-if="timerFinished" class="text-h6 text-green-lighten-2 mt-2 font-weight-bold">
      ✅ Temps completat!
    </p>
    <p v-if="!timerActive && preCount === 0 && !timerFinished && timeRemaining < 60" class="text-caption text-red-lighten-2 mt-2 font-weight-bold">
      ⏸️ Temporitzador aturat
    </p>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['mainTimerStart', 'timerStop', 'timerReset', 'timerFinished'])

const timerActive = ref(false)
const timerFinished = ref(false)
const INITIAL_TIME = 60 // Constante para evitar errores
const timeRemaining = ref(INITIAL_TIME) 
const preCount = ref(0)
let timerInterval = null
let preCountInterval = null

const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

function startPreCount() {
  if (timerActive.value || preCountInterval) return
  preCount.value = 5
  timerFinished.value = false
  
  preCountInterval = setInterval(() => {
    preCount.value--
    if (preCount.value <= 0) {
      clearInterval(preCountInterval)
      preCountInterval = null
      startMainTimer()
    }
  }, 1000)
}

function startMainTimer() {
  if (timerActive.value) return
  timerActive.value = true
  emit('mainTimerStart') 
  
  timerInterval = setInterval(() => {
    timeRemaining.value--
    
    // CUANDO ACABA EL TIEMPO (00:00)
    if (timeRemaining.value <= 0) {
      stopTimer(true) 
      timerFinished.value = true
      
      // 👇 AQUÍ ESTÁ LA CLAVE: Enviamos 60
      emit('timerFinished', INITIAL_TIME) 
    }
  }, 1000)
}

function stopTimer(finished = false) {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  if (preCountInterval) {
    clearInterval(preCountInterval)
    preCountInterval = null
  }
  
  // Si NO ha acabado solo (usuario pulsa Parar)
  if (!finished) {
      preCount.value = 0
      // Calculamos cuánto ha hecho (60 - lo que queda)
      const timeSpent = INITIAL_TIME - timeRemaining.value
      emit('timerStop', timeSpent) 
  }
  timerActive.value = false
}

function resetTimer() {
  stopTimer()
  timeRemaining.value = INITIAL_TIME
  preCount.value = 0
  timerFinished.value = false
  emit('timerReset')
}

defineExpose({ stopTimer })
</script>

<style scoped>
.timer-card {
  animation: timerPulse 2.5s ease-in-out infinite;
}
@keyframes timerPulse {
  0%, 100% {
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
  }
}
.pre-count-value {
  animation: preCountPulse 1s infinite;
}
@keyframes preCountPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>