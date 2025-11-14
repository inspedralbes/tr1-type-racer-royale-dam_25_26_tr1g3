import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// Ho importem aquí, ja que el store gestionarà el comptador
import { useAuthStore } from '@/stores/authStore'

export const useWorkoutStore = defineStore('workout', () => {
  // === ESTAT (State) ===
  const ws = ref(null)
  const isConnected = ref(false)
  const leaderboard = ref([])
  const count = ref(0) // El teu comptador personal

  // Estat del temporitzador
  const timerActive = ref(false)
  const timerFinished = ref(false)
  const timeRemaining = ref(60)
  const preCount = ref(0)
  
  // Referències internes (no cal que siguin reactives)
  let timerInterval = null
  let preCountInterval = null

  // Dades de la sessió
  let currentCodiAcces = null
  let currentExercici = null
  let currentUserId = null
  let currentUserName = null


  // === GETTERS (Computed) ===
  const formattedTime = computed(() => {
    const minutes = Math.floor(timeRemaining.value / 60)
    const seconds = timeRemaining.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  // === ACCIONS (Actions) ===

  // 1. Lògica del Temporitzador
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
    
    timerInterval = setInterval(() => {
      timeRemaining.value--
      if (timeRemaining.value <= 0) {
        stopTimer()
        timerFinished.value = true
        // Podríem emetre un event aquí si cal
      }
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    if (preCountInterval) {
      clearInterval(preCountInterval)
      preCountInterval = null
    }
    timerActive.value = false
  }

  function resetTimer() {
    stopTimer()
    timeRemaining.value = 60
    preCount.value = 0
    timerFinished.value = false
  }

  // 2. Lògica de Repeticions
  function incrementCount() {
    // Només comptem si el temporitzador principal està actiu
    if (!timerActive.value) return
    
    count.value++
    // Envia l'actualització al WebSocket immediatament
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'update', reps: count.value }))
    }
  }

  // 3. Lògica de WebSocket
  function connectWebSocket(codi_acces, exercici) {
    // Obtenim l'usuari des del authStore (que ja tenim)
    const authStore = useAuthStore()
    if (!authStore.user) {
      console.error("No hi ha usuari autenticat per començar la sessió.")
      return
    }
    
    // Guardem les dades de la sessió
    currentCodiAcces = codi_acces
    currentExercici = exercici
    currentUserId = authStore.user.id
    currentUserName = authStore.userName

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = window.location.host
    const wsUrl = `${wsProtocol}//${wsHost}/ws`
    
    console.log(`Connectant a WebSocket a: ${wsUrl}`)
    ws.value = new WebSocket(wsUrl)

    ws.value.onopen = () => {
      console.log('Connectat al servidor WebSocket')
      isConnected.value = true
      // 1. S'uneix a la sala
      ws.value.send(JSON.stringify({ 
        type: 'join', 
        codi_acces: currentCodiAcces, 
        userId: currentUserId, 
        userName: currentUserName 
      }))
    }

    ws.value.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'leaderboard') {
        leaderboard.value = message.leaderboard
      }

      if (message.type === 'joined') {
        // 2. Confirmat. Ara enviem 'start'
        console.log('Confirmat: Unit a la sala. Enviant "start"...')
        ws.value.send(JSON.stringify({ type: 'start', codi_acces: currentCodiAcces }))
      }
    }

    ws.value.onclose = () => {
      console.log('Desconnectat del servidor')
      isConnected.value = false
    }
    ws.value.onerror = (err) => console.error('Error WebSocket:', err)
  }

  function disconnectWebSocket() {
    stopTimer()
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'finish',
        reps: count.value,
        exercici: currentExercici,
        codi_acces: currentCodiAcces
      }))
      ws.value.send(JSON.stringify({ type: 'leave' }))
      ws.value.close()
    }
    ws.value = null
    isConnected.value = false
  }
  
  // 4. Neteja de l'Store
  function cleanupSession() {
    disconnectWebSocket()
    resetTimer()
    count.value = 0
    leaderboard.value = []
    currentCodiAcces = null
    currentExercici = null
    currentUserId = null
    currentUserName = null
  }

  // === Retornem l'API pública de l'store ===
  return {
    // Estat i Getters
    isConnected,
    leaderboard,
    count,
    timerActive,
    timerFinished,
    timeRemaining,
    preCount,
    formattedTime,
    
    // Accions
    startPreCount,
    stopTimer,
    resetTimer,
    incrementCount,
    connectWebSocket,
    disconnectWebSocket,
    cleanupSession
  }
})