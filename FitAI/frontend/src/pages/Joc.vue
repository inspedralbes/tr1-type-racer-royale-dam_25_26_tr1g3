<template>
  <v-app>
    <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
      <v-container class="text-center text-white pa-4 pa-md-8 fade-in-container" style="max-width: 1400px;">

        <v-btn class="top-left-back-btn rectangular-btn" variant="flat" size="large"
          prepend-icon="mdi-arrow-left" @click="sortir">
          Sortir
        </v-btn>

        <h2 class="exercise-title my-6">{{ exerciciLabel }}</h2>

        <v-row dense class="justify-center">
          <v-col v-for="(jugador, i) in leaderboard" :key="jugador.userId" cols="12" sm="6"
            class="d-flex justify-center mb-6">
            
            <v-card class="rounded-xl overflow-hidden shadow-card player-card text-center pa-4"
              elevation="12" width="100%" max-width="550">
              
              <h3 class="text-h6 font-weight-bold mb-3 neon-player-name">
                <v-icon v-if="i === 0" color="yellow-accent-4" start>mdi-trophy-variant</v-icon>
                {{ jugador.userName }} <span v-if="jugador.userId === userId" class="text-caption text-cyan-lighten-2">
                  (Tu)
                </span>
              </h3>

              <div v-if="jugador.userId === userId" style="position: relative; width: 100%;">
                <video ref="videoEl" autoplay playsinline muted class="rounded-xl"
                  style="width: 100%; object-fit: cover; background: black;"></video>
                <canvas ref="canvasEl" width="640" height="480"
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
              </div>

              <div v-else class="text-grey-lighten-2 py-16 text-center bg-dark rounded-xl">
                <v-icon size="40">mdi-account-circle</v-icon>
                <p class="mt-2 text-body-2">{{ jugador.userName }}</p>
              </div>

              <v-card class="mt-6 py-4 px-4 text-center rounded-xl" color="transparent" elevation="10"
                style="border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); background: rgba(0,0,0,0.25);">
                <h4 class="text-h6 font-weight-regular text-grey-lighten-2">Repeticions</h4>
                <h1 class="text-h2 font-weight-black text-cyan-lighten-2">{{ jugador.reps }}</h1>
              </v-card>
            </v-card>
          </v-col>
        </v-row>

      </v-container>
    </v-main>
  </v-app>
</template>


<script setup>
// ✅ CORRECCIÓ 1: Importa 'watch' i 'nextTick'
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'
import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia' // ✅ CORRECCIÓ 3: Importa 'storeToRefs'

// Props rebudes del router
const props = defineProps({
  ejercicio: { type: String, required: true },
  sessionId: { type: String, required: true }
});

const router = useRouter();
const authStore = useAuthStore();

// ✅ CORRECCIÓ 3: Usa 'storeToRefs' per mantenir la reactivitat
const { userId, userName } = storeToRefs(authStore);

// --- IDENTITAT I NOMS ---
const exercici = computed(() => props.ejercicio.toLowerCase());
const sessionId = computed(() => props.sessionId);

const noms = {
  flexions: 'FLEXIONS',
  squats: 'ESQUATS',
  salts: 'SALTS',
  abdominals: 'ABDOMINALS',
}
const exerciciLabel = computed(() => noms[exercici.value] || 'EXERCICI');

// Refs de Càmera i Joc
const videoEl = ref(null);
const canvasEl = ref(null);
// ❌ CORRECCIÓ 2: 'count' local eliminat. El servidor porta la compta.
// const count = ref(0); 
const leaderboard = ref([]);
const cameraStarted = ref(false); // ✅ CORRECCIÓ 1: Flag per controlar l'inici de la càmera

let detector = null;
let up = false;
let streamRef = null;
let detecting = false;

// WebSocket
const ws = ref(null);

onMounted(() => {
  connectWebSocket();
  // ❌ CORRECCIÓ 1: NO iniciar la càmera aquí.
  // startCamera();
});

onBeforeUnmount(() => {
  stopCamera();
  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({ type: 'leave' }));
    ws.value.close();
  }
});

// ✅ CORRECCIÓ 1: Observador per iniciar la càmera quan el DOM estigui llest
watch(leaderboard, (newLeaderboard) => {
  if (!newLeaderboard) return;
  // Comprova si 'jo' estic al leaderboard (necessitem userId.value)
  const myData = newLeaderboard.find(j => j.userId === userId.value);

  // Si 'jo' existeixo I la càmera no s'ha iniciat...
  if (myData && !cameraStarted.value) {
    cameraStarted.value = true; // Marca com a iniciada
    
    // Espera que Vue renderitzi el v-if
    nextTick(() => {
      startCamera();
    });
  }
}, { deep: true });


// ---------- WEBSOCKET ----------
function connectWebSocket() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.host;
  const wsUrl = `${wsProtocol}//${wsHost}/ws`;

  ws.value = new WebSocket(wsUrl);

  ws.value.onopen = () => {
    console.log('Connectat a la sessió', sessionId.value);
    ws.value.send(JSON.stringify({
      type: 'join',
      sessionId: sessionId.value,
      userId: userId.value, // ✅ CORRECCIÓ 3: Accedeix al 'ref'
      userName: userName.value, // ✅ CORRECCIÓ 3: Accedeix al 'ref'
      exercici: exercici.value
    }));
  };

  ws.value.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'leaderboard') {
      leaderboard.value = message.leaderboard;

      // ❌ CORRECCIÓ 2: Ja no actualitzem 'count.value' localment
    }
  };
  
  ws.value.onclose = () => console.log('Desconnectat del servidor');
  ws.value.onerror = (err) => console.error('Error WebSocket:', err);
}

