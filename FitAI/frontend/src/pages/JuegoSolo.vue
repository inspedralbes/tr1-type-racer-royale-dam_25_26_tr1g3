<template>
  <v-app>
    <v-main
      class="d-flex align-center justify-center pa-8"
      style="background: linear-gradient(135deg, #0f0a1c, #261f4c, #130e2b); min-height: 100vh;"
    >
      <v-container
        class="rounded-3xl pa-8 pa-md-12 elevation-20 bg-glass expanded-container"
        style="max-width: 1400px; backdrop-filter: blur(25px); border: 2px solid rgba(255, 255, 255, 0.08);"
      >

        <v-row>

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
                color="#8c58ff"
                variant="flat"
                size="small"
                rounded="lg"
                class="control-btn-small action-btn"
                @click="startCamera"
              >
                <v-icon start size="18">mdi-video-outline</v-icon>
                Obrir càmera
              </v-btn>

              <v-btn
                color="red-lighten-1"
                variant="outlined"
                size="small"
                rounded="lg"
                class="control-btn-small"
                @click="stopCamera"
              >
                <v-icon start size="18">mdi-stop-circle-outline</v-icon>
                Aturar
              </v-btn>

              <v-btn
                color="teal-accent-4"
                variant="flat"
                size="small"
                rounded="lg"
                class="control-btn-small action-btn"
                @click="selectVideo"
              >
                <svg-icon type="mdi" :path="pathCarregar" class="mr-1" width="18" height="18" />Carregar vídeo
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
              style="width: 85%;"
            >
              <h3 class="text-h6 font-weight-regular mb-1 text-grey-lighten-2">REPETICIONS</h3>
              <h1 class="text-h1 font-weight-black text-cyan-lighten-2 counter-value">{{ count }}</h1>
            </v-card>
          </v-col>

          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center text-center order-md-2 order-1">
            <h2 class="text-h4 font-weight-light mb-2 text-white drop-title">
              EXERCICI
            </h2>
             <h3 class="text-h3 font-weight-extrabold mb-5 text-purple-lighten-2 drop-title-strong">
               {{ exerciciLabel.toUpperCase() }}
             </h3>

            <v-card class="rounded-xl overflow-hidden mb-4 shadow-card" elevation="8" width="100%">
              <img
                :src="exerciciGif"
                :alt="exerciciLabel"
                class="rounded-lg"
                width="100%"
                style="object-fit: cover;"
              />
            </v-card>

            <v-card
              class="pa-5 rounded-xl mb-6 bg-light-card"
              elevation="8"
              width="100%"
            >
              <h3 class="text-h5 font-weight-bold text-teal-accent-3 mb-4">
                🏆 RECORD PERSONAL & CLASSIFICACIÓ
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
                      <v-icon small class="mr-3" :color="index === 0 ? 'yellow-accent-4' : 'grey-lighten-2'">
                        {{ index === 0 ? 'mdi-trophy-variant' : 'mdi-account-circle' }}
                      </v-icon>
                      <strong class="mr-2">{{ index + 1 }}.</strong> {{ user.userId }}
                    </div>
                    <span class="font-weight-black" :class="index < 3 ? 'text-h6' : 'text-body-1'">
                      {{ user.reps }} <span class="text-caption font-weight-light">reps</span>
                    </span>
                  </div>
                </v-list-item>
              </v-list>
              <div v-if="!leaderboard.length" class="text-center text-grey-darken-1 pt-3">
                  No hi ha dades a la classificació. Sigues el primer!
              </div>

            </v-card>

            <v-btn
              color="purple-accent-3"
              variant="flat"
              size="large"
              rounded="lg"
              class="return-btn"
              @click="tornar"
              elevation="6"
            >
              <v-icon start>mdi-arrow-left</v-icon>
              Tornar a la selecció
            </v-btn>
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


const pathCarregar = mdiFolderOutline


const route = useRoute()
const router = useRouter()

const exercici = route.params.ejercicio
const sessionId = route.params.sessionId

const noms = {
  flexiones: 'Flexions',
  sentadillas: 'Esquats',
  saltos: 'Salts',
  abdominales: 'Abdominals',
}

const gifs = {
  flexiones: new URL('@/assets/flexiones.gif', import.meta.url).href,
  sentadillas: new URL('@/assets/sentadillas.gif', import.meta.url).href,
  saltos: new URL('@/assets/saltos.gif', import.meta.url).href,
  abdominales: new URL('@/assets/abdominales.gif', import.meta.url).href,
}

const exerciciLabel = noms[exercici] || 'Exercici'
const exerciciGif = gifs[exercici] || new URL('@/assets/ejercicio.gif', import.meta.url).href

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
const userId = ref(`usuari_${Math.floor(Math.random() * 10000)}`)

onMounted(() => connectWebSocket())

async function startCamera() {
  try {
    streamRef = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    video.value.srcObject = streamRef
    await video.value.play()
    if (!detector) await initMoveNet()
    if (!detecting) {
      detecting = true
      detectPose()
    }
  } catch (e) {
    alert('No es pot obrir la càmera: ' + e.message)
  }
}

function stopCamera() {
  if (streamRef) {
    streamRef.getTracks().forEach((t) => t.stop())
    video.value.srcObject = null
    streamRef = null
    detecting = false
  }
}

function selectVideo() {
  stopCamera()
  fileInput.value?.click()
}

