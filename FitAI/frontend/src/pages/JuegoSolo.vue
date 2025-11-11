<template>
  <v-app>
    <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
      <v-container
        class="text-center text-white pa-4 pa-md-8 fade-in-container expanded-container position-relative"
        style="max-width: 1400px;"
      >
        <v-btn
          class="top-left-back-btn rectangular-btn"
          variant="flat"
          size="large"
          prepend-icon="mdi-arrow-left"
          @click="tornar"
        >
          Tornar
        </v-btn>

        <v-row class="mt-16 mt-md-0">
          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center order-md-1 order-2">
            
            <v-card
              class="rounded-xl overflow-hidden shadow-card video-card"
              elevation="12"
              width="100%"
              style="background-color: #000; position: relative;"
            >
              <video
                ref="video"
                autoplay
                playsinline
                muted
                width="100%"
                class="rounded-xl"
                style="object-fit: cover;"
              ></video>
              <canvas
                ref="canvas"
                width="640"
                height="480"
                style="position:absolute; top:0; left:0;"
              ></canvas>
            </v-card>

            <div class="mt-6 d-flex flex-wrap justify-center gap-2 small-btn-group">
              <v-btn
                color="#8b5cf6"
                variant="flat"
                size="large"
                rounded="lg"
                class="control-btn-large action-btn"
                @click="startCamera"
              >
                <v-icon start>mdi-video-outline</v-icon>
                Càmera
              </v-btn>

              <v-btn
                color="red-darken-1"
                variant="outlined"
                size="large"
                rounded="lg"
                class="control-btn-large"
                @click="stopCamera"
              >
                <v-icon start>mdi-stop-circle-outline</v-icon>
                Aturar
              </v-btn>

              <v-btn
                color="#3b82f6"
                variant="flat"
                size="large"
                rounded="lg"
                class="control-btn-large action-btn"
                @click="selectVideo"
              >
                <svg-icon type="mdi" :path="pathCarregar" class="mr-1" width="22" height="22" />Vídeo
              </v-btn>

              <input
                ref="fileInput"
                type="file"
                accept="video/*"
                @change="loadVideoFromFile"
                style="display: none"
              />
            </div>

            <v-card
              class="mt-8 py-5 px-6 text-center rounded-xl count-card"
              color="transparent"
              elevation="10"
              style="width: 85%; border: 2px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); background: rgba(0, 0, 0, 0.3);"
            >
              <h3 class="text-h6 font-weight-regular mb-2 text-grey-lighten-2">REPETICIONS</h3>
              <h1 class="text-h1 font-weight-black text-cyan-lighten-2 counter-value">{{ count }}</h1>
            </v-card>
          </v-col>

          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center text-center order-md-2 order-1 mb-10">
            
            <h2 class="exercise-title mb-8">
              {{ exerciciLabel }}
            </h2>

            <v-card class="rounded-xl overflow-hidden shadow-card" elevation="8" width="100%" max-width="450">
              <img
                :src="exerciciGif"
                :alt="exerciciLabel"
                class="rounded-lg"
                width="100%"
                style="object-fit: cover; max-height: 400px;"
              />
            </v-card>

            <p class="text-body-1 text-grey-lighten-3 mb-6 font-italic info-text">
              Segueix l’exemple o utilitza la teva pròpia càmera.
            </p>

            <v-card
              class="pa-4 pa-sm-5 rounded-xl mb-6 bg-light-card leaderboard-card"
              elevation="8"
              width="100%"
              max-width="450"
            >
              <h3 class="text-h6 font-weight-bold text-teal-accent-3 mb-4 ranking-title">
                🏆 CLASSIFICACIÓ
              </h3>

              <v-list density="compact" class="text-grey-lighten-3 bg-transparent ranking-list">
                <v-list-item
                  v-for="(user, index) in leaderboard"
                  :key="user.userId"
                  class="rounded-lg mb-2 pa-2 list-item-glow"
                  :class="index === 0 ? 'bg-top1' : index === 1 ? 'bg-top2' : index === 2 ? 'bg-top3' : 'bg-standard'"
                  style="border: 1px solid rgba(255, 255, 255, 0.05);"
                >
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'
import { useRoute, useRouter } from 'vue-router'

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

const exercici = route.params.ejercicio
// !! IMPORTANT: Assegura't que 'sessionId' és el 'codi_acces'
const sessionId = route.params.sessionId // Això ha de ser el teu 'codi_acces'

const noms = {
  flexiones: 'FLEXIONS',
  sentadillas: 'ESQUATS',
  saltos: 'SALTS',
  abdominales: 'ABDOMINALS',
  fons: 'FONS',
  pujades: 'PUJADES',
}

