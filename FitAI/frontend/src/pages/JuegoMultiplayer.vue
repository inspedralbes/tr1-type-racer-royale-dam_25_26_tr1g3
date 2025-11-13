<template>
    <v-app>
        <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
            <v-container class="text-center text-white pa-4 pa-md-8 fade-in-container" style="max-width: 1400px;">
                <!-- Botó per sortir -->
                <v-btn class="top-left-back-btn rectangular-btn" variant="flat" size="large"
                    prepend-icon="mdi-arrow-left" @click="sortir">
                    Sortir
                </v-btn>
                <!-- Títol -->
                <h2 class="exercise-title my-6">Multijugador - {{ exercici }}</h2>
                <!-- Graella de jugadors -->
                <v-row dense class="justify-center">
                   <template>
  <v-card
    class="py-5 px-6 text-center rounded-xl count-card"
    color="transparent"
    elevation="10"
    style="border: 2px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); background: rgba(0, 0, 0, 0.3);"
  >
    <h3 class="text-h6 font-weight-regular mb-2 text-grey-lighten-2">REPETICIONS</h3>
    <h1 class="text-h1 font-weight-black text-cyan-lighten-2 counter-value">{{ count }}</h1>
  </v-card>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
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
</style> <v-col v-for="(jugador, i) in leaderboard" :key="jugador.userId" cols="12" sm="6" md="6" lg="6"
                        class="d-flex justify-center mb-6">
                        <v-card class="rounded-xl overflow-hidden shadow-card player-card text-center pa-4"
                            elevation="12" width="100%" max-width="550">
                            <!-- Nom del jugador amb trofeu si és el primer -->
                            <h3 class="text-h6 font-weight-bold mb-3 neon-player-name">
                                <v-icon v-if="i === 0" color="yellow-accent-4" start>mdi-trophy-variant</v-icon>
                                {{ jugador.userId === userId ? userName : jugador.userName }}
                                <span v-if="jugador.userId === userId"
                                    class="text-caption text-cyan-lighten-2">(Tu)</span>
                            </h3>

                            <!-- Càmera local només per al jugador actual -->
                            <div v-if="jugador.userId === userId" class="relative w-full">
                                <video ref="video" autoplay playsinline muted class="rounded-xl w-full"
                                    style="object-fit: cover; background: black;"></video>
                                <canvas ref="canvas" width="640" height="480"
                                    class="absolute top-0 left-0 w-full h-full"></canvas>
                            </div>

                            <!-- Càmera remota per a altres jugadors -->
                            <div v-if="jugador.hasCamera" class="relative w-full">
                                <video :ref="el => remoteVideos[jugador.userId] = el"
                                    :id="`remoteVideo_${jugador.userId}`" autoplay playsinline muted
                                    class="rounded-xl w-full" style="object-fit: cover; background: black;"></video>
                            </div>

                            <!-- Si no hi ha càmera -->
                            <div v-else class="text-grey-lighten-2 py-16 text-center bg-dark rounded-xl">
                                <v-icon size="40">mdi-account-circle</v-icon>
                                <p class="mt-2 text-body-2">Càmera no disponible</p>
                            </div>

                            <!-- Comptador de repeticions -->
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
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'

const route = useRoute()
const router = useRouter()

const exercici = route.params.ejercicio
const sessionId = route.params.sessionId
const userId = route.params.userId || `usuari_${Math.floor(Math.random() * 10000)}`

const noms = {
    flexiones: 'FLEXIONS',
    sentadillas: 'ESQUATS',
    saltos: 'SALTS',
    abdominales: 'ABDOMINALS',
}

// Refs
const video = ref(null)
const canvas = ref(null)
const count = ref(0)
const leaderboard = ref([{ userId, reps: 0, stream: null }])
const remoteVideos = ref({})

let detector = null
let up = false
let streamRef = null
let detecting = false

// WebSocket
const ws = ref(null)
const localStream = ref(null)
const peers = ref({})

onMounted(async () => {
    await startLocalStream()
    connectWebSocket()
    await nextTick()
    await startCamera()
})

onBeforeUnmount(() => {
    sortir()
})

function connectWebSocket() {
    ws.value = new WebSocket('ws://localhost:4000')
    ws.value.onopen = () => {
        console.log('Connectat a la sessió', sessionId)
        ws.value.send(JSON.stringify({ type: 'join', sessionId, userId }))
    }
    ws.value.onmessage = async (event) => {
        const message = JSON.parse(event.data)
        const { type, from, sdp, candidate } = message
        switch (type) {
            case 'offer':
                const pc = createPeerConnection(from)
                await pc.setRemoteDescription(new RTCSessionDescription(sdp))
                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                ws.value.send(JSON.stringify({ type: 'answer', to: from, sdp: pc.localDescription }))
                break
            case 'answer':
                await peers.value[from].setRemoteDescription(new RTCSessionDescription(sdp))
                break
            case 'ice':
                await peers.value[from].addIceCandidate(new RTCIceCandidate(candidate))
                break
            case 'leaderboard':
                leaderboard.value = message.leaderboard.map(j => ({
                    ...j,
                    userName: j.userName || j.userId,
                    stream: leaderboard.value.find(old => old.userId === j.userId)?.stream || null
                }))
                break
        }
    }
}

