<template>
  <v-app>
    <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
      <v-container class="text-center text-white pa-4 pa-md-8 fade-in-container expanded-container position-relative"
        style="max-width: 1400px;">
        <v-btn class="top-left-back-btn rectangular-btn" variant="flat" size="large" prepend-icon="mdi-arrow-left"
          @click="tornar">
          Tornar
        </v-btn>

        <v-row class="mt-16 mt-md-0">
          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center order-md-1 order-2">

            <v-card class="rounded-xl overflow-hidden shadow-card video-card" elevation="12" width="100%"
              style="background-color: #000; position: relative;">
              <video ref="video" autoplay playsinline muted width="100%" class="rounded-xl"
                style="object-fit: cover;"></video>
              <canvas ref="canvas" width="640" height="480" style="position:absolute; top:0; left:0;"></canvas>
            </v-card>

            <div class="mt-6 d-flex flex-wrap justify-center gap-2 small-btn-group">
              <v-btn color="#8b5cf6" variant="flat" size="large" rounded="lg" class="control-btn-large action-btn"
                @click="startCamera">
                <v-icon start>mdi-video-outline</v-icon>
                Càmera
              </v-btn>

              <v-btn color="red-darken-1" variant="outlined" size="large" rounded="lg" class="control-btn-large"
                @click="stopCamera">
                <v-icon start>mdi-stop-circle-outline</v-icon>
                Aturar
              </v-btn>

              <v-btn color="#3b82f6" variant="flat" size="large" rounded="lg" class="control-btn-large action-btn"
                @click="selectVideo">
                <svg-icon type="mdi" :path="pathCarregar" class="mr-1" width="22" height="22" />Vídeo
              </v-btn>

              <input ref="fileInput" type="file" accept="video/*" @change="loadVideoFromFile" style="display: none" />
            </div>

            <!-- NOU: TEMPORITZADOR AFEGIT -->
            <v-card class="mt-6 py-4 px-5 text-center rounded-xl timer-card" color="transparent" elevation="10"
              style="width: 85%; border: 2px solid rgba(139, 92, 246, 0.3); backdrop-filter: blur(10px); background: rgba(139, 92, 246, 0.1);">
              <h3 class="text-h6 font-weight-regular mb-3 text-purple-lighten-2">⏱️ TEMPORITZADOR</h3>

              <div v-if="!timerActive" class="d-flex justify-center gap-2 mb-3">
                <v-btn color="#8b5cf6" variant="flat" size="small" rounded="lg" @click="startTimer(1)"
                  :disabled="timerActive">
                  1 min
                </v-btn>
                <v-btn color="#8b5cf6" variant="flat" size="small" rounded="lg" @click="startTimer(2)"
                  :disabled="timerActive">
                  2 min
                </v-btn>
                <v-btn color="#8b5cf6" variant="flat" size="small" rounded="lg" @click="startTimer(5)"
                  :disabled="timerActive">
                  5 min
                </v-btn>
              </div>

              <div v-if="timerActive">
                <h2 class="text-h3 font-weight-bold text-purple-lighten-1 mb-2">{{ formattedTime }}</h2>
                <v-btn color="red-darken-1" variant="outlined" size="small" rounded="lg" @click="stopTimer">
                  <v-icon start>mdi-stop</v-icon>
                  Detener
                </v-btn>
              </div>

              <p v-if="!timerActive && !timerFinished" class="text-caption text-grey-lighten-1 mt-2">
                Selecciona un temps per començar
              </p>
              <p v-if="timerFinished" class="text-h6 text-green-lighten-2 mt-2 font-weight-bold">
                ✅ Temps completat!
              </p>
            </v-card>

            <v-card class="mt-8 py-5 px-6 text-center rounded-xl count-card" color="transparent" elevation="10"
              style="width: 85%; border: 2px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); background: rgba(0, 0, 0, 0.3);">
              <h3 class="text-h6 font-weight-regular mb-2 text-grey-lighten-2">REPETICIONS</h3>
              <h1 class="text-h1 font-weight-black text-cyan-lighten-2 counter-value">{{ count }}</h1>
            </v-card>
            <v-btn color="#22c55e" variant="flat" size="large" rounded="lg" class="mt-4 finalitzar-btn"
              @click="finalitzarSessio">
              🏁 Finalitzar sessió
            </v-btn>
          </v-col>

          <v-col cols="12" md="6"
            class="d-flex flex-column align-center justify-center text-center order-md-2 order-1 mb-10">

            <h2 class="exercise-title mb-8">
              {{ exerciciLabel }}
            </h2>

            <v-card class="rounded-xl overflow-hidden shadow-card" elevation="8" width="100%" max-width="450">
              <img :src="exerciciGif" :alt="exerciciLabel" class="rounded-lg" width="100%"
                style="object-fit: cover; max-height: 400px;" />
            </v-card>

            <p class="text-body-1 text-grey-lighten-3 mb-6 font-italic info-text">
              Segueix l’exemple o utilitza la teva pròpia càmera.
            </p>

            <v-card class="pa-4 pa-sm-5 rounded-xl mb-6 bg-light-card leaderboard-card" elevation="8" width="100%"
              max-width="450">
              <h3 class="text-h6 font-weight-bold text-teal-accent-3 mb-4 ranking-title">
                🏆 CLASSIFICACIÓ
              </h3>

              <v-list density="compact" class="text-grey-lighten-3 bg-transparent ranking-list">
                <v-list-item v-for="(user, index) in leaderboard" :key="user.userId"
                  class="rounded-lg mb-2 pa-2 list-item-glow"
                  :class="index === 0 ? 'bg-top1' : index === 1 ? 'bg-top2' : index === 2 ? 'bg-top3' : 'bg-standard'"
                  style="border: 1px solid rgba(255, 255, 255, 0.05);">
                  <div class="d-flex justify-space-between align-center text-body-1 font-weight-medium">
                    <div>
                      <v-icon size="small" class="mr-3" :color="index === 0 ? 'yellow-accent-4' : 'grey-lighten-2'">
                        {{ index === 0 ? 'mdi-trophy-variant' : 'mdi-account-circle' }}
                      </v-icon>
                      <strong class="mr-2">{{ index + 1 }}.</strong> {{ user.userName }}
                    </div>
                    <span class="font-weight-black" :class="index < 3 ? 'text-h6 text-teal-accent-3' : 'text-body-1'">
                      {{ user.reps }} <span class="text-caption font-weight-light">reps</span>
                    </span>
                  </div>
                </v-list-item>
              </v-list>
              <div v-if="!leaderboard.length" class="text-center text-grey-darken-1 pt-3">
                No hi ha dades a la classificació. Comença a entrenar!
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue' // AFEGIT 'computed'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore';