const gifs = {
  flexiones: flexionesGif,
  sentadillas: sentadillasGif,
  saltos: saltosGif,
  abdominales: abdominalesGif,
  fons: fonsGif,
  pujades: pujadesGif,
}

const exerciciLabel = noms[exercici] || 'EXERCICI'
const exerciciGif = gifs[exercici] || ''

// ===================================================================
// 2. ESTADO (MODIFICAT PER AL NOM D'USUARI)
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

// !! MODIFICACIÓ AQUÍ !!
// Obtenim un ID i Nom estables del localStorage
// (Aquests noms 'fitaiUserName' i 'fitaiUserId' són exemples,
// utilitza els que facis servir al teu login)
const userName = ref(localStorage.getItem('fitaiUserName') || 'Convidat'); 
let storedUserId = localStorage.getItem('fitaiUserId'); // L'ID d'usuari de la BBDD

if (!storedUserId) {
  // Si no hi ha ID d'usuari (ex: no loguejat), generem un temporal
  // Idealment, l'usuari hauria d'estar loguejat i tenir un ID real
  console.warn("No s'ha trobat 'fitaiUserId' a localStorage. S'utilitzarà un ID aleatori.");
  storedUserId = `usuari_anonim_${Math.floor(Math.random() * 10000)}`;
}
const userId = ref(storedUserId);


// ===================================================================
// 3. LIFECYCLE HOOKS
// ===================================================================
onMounted(() => {
  // Assegura't que sessionId (el codi d'accés) existeix abans de connectar
  if (sessionId) {
    connectWebSocket();
  } else {
    console.error("No s'ha proporcionat cap codi d'accés (sessionId) a la ruta.");
    // Podries redirigir l'usuari o mostrar un error
  }
})

onBeforeUnmount(() => {
  stopCamera();
  if (ws.value?.readyState === WebSocket.OPEN) {
    // Envia 'leave' abans de tancar (opcional, ja que 'close' ho gestiona)
    ws.value.send(JSON.stringify({ type: 'leave' }))
    ws.value.close()
  }
})

// ===================================================================
// 4. FUNCIONES DE CÁMARA/VIDEO (Correccions de 'race condition' incloses)
// ===================================================================

async function startCamera() {
  try {
    if (video.value.offsetWidth && video.value.offsetHeight) {
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
    video.value.srcObject = null
    streamRef = null
  }
  // Aturem la detecció i netegem el canvas
  detecting = false;
  if (canvas.value) {
    const ctx = canvas.value.getContext('2d');
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  }
  // Neteja l'element de vídeo
  if(video.value) {
    video.value.srcObject = null;
    video.value.src = null;
  }
}

function selectVideo() {
  stopCamera()
  fileInput.value?.click()
}

async function loadVideoFromFile(event) {
  const file = event.target.files[0]
  if (!file) return
  
  if (!file.type.startsWith('video/mp4') && !file.type.startsWith('video/webm')) {
    console.warn('Format de vídeo no recomanat. Si us plau, utilitza MP4 o WebM.');
  }
  
  const ctx = canvas.value.getContext('2d');
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  const url = URL.createObjectURL(file)
  video.value.srcObject = null
  // stopCamera() // stopCamera() ja s'ha cridat a selectVideo
  video.value.src = url
  
  video.value.onloadedmetadata = async () => {
    // Ajustem el canvas a la mida VISIBLE del vídeo
    canvas.value.width = video.value.offsetWidth;
    canvas.value.height = video.value.offsetHeight;
    
    if (!detector) await initMoveNet()
    
    detecting = true
    detectVideoFrame() // Inicia el bucle de detecció
    
    await video.value.play()
  };
}

async function initMoveNet() {
  await tf.ready()
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  })
}

async function detectPose() {
  const ctx = canvas.value.getContext('2d')
  async function poseDetectionFrame() {
    if (!detecting || !video.value || video.value.paused || video.value.ended) {
      if (!detecting) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
      return; // Atura el bucle si la detecció està desactivada
    }
    
    const poses = await detector.estimatePoses(video.value, { flipHorizontal: false })

    if (poses.length > 0) {
      drawPose(ctx, poses[0])
      checkMoviment(poses[0])
    }
    requestAnimationFrame(poseDetectionFrame) // Continua el bucle
  }
  poseDetectionFrame() // Inicia el bucle
}