async function loadVideoFromFile(event) {
  const file = event.target.files[0]
  if (!file) return
  const url = URL.createObjectURL(file)
  video.value.srcObject = null
  stopCamera() // Ensure any existing camera stream is stopped
  video.value.src = url
  await video.value.play()
  if (!detector) await initMoveNet()
  detecting = true
  detectVideoFrame()
}

async function initMoveNet() {
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  })
}

async function detectPose() {
  const ctx = canvas.value.getContext('2d')
  async function poseDetectionFrame() {
    if (!detecting) return
    const poses = await detector.estimatePoses(video.value)
    if (poses.length > 0) {
      drawPose(ctx, poses[0])
      checkMoviment(poses[0])
    }
    requestAnimationFrame(poseDetectionFrame)
  }
  poseDetectionFrame()
}

async function detectVideoFrame() {
  const ctx = canvas.value.getContext('2d')
  async function frameLoop() {
    if (!detecting || video.value.paused || video.value.ended) return
    const poses = await detector.estimatePoses(video.value)
    if (poses.length > 0) {
      drawPose(ctx, poses[0])
      checkMoviment(poses[0])
    }
    requestAnimationFrame(frameLoop)
  }
  frameLoop()
}

function drawPose(ctx, pose) {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  for (const kp of pose.keypoints) {
    if (kp.score > 0.4) {
      ctx.beginPath()
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI)
      ctx.fillStyle = '#76ff03'
      ctx.shadowBlur = 10
      ctx.shadowColor = '#00e676'
      ctx.fill()
    }
  }
}

function checkMoviment(pose) {
  if (exercici === 'abdominales') checkAbdominal(pose)
}

function checkAbdominal(pose) {
  const nas = pose.keypoints.find((k) => k.name === 'nose')
  const maluc = pose.keypoints.find((k) => k.name === 'left_hip')
  if (!nas || !maluc) return

  const distancia = nas.y - maluc.y
  if (distancia < 100 && !up) up = true
  if (distancia > 150 && up) {
    count.value++
    up = false
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'update', reps: count.value }))
    }
  }
}

function connectWebSocket() {
  ws.value = new WebSocket('ws://localhost:4000')
  ws.value.onopen = () => {
    console.log('Connectat al servidor WebSocket')
    ws.value.send(JSON.stringify({ type: 'join', sessionId, userId: userId.value }))
  }
  ws.value.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.type === 'leaderboard') leaderboard.value = message.leaderboard
  }
  ws.value.onclose = () => console.log('Desconnectat del servidor')
  ws.value.onerror = (err) => console.error('Error WebSocket:', err)
}

function tornar() {
  router.back()
}

onBeforeUnmount(() => {
  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({ type: 'leave' }))
    ws.value.close()
  }
})
</script>

<style scoped>
/* GENERAL */
.rounded-3xl {
    border-radius: 30px !important;
}

/* BACKGROUNDS & GLASSMORPHISM */
.bg-glass {
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

.shadow-card {
  box-shadow: 0 8px 35px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
}
.shadow-card:hover {
    transform: translateY(-2px);
}

.bg-light-card {
  background: rgba(255, 255, 255, 0.05); /* Ligeramente más opaco para ranking */
}

/* BOTONES */
.small-btn-group {
  gap: 12px;
}

.control-btn-small {
  font-size: 0.85rem;
  padding: 4px 14px !important;
  min-width: 130px;
  font-weight: 700;
  letter-spacing: 0.5px;
  transition: all 0.25s ease-in-out;
}

.action-btn {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(130, 90, 255, 0.6);
  filter: brightness(1.1); /* Brillo sutil */
}

/* TITLES */
.drop-title {
  text-shadow: 0px 2px 5px rgba(0, 0, 0, 0.8);
}
.drop-title-strong {
    text-shadow: 0px 4px 10px rgba(130, 90, 255, 0.8);
}

.info-text {
    font-size: 0.95rem !important;
}

/* CONTADOR */
.count-card {
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(20, 15, 40, 0.7) !important; /* Fondo semitransparente oscuro para mejor contraste */
}
.counter-value {
    letter-spacing: 3px;
    text-shadow: 0px 0px 15px rgba(0, 255, 255, 0.8); /* Efecto neón */
}


/* CLASIFICACIÓN (LEADERBOARD) */
.ranking-list {
  background-color: transparent !important;
}

.list-item-glow {
    transition: all 0.3s ease;
}
.list-item-glow:hover {
    transform: translateX(4px);
    box-shadow: 0 0 10px rgba(130, 90, 255, 0.2);
}

.bg-top1 {
  background: rgba(255, 215, 0, 0.1) !important; /* Oro suave */
  border-left: 5px solid #ffd700 !important;
}
.bg-top2 {
  background: rgba(192, 192, 192, 0.1) !important; /* Plata suave */
  border-left: 5px solid #c0c0c0 !important;
}
.bg-top3 {
  background: rgba(176, 141, 87, 0.1) !important; /* Bronce suave */
  border-left: 5px solid #b08d57 !important;
}
.bg-standard {
     background: rgba(255, 255, 255, 0.05) !important;
}

/* BOTÓN VOLVER */
.return-btn {
  letter-spacing: 1px;
  font-weight: 700;
  transition: 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
.return-btn:hover {
  background-color: #a464f8 !important; /* Morado más claro */
  transform: scale(1.03);
  box-shadow: 0 6px 18px rgba(164, 100, 248, 0.6);
}

</style>
