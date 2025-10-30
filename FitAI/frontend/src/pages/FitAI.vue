<template>
  <v-app>
    <v-main class="d-flex align-center justify-center pa-8" style="background: linear-gradient(135deg, #141e30, #243b55); min-height: 100vh;">
      <v-container class="elevation-8 rounded-xl pa-6 bg-white" style="max-width: 1200px;">
        <v-row>

          <!-- Columna esquerra: càmera i comptador -->
          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center">

            <v-card class="overflow-hidden rounded-xl" elevation="6" width="100%" style="position: relative;">
              <video ref="video" autoplay playsinline muted width="100%" style="border-radius: 12px;"></video>
              <canvas ref="canvas" width="640" height="480" style="position:absolute; top:0; left:0;"></canvas>
            </v-card>

            <div class="mt-4 d-flex gap-2">
              <v-btn color="deep-purple-accent-4" @click="startCamera">Obrir càmera</v-btn>
              <v-btn variant="outlined" color="deep-purple-accent-4" @click="stopCamera">Parar</v-btn>
            </div>

            <v-card class="mt-4 pa-3 text-center rounded-xl" color="deep-purple-darken-1" dark>
              <h3 class="mb-0">Repeticions</h3>
              <h1 class="display-1 font-weight-bold">{{ count }}</h1>
            </v-card>

          </v-col>

          <!-- Columna dreta: exercici i leaderboard -->
          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center text-center">
            <h2 class="mb-4 text-primary font-weight-bold">Exercici: {{ ejercicioLabel }}</h2>

            <v-card class="overflow-hidden rounded-xl pa-2" elevation="6" width="100%">
              <img src="/src/videos/abdominales.gif" alt="Abdominales" class="rounded-lg" width="100%" />
            </v-card>

            <p class="mt-4 text-grey-darken-1">
              Realitza l'exercici seguint el moviment del vídeo.<br />
              El sistema comptarà les repeticions automàticament.
            </p>

            <!-- Leaderboard -->
            <v-card class="mt-6 pa-4 rounded-xl" elevation="4" width="100%">
              <h3>Classificació</h3>
              <v-list>
                <v-list-item v-for="(user, index) in leaderboard" :key="user.userId">
                  <v-list-item-content>
                    {{ index + 1 }}. {{ user.userId }} - {{ user.reps }} reps
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card>

            <!-- Sessió WebSocket -->
            <v-text-field v-model="sessionId" label="ID Sessió" class="mt-4"></v-text-field>
            <v-btn color="primary" @click="connectWebSocket">Unir-se a la Sessió</v-btn>

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
import { useRoute } from 'vue-router'

const route = useRoute()
const ejercicio = route.params.ejercicio
const nombres = { flexiones: 'Flexions', sentadillas: 'Squats', saltos: 'Saltos', abdominales: 'Abdominals' }
const ejercicioLabel = nombres[ejercicio] || 'Exercici'

const video = ref(null)
const canvas = ref(null)
const count = ref(0)
const leaderboard = ref([])
let detector = null
let up = false
let streamRef = null
let detecting = false

// WebSocket
const ws = ref(null)
const sessionId = ref('')
const userId = ref(`user_${Math.floor(Math.random() * 10000)}`)

// Obrir càmera
async function startCamera() {
  try {
    streamRef = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
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

// Parar càmera
function stopCamera() {
  if (streamRef) {
    streamRef.getTracks().forEach(t => t.stop())
    video.value.srcObject = null
    streamRef = null
    detecting = false
  }
}

// Inicialitzar MoveNet
async function initMoveNet() {
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
  )
}

// Detecció de poses
async function detectPose() {
  const ctx = canvas.value.getContext('2d')

  async function poseDetectionFrame() {
    if (!detecting) return
    const poses = await detector.estimatePoses(video.value)
    if (poses.length > 0) {
      drawPose(ctx, poses[0])
      checkAbdominal(poses[0])
    }
    requestAnimationFrame(poseDetectionFrame)
  }

  poseDetectionFrame()
}

// Dibuixa punts de referència
function drawPose(ctx, pose) {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  for (const kp of pose.keypoints) {
    if (kp.score > 0.4) {
      ctx.beginPath()
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI)
      ctx.fillStyle = '#00E676'
      ctx.fill()
    }
  }
}

// Comptar abdominals
function checkAbdominal(pose) {
  const nose = pose.keypoints.find(k => k.name === 'nose')
  const hip = pose.keypoints.find(k => k.name === 'left_hip')
  if (!nose || !hip) return

  const distance = nose.y - hip.y

  if (distance < 100 && !up) up = true
  if (distance > 150 && up) {
    count.value++
    up = false
    // Enviar repetició al servidor
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'update', reps: count.value }))
    }
  }
}

// Connectar WebSocket i unir-se a la sessió
function connectWebSocket() {
  if (!sessionId.value) return alert('Introdueix un ID de sessió')
  ws.value = new WebSocket('ws://localhost:3000')

  ws.value.onopen = () => {
    console.log('Connectat al servidor WebSocket')
    ws.value.send(JSON.stringify({ type: 'join', sessionId: sessionId.value, userId: userId.value }))
  }

  ws.value.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.type === 'leaderboard') leaderboard.value = message.leaderboard
  }

  ws.value.onclose = () => console.log('Desconnectat del WebSocket')
  ws.value.onerror = (err) => console.error('Error WebSocket:', err)
}

// Quan l'usuari marxi de la pàgina
onBeforeUnmount(() => {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({ type: 'leave' }))
    ws.value.close()
  }
})
</script>

<style scoped>
h2, h3, h1 {
  font-family: 'Poppins', sans-serif;
}
</style>