async function detectVideoFrame() {
  const ctx = canvas.value.getContext('2d')
  async function frameLoop() {
    if (!detecting || !video.value || video.value.paused || video.value.ended) {
        if (video.value && video.value.ended) {
             console.log("El vídeo ha acabat.");
             detecting = false;
        }
        if (!detecting) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
        return // Atura el bucle
    }
    
    const poses = await detector.estimatePoses(video.value)
    if (poses.length > 0) {
      drawPose(ctx, poses[0])
      checkMoviment(poses[0])
    }
    requestAnimationFrame(frameLoop) // Continua el bucle
  }
  frameLoop() // Inicia el bucle
}

// ===================================================================
// 5. DRAWPOSE (Sense canvis)
// ===================================================================

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
  
  // Dibuixar punts clau
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

  // Dibuixar esquelet
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
// 5.1. FUNCIÓ AUXILIAR D'ANGLE (Sense canvis)
// ===================================================================

function getAngle(keypoints, p1Name, p2Name, p3Name) {
  const p1 = keypoints.find((k) => k.name === p1Name);
  const p2 = keypoints.find((k) => k.name === p2Name);
  const p3 = keypoints.find((k) => k.name === p3Name);

  if (!p1 || !p2 || !p3 || p1.score < 0.4 || p2.score < 0.4 || p3.score < 0.4) {
    return null;
  }

  const radianes =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) -
    Math.atan2(p1.y - p2.y, p1.x - p2.x);
 let angle = Math.abs(radianes * (180 / Math.PI));
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
}


// ===================================================================
// 6. LÒGICA DE MOVIMENT (ACTUALITZADA)
// ===================================================================

function checkMoviment(pose) {
  // Envia l'estat actual al WS (aquesta part s'ha de fer aquí)
  // Només envia si el recompte canvia (dins de cada funció 'check')
  // ...

  // Comprova l'exercici específic
  if (exercici === 'abdominales') checkAbdominal(pose)
  if (exercici === 'flexiones') checkFlexiones(pose)
  if (exercici === 'sentadillas') checkSentadillas(pose)
  if (exercici === 'saltos') checkSaltos(pose)
  if (exercici === 'fons') checkFons(pose)
  if (exercici === 'pujades') checkPujades(pose)
}

function sendRepUpdate() {
  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({ type: 'update', reps: count.value }));
  }
}

// !! FUNCIÓ ACTUALITZADA !! (Lògica d'angles)
function checkAbdominal(pose) {
    const angleL = getAngle(pose.keypoints, 'left_shoulder', 'left_hip', 'left_knee');
    const angleR = getAngle(pose.keypoints, 'right_hip', 'right_knee', 'right_ankle');
    const angle = angleL !== null ? angleL : angleR; // Prioritza el costat esquerre

    if (angle === null) return;

    const UMBRAL_AVALL = 150; // Angle gran (estirat)
    const UMBRAL_AMUNT = 120; // Angle tancat (encongit)

    // Fase 1: Estirat (preparat per pujar)
    if (angle > UMBRAL_AVALL && !up) {
        up = true;
    }

    // Fase 2: Encongit (repetición completada)
    if (angle < UMBRAL_AMUNT && up) {
        count.value++;
        up = false;
        sendRepUpdate(); // Envia actualització
    }
}

// (Sense canvis, ja feia servir angles)
function checkFlexiones(pose) {
  const angleL = getAngle(pose.keypoints, 'left_shoulder', 'left_elbow', 'left_wrist');
  const angleR = getAngle(pose.keypoints, 'right_shoulder', 'right_elbow', 'right_wrist');
  const angle = angleL !== null && (angleR === null || angleL > angleR) ? angleL : angleR;
  if (angle === null) return;

  const UMBRAL_ABAJO = 90; 
  const UMBRAL_ARRIBA = 160; 

  if (angle < UMBRAL_ABAJO && !up) {
      up = true;
  }
  if (angle > UMBRAL_ARRIBA && up) {
    count.value++;
    up = false;
    sendRepUpdate();
  }
}

// (Sense canvis, ja feia servir angles)
function checkSentadillas(pose) {
  const angleL = getAngle(pose.keypoints, 'left_hip', 'left_knee', 'left_ankle');
  const angleR = getAngle(pose.keypoints, 'right_hip', 'right_knee', 'right_ankle');
  const angle = angleL !== null && (angleR === null || angleL > angleR) ? angleL : angleR;
  if (angle === null) return;

  const UMBRAL_ABAJO = 90;
  const UMBRAL_ARRIBA = 165; 

  if (angle < UMBRAL_ABAJO && !up) {
      up = true;
  }
  if (angle > UMBRAL_ARRIBA && up) {
    count.value++;
    up = false;
    sendRepUpdate();
  }
}

