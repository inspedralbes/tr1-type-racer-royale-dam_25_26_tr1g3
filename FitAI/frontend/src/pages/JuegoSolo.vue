<template>
  <v-app>
    <v-main
      class="d-flex align-center justify-center pa-8"
      style="background: linear-gradient(135deg, #1c1b29, #2e2a5c, #1f1c3a); min-height: 100vh;"
    >
<v-container
  class="rounded-2xl pa-12 elevation-12 bg-glass expanded-container"
  style="max-width: 1400px; backdrop-filter: blur(20px);"
>

        <v-row>

          <!-- COLUMNA IZQUIERDA (CÁMARA Y CONTROLES) -->
          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center">
            <v-card
              class="rounded-xl overflow-hidden shadow-card"
              elevation="8"
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

            <!-- Botones -->
            <div class="mt-5 d-flex flex-wrap justify-center gap-2 small-btn-group">
  <v-btn
    color="deep-purple-accent-4"
    variant="elevated"
    size="small"
    rounded
    class="control-btn-small"
    @click="startCamera"
  >
    <v-icon start size="18">mdi-video-outline</v-icon>
    Obrir càmera
  </v-btn>

  <v-btn
    color="red-darken-2"
    variant="outlined"
    size="small"
    rounded
    class="control-btn-small"
    @click="stopCamera"
  >
    <v-icon start size="18">mdi-stop-circle-outline</v-icon>
    Aturar
  </v-btn>

  <v-btn
    color="green-accent-4"
    variant="elevated"
    size="small"
    rounded
    class="control-btn-small"
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


            <!-- Contador -->
            <v-card
              class="mt-8 py-5 px-6 text-center rounded-xl count-card"
              color="deep-purple-darken-3"
              elevation="10"
              style="width: 80%;"
            >
              <h3 class="text-h5 font-weight-medium mb-1 text-grey-lighten-3">Repeticions</h3>
              <h1 class="text-h2 font-weight-bold text-green-accent-2">{{ count }}</h1>
            </v-card>
          </v-col>

          <!-- COLUMNA DERECHA (GIF + RANKING) -->
          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center text-center">
            <h2 class="text-h4 font-weight-bold mb-5 text-white drop-title">
              Exercici: <span class="text-purple-lighten-3">{{ exerciciLabel }}</span>
            </h2>

            <v-card class="rounded-xl overflow-hidden mb-4 shadow-card" elevation="8" width="100%">
              <img
                :src="exerciciGif"
                :alt="exerciciLabel"
                class="rounded-lg"
                width="100%"
                style="object-fit: cover;"
              />
            </v-card>

            <p class="text-body-1 text-grey-lighten-2 mb-6">
              Segueix l’exemple o utilitza el teu propi vídeo. <br />
              El sistema comptarà les repeticions automàticament.
            </p>

            <!-- Clasificación -->
            <v-card
              class="pa-4 rounded-xl mb-6 bg-light-card"
              elevation="6"
              width="100%"
              style="border: 1px solid rgba(255,255,255,0.1);"
            >
              <h3 class="text-h5 font-weight-bold text-purple-lighten-3 mb-3">
                🏆 Record Personal
              </h3>

              <v-list density="compact" class="text-grey-lighten-3">
                <v-list-item
                  v-for="(user, index) in leaderboard"
                  :key="user.userId"
                  class="rounded-lg mb-1"
                  :class="index === 0 ? 'bg-top1' : index === 1 ? 'bg-top2' : 'bg-top3'"
                >
                  <v-list-item-content class="text-body-1">
                    <v-icon small class="mr-2">
                      {{ index === 0 ? 'mdi-crown' : 'mdi-account' }}
                    </v-icon>
                    <strong>{{ index + 1 }}.</strong> {{ user.userId }} — {{ user.reps }} repeticions
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card>

            <!-- Botón Volver -->
            <v-btn
              color="deep-purple-accent-3"
              variant="elevated"
              size="large"
              rounded
              class="return-btn"
              @click="tornar"
            >
              <v-icon start>mdi-arrow-left</v-icon>
              Tornar
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
.bg-glass {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.shadow-card {
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.35);
}

.control-btn {
  transition: all 0.3s ease;
}
.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(120, 81, 169, 0.6);
}

.count-card {
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bg-top1 {
  background: rgba(0, 255, 150, 0.08);
}
.bg-top2 {
  background: rgba(255, 215, 0, 0.08);
}
.bg-top3 {
  background: rgba(150, 150, 255, 0.05);
}

.return-btn {
  letter-spacing: 0.5px;
  font-weight: 600;
  transition: 0.3s ease;
}
.return-btn:hover {
  background-color: #7b4efb !important;
  transform: scale(1.05);
}

.drop-title {
  text-shadow: 0px 3px 8px rgba(0, 0, 0, 0.5);
}

.bg-light-card {
  background: rgba(255, 255, 255, 0.03);
}

.small-btn-group {
  gap: 12px; /* separa los botones horizontal y verticalmente */
}

.control-btn-small {
  font-size: 0.85rem;
  padding: 4px 10px !important;
  min-width: 120px;
  font-weight: 500;
  letter-spacing: 1.5px;
  transition: all 0.25s ease-in-out;
}

.control-btn-small:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(130, 90, 255, 0.4);
  background-color: rgba(130, 90, 255, 0.15) !important;
}
.small-btn-group v-btn {
  min-width: 140px;
}

</style>