import SvgIcon from '@jamescoyle/vue-icon'
import { mdiFolderOutline } from '@mdi/js'

// ===================================================================
// 1. GESTIÓN DE GIFS
// ===================================================================
import flexionesGif from '@/assets/flexiones.gif'
import sentadillasGif from '@/assets/sentadillas.gif'
import saltosGif from '@/assets/saltos.gif'
import abdominalesGif from '@/assets/abdominales.gif'
import fonsGif from '@/assets/fons.gif'
import pujadesGif from '@/assets/pujades.gif'

const pathCarregar = mdiFolderOutline

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore();

const exercici = route.params.ejercicio
const codi_acces = route.params.codi_acces

const noms = {
  Flexions: 'FLEXIONS',
  Squats: 'SQUATS',
  Salts: 'SALTS',
  Abdominals: 'ABDOMINALS',
  Fons: 'FONS',
  Pujades: 'PUJADES',
  flexiones: 'FLEXIONS',
  sentadillas: 'ESQUATS',
  saltos: 'SALTS',
  abdominales: 'ABDOMINALS',
  fons: 'FONS',
  pujades: 'PUJADES',
}

const gifs = {
  Flexions: flexionesGif,
  Squats: sentadillasGif,
  Salts: saltosGif,
  Abdominals: abdominalesGif,
  Fons: fonsGif,
  Pujades: pujadesGif,
  flexiones: flexionesGif,
  sentadillas: sentadillasGif,
  saltos: saltosGif,
  abdominales: abdominalesGif,
  fons: fonsGif,
  pujades: pujadesGif,
}