// (Sense canvis, ja feia servir ràtios)
function checkSaltos(pose) {
  const shoulderL = pose.keypoints.find((k) => k.name === 'left_shoulder');
  const shoulderR = pose.keypoints.find((k) => k.name === 'right_shoulder');
  const wristL = pose.keypoints.find((k) => k.name === 'left_wrist');
  const ankleL = pose.keypoints.find((k) => k.name === 'left_ankle');
  const ankleR = pose.keypoints.find((k) => k.name === 'right_ankle');

  if (!shoulderL || !shoulderR || !wristL || !ankleL || !ankleR ||
      shoulderL.score < 0.4 || shoulderR.score < 0.4 || wristL.score < 0.4 || 
      ankleL.score < 0.4 || ankleR.score < 0.4) {
    return;
  }

  const brazosArriba = wristL.y < shoulderL.y;
  const shoulderWidth = Math.abs(shoulderL.x - shoulderR.x);
  const distanciaPies = Math.abs(ankleL.x - ankleR.x);
  const UMBRAL_PIES_ABIERTO_RATIO = 1.5; 
  const UMBRAL_PIES_CERRADO_RATIO = 0.5;
  const piesAbiertos = distanciaPies > (shoulderWidth * UMBRAL_PIES_ABIERTO_RATIO);
  const piesCerrados = distanciaPies < (shoulderWidth * UMBRAL_PIES_CERRADO_RATIO);

  if (brazosArriba && piesAbiertos && !up) {
      up = true;
  }
  if (!brazosArriba && piesCerrados && up) {
    count.value++;
    up = false;
    sendRepUpdate();
  }
}

// (Sense canvis, ja feia servir angles)
function checkFons(pose) {
  const angleL = getAngle(pose.keypoints, 'left_shoulder', 'left_elbow', 'left_wrist');
  const angleR = getAngle(pose.keypoints, 'right_shoulder', 'right_elbow', 'right_wrist');
  const angle = angleL !== null && (angleR === null || angleL > angleR) ? angleL : angleR;
  if (angle === null) return;

  const UMBRAL_ABAJO = 90;
  const UMBRAL_ARRIBA = 160;

  if (angle < UMBRAL_ABAJO && !up) {
      up = true;
  }
  if (angle > UMBRAL_ARRIBA && up) {
    count.value++;
    up = false;
    sendRepUpdate();
  }
}

// !! FUNCIÓ ACTUALITZADA !! (Lògica de ràtios)
function checkPujades(pose) {
    const shoulderL = pose.keypoints.find((k) => k.name === 'left_shoulder');
    const shoulderR = pose.keypoints.find((k) => k.name === 'right_shoulder');
    const hipL = pose.keypoints.find((k) => k.name === 'left_hip');
    const kneeL = pose.keypoints.find((k) => k.name === 'left_knee');
    const ankleL = pose.keypoints.find((k) => k.name === 'left_ankle');
    const hipR = pose.keypoints.find((k) => k.name === 'right_hip');
    const kneeR = pose.keypoints.find((k) => k.name === 'right_knee');
    const ankleR = pose.keypoints.find((k) => k.name === 'right_ankle');

    if (!shoulderL || !shoulderR) return;

    // Unitats de mesura relatives
    const shoulderWidth = Math.abs(shoulderL.x - shoulderR.x);
    // Estimació de la longitud del tors (fallback si el maluc no es veu)
    const torsoLengthL = (hipL && shoulderL.score > 0.4 && hipL.score > 0.4) 
                         ? Math.abs(shoulderL.y - hipL.y) 
                         : shoulderWidth * 1.5;

    const checkLeg = (hip, knee, ankle) => {
        if (!hip || !knee || !ankle || hip.score < 0.4 || knee.score < 0.4 || ankle.score < 0.4) return false;

        // 1. Genoll per sobre del maluc
        const rodillaArriba = knee.y < hip.y;
        
        // 2. RÀTIO: Distància vertical genoll-turmell > 50% longitud tors
        const distanciaKneeAnkle = Math.abs(knee.y - ankle.y);
        const UMBRAL_PIERNA_DOBLADA_RATIO = 0.5;
        const piernaDoblada = distanciaKneeAnkle > (torsoLengthL * UMBRAL_PIERNA_DOBLADA_RATIO);

        // 3. RÀTIO: Distància horitzontal genoll-maluc < 50% amplada espatlles
        const distanciaHorizontal = Math.abs(knee.x - hip.x);
        const UMBRAL_HORIZONTAL_RATIO = 0.5;
        const rodillaCentrada = distanciaHorizontal < (shoulderWidth * UMBRAL_HORIZONTAL_RATIO);

        return rodillaArriba && piernaDoblada && rodillaCentrada;
    }
    
    const piernaArriba = checkLeg(hipL, kneeL, ankleL) || checkLeg(hipR, kneeR, ankleR);

    // Fase 1: Genoll amunt
    if (piernaArriba && !up) {
        up = true;
    }

    // Fase 2: Genoll avall (cap cama compleix la condició)
    if (!piernaArriba && up) {
        count.value++;
        up = false;
        sendRepUpdate();
    }
}