async function startLocalStream() {
    streamRef = await navigator.mediaDevices.getUserMedia({ video: true })
    localStream.value = streamRef

    const jugador = leaderboard.value.find(j => j.userId === userId)
    if (jugador) {
        jugador.stream = localStream.value
    }

    if (video.value) {
        video.value.srcObject = localStream.value
        await video.value.play()
    }
}

// ---------- WEBRTC ----------
function createPeerConnection(remoteUserId) {
    const pc = new RTCPeerConnection()
    pc.ontrack = (event) => {
        const jugador = leaderboard.value.find(j => j.userId === remoteUserId)
        if (jugador) jugador.stream = event.streams[0]
    }
    localStream.value.getTracks().forEach(track => pc.addTrack(track, localStream.value))
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            ws.value.send(JSON.stringify({ type: 'ice', to: remoteUserId, candidate: event.candidate }))
        }
    }
    peers.value[remoteUserId] = pc
    return pc
}

// ---------- ASSIGNACIÓ DE STREAMS ----------
watch(leaderboard, async () => {
    await nextTick()
    leaderboard.value.forEach(j => {
        // Si no hi ha stream, crear un placeholder negre
        if (!j.stream) {
            const canvasEl = document.createElement('canvas')
            canvasEl.width = 640
            canvasEl.height = 480
            const ctx = canvasEl.getContext('2d')
            ctx.fillStyle = '#222' // color placeholder
            ctx.fillRect(0, 0, canvasEl.width, canvasEl.height)
            j.stream = canvasEl.captureStream(15) // 15 fps
        }

        // Assignar el stream al video corresponent
        const videoEl = document.querySelector(`#remoteVideo_${j.userId}`)
        if (videoEl && videoEl.srcObject !== j.stream) {
            videoEl.srcObject = j.stream
            remoteVideos.value[j.userId] = videoEl
        }
    })
}, { deep: true })



// ---------- CÀMERA ----------
async function startCamera() {
    try {
        await initMoveNet()
        detecting = true
        detectPose()
    } catch (e) {
        console.error('Error obrint càmera:', e)
    }
}

function stopCamera() {
    if (streamRef) {
        streamRef.getTracks().forEach((t) => t.stop())
        streamRef = null
        video.value.srcObject = null
    }
    detecting = false
    const ctx = canvas.value?.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
}

async function initMoveNet() {
    await tf.ready()
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    })
}

async function detectPose() {
    const ctx = canvas.value.getContext('2d')
    async function loop() {
        if (!detecting || video.value.paused || video.value.ended) return
        const poses = await detector.estimatePoses(video.value)
        if (poses.length > 0) {
            drawPose(ctx, poses[0])
            checkMoviment(poses[0])
        }
        requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
}

function drawPose(ctx, pose) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
    for (const kp of pose.keypoints) {
        if (kp.score > 0.4) {
            ctx.beginPath()
            ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI)
            ctx.fillStyle = '#00ffaa'
            ctx.shadowBlur = 10
            ctx.shadowColor = '#00ffaa'
            ctx.fill()
        }
    }
}

// ---------- SORTIR ----------
function sortir() {
    console.log('Sortint de la sessió...')
    try {
        stopCamera()
        localStream.value?.getTracks().forEach(t => t.stop())
        Object.values(peers.value).forEach(pc => pc.close())
        if (ws.value?.readyState === WebSocket.OPEN) {
            ws.value.send(JSON.stringify({ type: 'leave' }))
            ws.value.close()
        }
    } catch (e) {
        console.error('Error tancant recursos:', e)
    }
    router.push('/')
}
</script>

<style scoped>
.bg-fitai-deep-space {
    background: linear-gradient(135deg, #0e111d, #141829 50%, #0e111d 100%);
    background-attachment: fixed;
    min-height: 100vh;
}

.player-card {
    backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.neon-player-name {
    text-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
}

.bg-dark {
    background: rgba(0, 0, 0, 0.3);
}

.top-left-back-btn {
    position: absolute;
    top: 15px;
    left: 15px;
    color: white !important;
    background: #8b5cf6 !important;
    border-radius: 8px !important;
    z-index: 1000;
}

.exercise-title {
    background: linear-gradient(90deg, #8b5cf6, #3b82f6, #00ffaa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 900;
    letter-spacing: 2px;
    text-transform: uppercase;
    animation: gradientShift 6s ease infinite;
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
</style>