const exerciciLabel = noms[exercici] || noms[exercici.charAt(0).toUpperCase() + exercici.slice(1)] || 'EXERCICI'
const exerciciGif = gifs[exercici] || gifs[exercici.charAt(0).toUpperCase() + exercici.slice(1)] || ''


// ===================================================================
// 2. ESTADO
// ===================================================================
const video = ref(null)
const canvas = ref(null)
const fileInput = ref(null)
const count = ref(0)
const leaderboard = ref([])

let detector = null
let up = false
let streamRef = null
let detecting = false

const ws = ref(null)
const userId = authStore.user.id;
const userName = authStore.userName;


// ===================================================================
// NOU: LÒGICA DEL TEMPORITZADOR
// ===================================================================
const timerActive = ref(false)
const timerFinished = ref(false)
const timeRemaining = ref(0) // en segons
let timerInterval = null

const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

function startTimer(minutes) {
  if (timerActive.value) return

  timeRemaining.value = minutes * 60
  timerActive.value = true
  timerFinished.value = false

  timerInterval = setInterval(() => {
    timeRemaining.value--

    if (timeRemaining.value <= 0) {
      stopTimer()
      timerFinished.value = true
      // Aturar la detecció quan el temps acaba
      if (detecting) {
        stopCamera()
      }
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  timerActive.value = false
}

// ===================================================================
// 3. LIFECYCLE HOOKS
// ===================================================================
onMounted(() => connectWebSocket())

onBeforeUnmount(() => {
  tornar();
})


// ===================================================================
// 4. FUNCIONES DE CÁMARA/VIDEO
// ===================================================================
async function startCamera() {
  try {
    if (video.value?.offsetWidth && video.value?.offsetHeight) {
      canvas.value.width = video.value.offsetWidth;
      canvas.value.height = video.value.offsetHeight;
    } else {
      canvas.value.width = 640;
      canvas.value.height = 480;
    }

    streamRef = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    video.value.srcObject = streamRef
    await video.value.play()
    if (!detector) await initMoveNet()
    if (!detecting) {
      detecting = true
      detectPose()
    }
  } catch (e) {
    console.error('No es pot obrir la càmera:', e.message)
  }
}

function stopCamera() {
  if (streamRef) {
    streamRef.getTracks().forEach((t) => t.stop())
    if (video.value) video.value.srcObject = null;
    streamRef = null
  }
  detecting = false
  const ctx = canvas.value?.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
}

function selectVideo() {
  stopCamera()
  fileInput.value?.click()
}

async function loadVideoFromFile(event) {
  const file = event.target.files[0]
  if (!file) return

  const ctx = canvas.value?.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  const url = URL.createObjectURL(file)
  video.value.srcObject = null
  stopCamera()
  video.value.src = url

  video.value.onloadedmetadata = () => {
    canvas.value.width = video.value.videoWidth;
    canvas.value.height = video.value.videoHeight;
  };

  await video.value.play()
  if (!detector) await initMoveNet()
  detecting = true
  detectVideoFrame()
}

async function initMoveNet() {
  await tf.ready()
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  })
}

async function detectPose() {
  const ctx = canvas.value?.getContext('2d')
  async function poseDetectionFrame() {
    if (!detecting || !video.value || video.value.paused || video.value.ended) return

    if (canvas.value.width !== video.value.videoWidth || canvas.value.height !== video.value.videoHeight) {
      canvas.value.width = video.value.videoWidth || 640;
      canvas.value.height = video.value.videoHeight || 480;
    }

    const poses = await detector.estimatePoses(video.value, { flipHorizontal: false })

    if (poses.length > 0) {
      drawPose(ctx, poses[0])
      // MODIFICAT: Només comprovar moviment si el temporitzador està actiu
      if (timerActive.value && !timerFinished.value) {
        checkMoviment(poses[0])
      }
    }
    requestAnimationFrame(poseDetectionFrame)
  }
  requestAnimationFrame(poseDetectionFrame)
}

async function detectVideoFrame() {
  const ctx = canvas.value?.getContext('2d')
  async function frameLoop() {
    if (!detecting || !video.value || video.value.paused || video.value.ended) {
      if (video.value?.ended) {
        detecting = false;
      }
      return
    }

    if (canvas.value.width !== video.value.videoWidth || canvas.value.height !== video.value.videoHeight) {
      canvas.value.width = video.value.videoWidth || 640;
      canvas.value.height = video.value.videoHeight || 480;
    }

    const poses = await detector.estimatePoses(video.value)
    if (poses.length > 0) {
      drawPose(ctx, poses[0])
      // MODIFICAT: Només comprovar moviment si el temporitzador està actiu
      if (timerActive.value && !timerFinished.value) {
        checkMoviment(poses[0])
      }
    }
    requestAnimationFrame(frameLoop)
  }
  requestAnimationFrame(frameLoop)
}

function drawPose(ctx, pose) {
  const videoElement = video.value;
  const canvasElement = canvas.value;

  if (!videoElement || !canvasElement || !pose || !pose.keypoints) return;
  const videoDisplayedWidth = videoElement.offsetWidth;
  const videoDisplayedHeight = videoElement.offsetHeight;

  const videoNaturalWidth = videoElement.videoWidth;
  const videoNaturalHeight = videoElement.videoHeight;

  if (canvasElement.width !== videoDisplayedWidth || canvasElement.height !== videoDisplayedHeight) {
    canvasElement.width = videoDisplayedWidth;
    canvasElement.height = videoDisplayedHeight;
  }

  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  const videoAspectRatio = videoNaturalWidth / videoNaturalHeight;
  const canvasAspectRatio = videoDisplayedWidth / videoDisplayedHeight;

  let scaleFactor;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspectRatio > canvasAspectRatio) {
    scaleFactor = videoDisplayedHeight / videoNaturalHeight;
    offsetX = (videoDisplayedWidth - videoNaturalWidth * scaleFactor) / 2;
  } else {
    scaleFactor = videoDisplayedWidth / videoNaturalWidth;
    offsetY = (videoDisplayedHeight - videoNaturalHeight * scaleFactor) / 2;
  }

  const transformPoint = (kp) => {
    if (!kp) return null;
    return {
      x: kp.x * scaleFactor + offsetX,
      y: kp.y * scaleFactor + offsetY
    };
  };

  ctx.fillStyle = '#00ffaa';
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#00ffaa';

  for (const kp of pose.keypoints) {
    if (kp.score > 0.4) {
      const transformed = transformPoint(kp);
      ctx.beginPath();
      ctx.arc(transformed.x, transformed.y, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  const connections = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#8b5cf6';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#8b5cf6';

  for (const [i, j] of connections) {
    const kp1 = pose.keypoints[i];
    const kp2 = pose.keypoints[j];

    if (kp1.score > 0.4 && kp2.score > 0.4) {
      const p1 = transformPoint(kp1);
      const p2 = transformPoint(kp2);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 0;
}


// ===================================================================
// 5. LÓGICA DE MOVIMIENTO
// ===================================================================

function handleRepCount() {
  count.value++;
  up = false;
  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({ type: 'update', reps: count.value }));
  }
}

function checkMoviment(pose) {
  switch (exercici) {
    case 'flexiones':
      checkFlexio(pose);
      break;
    case 'sentadillas':
      checkEsquat(pose);
      break;
    case 'saltos':
      checkSalt(pose);
      break;
    case 'abdominales':
      checkAbdominal(pose);
      break;
    case 'fons':
      checkFons(pose);
      break;
    case 'pujades':
      checkPujades(pose);
      break;
  }
}

function checkFlexio(pose) {
  const espatlla = pose.keypoints.find(k => k.name === 'left_shoulder')
  const canell = pose.keypoints.find(k => k.name === 'left_wrist')
  if (!espatlla || !canell || espatlla.score < 0.4 || canell.score < 0.4) return
  const dist = Math.abs(espatlla.y - canell.y)
  const UMBRAL_ARRIBA = 200, UMBRAL_ABAJO = 100
  if (dist < UMBRAL_ABAJO && !up) up = true
  if (dist > UMBRAL_ARRIBA && up) handleRepCount()
}

function checkEsquat(pose) {
  const maluc = pose.keypoints.find(k => k.name === 'left_hip')
  const genoll = pose.keypoints.find(k => k.name === 'left_knee')
  if (!maluc || !genoll || maluc.score < 0.4 || genoll.score < 0.4) return
  const dist = Math.abs(maluc.y - genoll.y)
  const UMBRAL_ARRIBA = 160, UMBRAL_ABAJO = 100
  if (dist < UMBRAL_ABAJO && !up) up = true
  if (dist > UMBRAL_ARRIBA && up) handleRepCount()
}

let initialY = null;
let jumping = false;
function checkSalt(pose) {
  const peu = pose.keypoints.find(k => k.name === 'left_ankle')
  if (!peu || peu.score < 0.4) return
  if (initialY === null) initialY = peu.y
  const delta = initialY - peu.y
  const UMBRAL_SALT = 60
  if (delta > UMBRAL_SALT && !jumping) {
    jumping = true
  } else if (delta < 10 && jumping) {
    jumping = false;
    handleRepCount();
  }
}

function checkAbdominal(pose) {
  const nas = pose.keypoints.find((k) => k.name === 'nose')
  const maluc = pose.keypoints.find((k) => k.name === 'left_hip')
  if (!nas || !maluc || nas.score < 0.4 || maluc.score < 0.4) return

  const distancia = Math.abs(nas.y - maluc.y)
  const UMBRAL_ARRIBA = 150;
  const UMBRAL_ABAJO = 100;

  if (distancia < UMBRAL_ABAJO && !up) {
    up = true;
  }

  if (distancia > UMBRAL_ARRIBA && up) {
    handleRepCount();
  }
}

function checkFons(pose) {
  const espatlla = pose.keypoints.find(k => k.name === 'left_shoulder')
  const colze = pose.keypoints.find(k => k.name === 'left_elbow')
  if (!espatlla || !colze || espatlla.score < 0.4 || colze.score < 0.4) return
  const dist = Math.abs(espatlla.y - colze.y)
  const UMBRAL_ARRIBA = 100, UMBRAL_ABAJO = 50
  if (dist < UMBRAL_ABAJO && !up) up = true
  if (dist > UMBRAL_ARRIBA && up) handleRepCount()
}

function checkPujades(pose) {
  const genoll = pose.keypoints.find(k => k.name === 'left_knee')
  const peu = pose.keypoints.find(k => k.name === 'left_ankle')
  if (!genoll || !peu || genoll.score < 0.4 || peu.score < 0.4) return
  const dist = Math.abs(genoll.y - peu.y)
  const UMBRAL_ABAJO = 200, UMBRAL_ARRIBA = 300
  if (dist < UMBRAL_ABAJO && !up) up = true
  if (dist > UMBRAL_ARRIBA && up) handleRepCount()
}


// ===================================================================
// 6. WEBSOCKET
// ===================================================================

function connectWebSocket() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.host;
  const wsUrl = `${wsProtocol}//${wsHost}/ws`;

  console.log(`Connectant a WebSocket a: ${wsUrl}`);

  ws.value = new WebSocket(wsUrl);

  ws.value.onopen = () => {
    console.log('Connectat al servidor WebSocket');
    ws.value.send(JSON.stringify({ type: 'join', codi_acces, userId, userName }));
  };
  ws.value.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'leaderboard') {
      leaderboard.value = message.leaderboard;
    }
  };
  ws.value.onclose = () => console.log('Desconnectat del servidor');
  ws.value.onerror = (err) => console.error('Error WebSocket:', err);
}