// ---------- CÀMERA ----------
async function startCamera() {
  // ✅ CORRECCIÓ 1: Aquestes 'refs' ara haurien d'existir
  if (!videoEl.value) {
    console.error("L'element <video> encara no està llest.");
    return;
  }
  
  try {
    streamRef = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.value.srcObject = streamRef;
    await videoEl.value.play();
    
    if (!canvasEl.value) {
        console.error("L'element <canvas> encara no està llest.");
        return;
    }

    await initMoveNet();
    detecting = true;
    detectPose();
  } catch (e) {
    console.error('Error obrint càmera:', e);
  }
}

function stopCamera() {
  if (streamRef) {
    streamRef.getTracks().forEach((t) => t.stop());
    streamRef = null;
  }
  if(videoEl.value) videoEl.value.srcObject = null;
  
  detecting = false;
  
  const ctx = canvasEl.value?.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height);
}

// ... (Les funcions initMoveNet, detectPose, drawPose no canvien) ...
async function initMoveNet() {
  await tf.ready();
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  });
}

async function detectPose() {
  if (!canvasEl.value || !videoEl.value) return;
  
  const ctx = canvasEl.value.getContext('2d');

  async function loop() {
    if (!detecting || !videoEl.value || videoEl.value.paused || videoEl.value.ended) return;

    if (canvasEl.value.width !== videoEl.value.videoWidth) {
        canvasEl.value.width = videoEl.value.videoWidth;
        canvasEl.value.height = videoEl.value.videoHeight;
    }

    const poses = await detector.estimatePoses(videoEl.value);
    
    ctx.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height);
    
    if (poses.length > 0) {
      drawPose(ctx, poses[0]);
      checkMoviment(poses[0]);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function drawPose(ctx, pose) {
  for (const kp of pose.keypoints) {
    if (kp.score > 0.4) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#00ffaa';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ffaa';
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}


// ---------- DETECCIÓ (UNIFICADA) ----------
function checkMoviment(pose) {
  switch (exercici.value) {
    case 'flexions':
      checkFlexio(pose);
      break;
    case 'squats':
      checkEsquat(pose);
      break;
    case 'salts':
      checkSalt(pose);
      break;
    case 'abdominals':
      checkAbdominal(pose);
      break;
  }
}

// ---------------- FLEXIONS ----------------
function checkFlexio(pose) {
  const espatlla = pose.keypoints.find(k => k.name === 'left_shoulder');
  const canell = pose.keypoints.find(k => k.name === 'left_wrist');
  if (!espatlla || !canell || espatlla.score < 0.4 || canell.score < 0.4) return;

  const dist = Math.abs(espatlla.y - canell.y);
  const UMBRAL_ARRIBA = 150;
  const UMBRAL_ABAJO = 80;

  if (dist < UMBRAL_ABAJO && !up) up = true;
  if (dist > UMBRAL_ARRIBA && up) {
    // ❌ CORRECCIÓ 2: No incrementar comptador local
    up = false;
    sendRepEvent(); // ✅ CORRECCIÓ 2: Enviar esdeveniment
  }
}

// ---------------- SQUATS ----------------
function checkEsquat(pose) {
  const maluc = pose.keypoints.find(k => k.name === 'left_hip');
  const genoll = pose.keypoints.find(k => k.name === 'left_knee');
  if (!maluc || !genoll || maluc.score < 0.4 || genoll.score < 0.4) return;

  const dist = Math.abs(maluc.y - genoll.y);
  const UMBRAL_ARRIBA = 160;
  const UMBRAL_ABAJO = 100;

  if (dist < UMBRAL_ABAJO && !up) up = true;
  if (dist > UMBRAL_ARRIBA && up) {
    up = false;
    sendRepEvent(); // ✅ CORRECCIÓ 2: Enviar esdeveniment
  }
}

// ---------------- SALTS ----------------
let initialY = null;
let jumping = false;
function checkSalt(pose) {
  const peu = pose.keypoints.find(k => k.name === 'left_ankle');
  if (!peu || peu.score < 0.4) return;

  if (initialY === null) initialY = peu.y;
  const delta = initialY - peu.y;

  const UMBRAL_SALT = 60;
  if (delta > UMBRAL_SALT && !jumping) {
    jumping = true;
  } else if (delta < 10 && jumping) {
    jumping = false;
    sendRepEvent(); // ✅ CORRECCIÓ 2: Enviar esdeveniment
  }
}

// ---------------- ABDOMINALS ----------------
function checkAbdominal(pose) {
  const nas = pose.keypoints.find(k => k.name === 'nose');
  const maluc = pose.keypoints.find(k => k.name === 'left_hip');
  if (!nas || !maluc || nas.score < 0.4 || maluc.score < 0.4) return;

  const dist = Math.abs(nas.y - maluc.y);
  const UMBRAL_ARRIBA = 150;
  const UMBRAL_ABAJO = 100;

  if (dist < UMBRAL_ABAJO && !up) up = true;
  if (dist > UMBRAL_ARRIBA && up) {
    up = false;
    sendRepEvent(); // ✅ CORRECCIÓ 2: Enviar esdeveniment
  }
}

// ✅ CORRECCIÓ 2: Canvi de nom i funció
function sendRepEvent() {
  if (ws.value?.readyState === WebSocket.OPEN) {
    // Simplement notifica al servidor que s'ha fet una repetició
    ws.value.send(JSON.stringify({ type: 'rep_completed' }));
  }
}

// ---------- SORTIR ----------
function sortir() {
  stopCamera();
  router.push({ name: 'Home' });
}
</script>