// ===================================================================
// 7. WEBSOCKET (ACTUALITZAT AMB 'userName')
// ===================================================================

function connectWebSocket() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.host; // Això apunta al teu servidor (ex: localhost:4000)
  const wsUrl = `${wsProtocol}//${wsHost}/ws`;
  
  console.log(`Connectant a WebSocket a: ${wsUrl}`);

  ws.value = new WebSocket(wsUrl); 

  ws.value.onopen = () => {
    console.log('Connectat al servidor WebSocket');
    
    // !! MODIFICACIÓ CLAU AQUÍ !!
    // Enviem el 'userName' i assegurem que 'sessionId' és el 'codi_acces'
    ws.value.send(JSON.stringify({ 
      type: 'join', 
      codi_acces: sessionId, // Envia 'codi_acces' que ve de la ruta
      userId: userId.value,
      userName: userName.value 
    }));
  };

  ws.value.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    // Debug: Mostra tots els missatges rebuts
    // console.log("WS Rebut:", message); 

    if (message.type === 'leaderboard') {
      leaderboard.value = message.leaderboard;
    }
    if (message.type === 'error') {
      console.error('Error del servidor WS:', message.message);
      // Aquí podries mostrar un error a l'usuari
    }
    if (message.type === 'joined') {
      console.log(`Unit correctament a la sala: ${message.codi_acces}`);
    }
  };

  ws.value.onclose = () => {
    console.log('Desconnectat del servidor');
    // Aquí podries intentar reconnectar si no és un tancament intencionat
  };
  
  ws.value.onerror = (err) => {
    console.error('Error WebSocket:', err);
  };
}

// ===================================================================
// 8. NAVEGACIÓ I FINALITZACIÓ
// ===================================================================

function finalitzarExercici() {
  stopCamera();
  if (ws.value?.readyState === WebSocket.OPEN) {
    // 1. Enviar dades finals a la BBDD
    ws.value.send(JSON.stringify({
      type: 'finish',
      reps: count.value,
      exercici: exercici, // Assegura't que 'exercici' té el nom correcte
      codi_acces: sessionId
    }));
    
    // 2. Sortir de la sala
    ws.value.send(JSON.stringify({ type: 'leave' }));
  }
}

function tornar() {
  // Abans de tornar, ens assegurem de guardar dades i sortir
  finalitzarExercici();
  
  // Esperem un moment perquè els missatges WS s'enviïn
  setTimeout(() => {
    router.back(); // Torna a la pàgina anterior
  }, 100); // 100ms de marge
}

</script>

<style scoped>
/* ==================================== */
/* ======== FONDO Y LAYOUT ======== */
/* ==================================== */
.bg-fitai-deep-space {
  /* Fondo oscuro dinámico con brillo sutil */
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

  /* Asegurar que no se solape con el título */
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
  /* Tamaño de fuente responsive */
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: linear-gradient(90deg, #8b5cf6, #3b82f6, #00ffaa); /* Mezcla de colores neón */
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
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}


/* ==================================== */
/* ======== CÁMARA Y CONTADOR ======== */
/* ==================================== */
.shadow-card {
  box-shadow: 0 8px 35px rgba(0, 0, 0, 0.6);
  transition: transform 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05); /* Added subtle border */
}
.shadow-card:hover {
    transform: translateY(-2px);
}

/* CONTADOR (Deep Space Glass) */
.count-card {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
}
.counter-value {
    letter-spacing: 3px;
    /* Ajuste de color a azul neón para mejor armonía con el tema */
    text-shadow: 0px 0px 18px rgba(59, 130, 246, 0.9); 
    font-size: 4rem !important;
}
@media (min-width: 600px) {
  .counter-value {
    font-size: 5rem !important;
  }
}

/* ==================================== */
/* ======== BOTONES DE ACCIÓN (Grandes/Responsive) ======== */
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

/* Ajuste para móviles para evitar que los botones se salgan de la pantalla */
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
    /* Sombra más definida para el título del ranking */
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
     /* Fondo ligeramente más sutil para los no-ganadores */
     background: rgba(255, 255, 255, 0.03) !important;
}
.list-item-glow {
    transition: all 0.3s ease;
}
.list-item-glow:hover {
    transform: translateX(4px);
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
}

</style>