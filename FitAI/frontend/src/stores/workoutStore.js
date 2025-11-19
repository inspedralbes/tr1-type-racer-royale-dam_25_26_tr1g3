import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useAuthStore } from '@/stores/authStore';

export const useWorkoutStore = defineStore('workout', () => {
  const authStore = useAuthStore();

  // ======================================================
  // === ESTAT (State) ===
  // ======================================================

  // --- Connexió WebSocket ---
  const ws = ref(null);
  const isConnected = ref(false);

  // --- Estat del Joc ---
  const leaderboard = ref([]);
  const count = ref(0);
  const lastReceivedPose = ref(null);
  const gameStarted = ref(false);
  
  // NOU ESTAT PER GUARDAR LA CLASSIFICACIÓ FINAL (SOLUCIÓ 'RACE CONDITION')
  const finalLeaderboard = ref(null);

  // --- Estat del Temporitzador (per a mode solo, es manté per si de cas) ---
  const timerActive = ref(false);
  const timerFinished = ref(false);
  const timeRemaining = ref(60);
  const preCount = ref(0);
  
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

  const isHost = computed(() => {
    if (leaderboard.value.length > 0 && authStore.user) {
        return leaderboard.value[0].userId === authStore.user.id;
    }
    return false;
  });

  // ======================================================
  // === ACCIONS (Actions) ===
  // ======================================================

  // --- 1. Lògica del Temporitzador (per a mode solo) ---
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

  // --- 2. Lògica de Repeticions ---
  function incrementCount() {
    count.value++;
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'update', reps: count.value }));
    }
  }

  function sendStartSignal() {
    if (ws.value?.readyState === WebSocket.OPEN) {
        ws.value.send(JSON.stringify({ 
            type: 'start', 
            codi_acces: currentCodiAcces 
        }));
    }
  }

  // --- 3. Lògica de WebSocket ---
  function connectWebSocket(codi_acces, exercici) {
    if (!authStore.user) return;
    
    currentCodiAcces = codi_acces;
    currentExercici = exercici;
    currentUserId = authStore.user.id;
    currentUserName = authStore.userName;
    
    // Assegurem que res està corrent en connectar-se al Lobby
    stopTimer();
    timeRemaining.value = 60;
    timerActive.value = false;
    gameStarted.value = false;
    count.value = 0;
    finalLeaderboard.value = null; // Neteja la classificació final anterior

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
          break;
        case 'start':
          console.log("Rebut senyal START. Comença el joc.");
          gameStarted.value = true;
          break;
      }
    };

    ws.value.onclose = () => { 
        console.log("WebSocket tancat.");
        isConnected.value = false; 
    };
    ws.value.onerror = (err) => console.error('Error WebSocket:', err);
  }

  function disconnectWebSocket() {
    stopTimer();
    if (ws.value?.readyState === WebSocket.OPEN) {
      if (count.value > 0) {
          // 🔴 CANVI CLAU: S'afegeix el temps a les dades enviades
          const finalTime = 60; // El temps de partida multijugador sempre és 60 segons

          ws.value.send(JSON.stringify({
            type: 'finish',
            reps: count.value,
            time: finalTime, // AFEGIT PER DESAR EL TEMPS TOTAL
            exercici: currentExercici,
            codi_acces: currentCodiAcces
          }));
      }
      ws.value.send(JSON.stringify({ type: 'leave' }));
      ws.value.close();
    }
    ws.value = null;
    isConnected.value = false;
    gameStarted.value = false;
  }
  
  // --- 4. Neteja de l'Store ---
  function cleanupSession() {
    disconnectWebSocket();
    resetTimer();
    count.value = 0;
    leaderboard.value = [];
    lastReceivedPose.value = null;
    gameStarted.value = false;
    finalLeaderboard.value = null; // Neteja la classificació final
  }

  return {
    ws, isConnected, leaderboard, count, timerActive, timerFinished, timeRemaining, preCount, formattedTime, lastReceivedPose,
    gameStarted, isHost, finalLeaderboard, // EXPORTEM 'finalLeaderboard'
    startPreCount, stopTimer, resetTimer, incrementCount, connectWebSocket, disconnectWebSocket, cleanupSession, sendStartSignal
  };
});
