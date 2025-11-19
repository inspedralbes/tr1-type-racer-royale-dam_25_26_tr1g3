import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useAuthStore } from '@/stores/authStore';

export const useWorkoutStore = defineStore('workout', () => {
  // ======================================================
  // === ESTAT (State) ===
  // ======================================================

  // --- Connexió WebSocket ---
  const ws = ref(null);
  const isConnected = ref(false);

  // --- Estat del Joc ---
  const leaderboard = ref([]);
  const count = ref(0); // El teu comptador personal de repeticions
  const lastReceivedPose = ref(null); // Guarda l'últim esquelet rebut

  // --- Estat del Temporitzador (CONSERVAT) ---
  const timerActive = ref(false);
  const timerFinished = ref(false);
  const timeRemaining = ref(60);
  const preCount = ref(0);
  
  // --- Referències internes (no reactives) ---
  let timerInterval = null;
  let preCountInterval = null;

  // --- Dades de la sessió actual ---
  let currentCodiAcces = null;
  let currentExercici = null;
  let currentUserId = null;
  let currentUserName = null;


  // ======================================================
  // === GETTERS (Computed) ===
  // ======================================================
  const formattedTime = computed(() => {
    const minutes = Math.floor(timeRemaining.value / 60);
    const seconds = timeRemaining.value % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  // ======================================================
  // === ACCIONS (Actions) ===
  // ======================================================

  // --- 1. Lògica del Temporitzador (CONSERVADA) ---
  function startPreCount() {
    if (timerActive.value || preCountInterval) return;
    preCount.value = 5;
    timerFinished.value = false;
    
    preCountInterval = setInterval(() => {
      preCount.value--;
      if (preCount.value <= 0) {
        clearInterval(preCountInterval);
        preCountInterval = null;
        startMainTimer();
      }
    }, 1000);
  }

  function startMainTimer() {
    if (timerActive.value) return;
    timerActive.value = true;
    
    timerInterval = setInterval(() => {
      timeRemaining.value--;
      if (timeRemaining.value <= 0) {
        stopTimer();
        timerFinished.value = true;
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    if (preCountInterval) clearInterval(preCountInterval);
    timerInterval = null;
    preCountInterval = null;
    timerActive.value = false;
  }

  function resetTimer() {
    stopTimer();
    timeRemaining.value = 60;
    preCount.value = 0;
    timerFinished.value = false;
  }

  // --- 2. Lògica de Repeticions (AJUSTADA) ---
  function incrementCount() {
    // NOTA: He tret la condició 'if (!timerActive.value) return;'
    // perquè el comptador funcioni sense que el temporitzador estigui actiu.
    // Pots tornar a afegir-la quan implementis el botó per iniciar el temps.
    
    count.value++;
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'update', reps: count.value }));
    }
  }

  // --- 3. Lògica de WebSocket (AMB LÒGICA D'ESQUELETS) ---
  function connectWebSocket(codi_acces, exercici) {
    const authStore = useAuthStore();
    if (!authStore.user) {
      console.error("No hi ha usuari autenticat per començar la sessió.");
      return;
    }
    
    currentCodiAcces = codi_acces;
    currentExercici = exercici;
    currentUserId = authStore.user.id;
    currentUserName = authStore.userName;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws`;
    
    ws.value = new WebSocket(wsUrl);

    ws.value.onopen = () => {
      isConnected.value = true;
      ws.value.send(JSON.stringify({ 
        type: 'join', 
        codi_acces: currentCodiAcces, 
        userId: currentUserId, 
        userName: currentUserName 
      }));
    };

    ws.value.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'leaderboard':
          leaderboard.value = message.leaderboard;
          break;
        case 'pose_update':
          lastReceivedPose.value = { from: message.from, pose: message.pose };
          break;
        case 'joined':
          console.log('Confirmat: Unit a la sala.');
          // Aquesta lògica de 'start' la pots activar aquí o des d'un botó
          // ws.value.send(JSON.stringify({ type: 'start', codi_acces: currentCodiAcces }));
          break;
      }
    };

    ws.value.onclose = () => { isConnected.value = false; };
    ws.value.onerror = (err) => console.error('Error WebSocket:', err);
  }

  function disconnectWebSocket() {
    stopTimer(); // Aturem el temporitzador en desconnectar
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'finish',
        reps: count.value,
        exercici: currentExercici,
        codi_acces: currentCodiAcces
      }));
      ws.value.send(JSON.stringify({ type: 'leave' }));
      ws.value.close();
    }
    ws.value = null;
    isConnected.value = false;
  }
  
  // --- 4. Neteja de l'Store ---
  function cleanupSession() {
    disconnectWebSocket();
    resetTimer(); // Resetejem el temporitzador
    count.value = 0;
    leaderboard.value = [];
    lastReceivedPose.value = null;
    currentCodiAcces = null;
    currentExercici = null;
    currentUserId = null;
    currentUserName = null;
  }

  // ======================================================
  // === Retornem l'API pública de l'store ===
  // ======================================================
  return {
    // Estat i Getters
    ws,
    isConnected,
    leaderboard,
    count,
    timerActive,
    timerFinished,
    timeRemaining,
    preCount,
    formattedTime,
    lastReceivedPose,
    
    // Accions
    startPreCount,
    stopTimer,
    resetTimer,
    incrementCount,
    connectWebSocket,
    disconnectWebSocket,
    cleanupSession
  };
});