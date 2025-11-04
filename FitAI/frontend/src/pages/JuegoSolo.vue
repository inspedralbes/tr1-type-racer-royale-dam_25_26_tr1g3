<template>
  <v-app>
    <v-main
      class="d-flex align-center justify-center pa-8"
      style="background: linear-gradient(135deg, #1a1c2c, #302b63, #24243e); min-height: 100vh;"
    >
      <v-container class="rounded-xl pa-6 bg-white elevation-10" style="max-width: 1200px;">
        <v-row>

          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center">
            <v-card
              class="rounded-xl overflow-hidden"
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

            <div class="mt-5 d-flex flex-wrap justify-center gap-3">
              <v-btn color="deep-purple-accent-4" variant="elevated" size="large" @click="startCamera">
                <v-icon start>mdi-video-outline</v-icon> Obrir càmera
              </v-btn>
              <v-btn color="red-darken-2" variant="outlined" size="large" @click="stopCamera">
                <v-icon start>mdi-stop-circle-outline</v-icon> Aturar
              </v-btn>
              <v-btn color="green-accent-4" variant="elevated" size="large" @click="selectVideo">
                <v-icon start>mdi-folder-video</v-icon> Carregar vídeo
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
              class="mt-6 py-4 px-6 text-center rounded-xl"
              color="deep-purple-darken-2"
              dark
              elevation="8"
              style="width: 80%;"
            >
              <h3 class="text-h5 font-weight-medium mb-1">Repeticions</h3>
              <h1 class="text-h2 font-weight-bold text-green-accent-2">{{ count }}</h1>
            </v-card>
          </v-col>


          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center text-center">
            <h2 class="text-h4 font-weight-bold mb-4 text-deep-purple-darken-3">
              Exercici: {{ exerciciLabel }}
            </h2>

            <v-card class="rounded-xl overflow-hidden mb-4" elevation="8" width="100%">
              <img
                :src="exerciciGif"
                :alt="exerciciLabel"
                class="rounded-lg"
                width="100%"
                style="object-fit: cover;"
              />
            </v-card>

            <p class="text-body-1 text-grey-darken-1 mb-6">
              Segueix l’exemple o utilitza el teu propi vídeo. <br />
              El sistema comptarà les repeticions automàticament.
            </p>

            <v-card
              class="pa-4 rounded-xl mb-6"
              elevation="6"
              width="100%"
              color="#f7f7fc"
              style="border: 1px solid #e0e0e0;"
            >
              <h3 class="text-h5 font-weight-bold text-deep-purple-darken-3 mb-3">
                🏆 Record Personal
              </h3>

              <v-list density="compact">
                <v-list-item
                  v-for="(user, index) in leaderboard"
                  :key="user.userId"
                  class="rounded-lg mb-1"
                  :class="index === 0 ? 'bg-green-lighten-4' : index === 1 ? 'bg-amber-lighten-4' : ''"
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

            <!-- Botó per tornar -->
            <v-btn color="deep-purple-darken-3" variant="flat" size="large" @click="tornar">
              <v-icon start>mdi-arrow-left</v-icon> Tornar
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

onMounted(() => {
  connectWebSocket()
})

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
h1,
h2,
h3 {
  font-family: 'Poppins', sans-serif;
}
</style>