// ===================================================================
// 7. NAVEGACIÓN
// ===================================================================

function tornar() {
  stopCamera();
  stopTimer(); // AFEGIT: Aturar el temporitzador en sortir

  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({
      type: 'finish',
      reps: count.value,
      exercici: exercici,
      codi_acces: codi_acces
    }));

    ws.value.send(JSON.stringify({ type: 'leave' }));
    ws.value.close();
    ws.value = null;
  }

  router.back()
}

// ===================================================================
// 7. ACABAR SESSIÓ
// ===================================================================

function finalitzarSessio() {
  stopCamera();
  stopTimer();

  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({
      type: 'finish',
      reps: count.value,
      exercici: exercici,
      codi_acces: codi_acces
    }));

    ws.value.send(JSON.stringify({ type: 'leave' }));
    ws.value.close();
    ws.value = null;
  }

  // Redirigir a la pàgina d'estadístiques
  router.push({
    name: 'EstadistiquesSessio',
    params: {
      reps: count.value,
      exercici: exercici,
      codi_acces: codi_acces
    }
  });
}
</script>

<style scoped>
/* ==================================== */
/* ======== FONDO Y LAYOUT ======== */
/* ==================================== */
.bg-fitai-deep-space {
  background:
    radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
    radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 40%),
    linear-gradient(135deg, #0e111d, #141829 50%, #0e111d 100%);
  background-attachment: fixed;
  background-size: cover;
  min-height: 100vh;
}

.fade-in-container {
  animation: fadeInUp 0.8s cubic-bezier(0.17, 0.84, 0.44, 1) forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.position-relative {
  position: relative;
}

/* ==================================== */
/* ======== BOTÓN SUPERIOR IZQUIERDO (MÁS GRANDE Y NEÓN) ======== */
/* ==================================== */
.top-left-back-btn {
  position: absolute;
  top: 15px;
  left: 15px;
  z-index: 10;
  color: white !important;
  background: #8b5cf6 !important;
  border-radius: 8px !important;
  font-weight: 700 !important;
  box-shadow: 0 0 15px rgba(139, 92, 246, 1);
  transition: all 0.3s ease;
  min-width: 120px;
  margin-top: 10px;
}

.top-left-back-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(139, 92, 246, 1.2);
}

/* ==================================== */
/* ======== TÍTULO EXERCICI (ANIMADO) ======== */
/* ==================================== */
.exercise-title {
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: linear-gradient(90deg, #8b5cf6, #3b82f6, #00ffaa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradientShift 6s ease infinite;
  position: relative;
  line-height: 1.1;
  text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}

@media (min-width: 600px) {
  .exercise-title {
    font-size: 3rem;
  }
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}


/* ==================================== */
/* ======== CÁMARA Y CONTADOR ======== */
/* ==================================== */
.shadow-card {
  box-shadow: 0 8px 35px rgba(0, 0, 0, 0.6);
  transition: transform 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.shadow-card:hover {
  transform: translateY(-2px);
}

.count-card {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
}

.counter-value {
  letter-spacing: 3px;
  text-shadow: 0px 0px 18px rgba(59, 130, 246, 0.9);
  font-size: 4rem !important;
}

@media (min-width: 600px) {
  .counter-value {
    font-size: 5rem !important;
  }
}

/* NOU: Estils per al temporitzador */
.timer-card {
  animation: timerPulse 2.5s ease-in-out infinite;
}

@keyframes timerPulse {

  0%,
  100% {
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
  }

  50% {
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
  }
}

/* ==================================== */
/* ======== BOTONES DE ACCIÓN ======== */
/* ==================================== */
.small-btn-group {
  gap: 12px;
}

.control-btn-large {
  font-size: 1rem;
  padding: 8px 16px !important;
  min-width: 140px;
  font-weight: 700;
  letter-spacing: 0.5px;
  transition: all 0.25s ease-in-out;
  border-radius: 8px !important;
}

@media (max-width: 450px) {
  .control-btn-large {
    min-width: 120px;
    font-size: 0.9rem;
    padding: 6px 12px !important;
  }
}

.action-btn {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(130, 90, 255, 0.6);
  filter: brightness(1.1);
}


/* ==================================== */
/* ======== CLASIFICACIÓN (LEADERBOARD) ======== */
/* ==================================== */
.leaderboard-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ranking-title {
  text-shadow: 0 0 8px rgba(0, 255, 170, 0.7);
}

.bg-top1 {
  background: rgba(255, 215, 0, 0.15) !important;
  border-left: 5px solid #ffd700 !important;
}

.bg-top2 {
  background: rgba(192, 192, 192, 0.15) !important;
  border-left: 5px solid #c0c0c0 !important;
}

.bg-top3 {
  background: rgba(176, 141, 87, 0.15) !important;
  border-left: 5px solid #b08d57 !important;
}

.bg-standard {
  background: rgba(255, 255, 255, 0.03) !important;
}

.list-item-glow {
  transition: all 0.3s ease;
}

.list-item-glow:hover {
  transform: translateX(4px);
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
}

.finalitzar-btn {
  font-weight: 700;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.6);
  transition: all 0.25s ease-in-out;
}

.finalitzar-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.8);
}
</style>
