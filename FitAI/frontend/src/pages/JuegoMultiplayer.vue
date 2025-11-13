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
                <h2 class="exercise-title my-6">Multijugador - {{ exerciciLabel }}</h2>

                <!-- ==================================== -->
                <!-- ======== TEMPORITZADOR AUTOMÀTIC ======== -->
                <!-- ==================================== -->
                <v-card class="mt-6 py-4 px-5 text-center rounded-xl timer-card mx-auto" color="transparent"
                    elevation="10"
                    style="width: 85%; max-width: 400px; border: 2px solid rgba(139, 92, 246, 0.3); backdrop-filter: blur(10px); background: rgba(139, 92, 246, 0.1);">
                    <h3 class="text-h6 font-weight-regular mb-3 text-purple-lighten-2">⏱️ TEMPORITZADOR</h3>

                    <!-- Lògica de Pre-compte -->
                    <div v-if="preCount > 0" class="text-center">
                        <h2 class="text-h1 font-weight-black text-red-lighten-1 mb-2 pre-count-value">{{ preCount }}
                        </h2>
                        <p class="text-h6 text-red-lighten-2 font-weight-bold">¡Prepárate!</p>
                    </div>

                    <!-- Lògica de Compte Principal -->
                    <div v-else>
                        <h2 class="text-h3 font-weight-bold text-purple-lighten-1 mb-2">{{ formattedTime }}</h2>
                    </div>

                    <!-- Lògica de Missatges d'Estat -->
                    <p v-if="timerActive" class="text-caption text-green-lighten-2 mt-2 font-weight-bold">
                        🟢 Comptant...
                    </p>
                    <p v-if="timerFinished" class="text-h6 text-green-lighten-2 mt-2 font-weight-bold">
                        ✅ Temps completat!
                    </p>
                </v-card>
                <!-- ==================================== -->
                <!-- ======== FI TEMPORITZADOR ======== -->
                <!-- ==================================== -->

                <!-- Graella de jugadors -->
                <v-row dense class="justify-center mt-6">
                    <v-col v-for="(jugador, i) in leaderboard" :key="jugador.userId" cols="12" sm="6" md="6" lg="6"
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

            <!-- ==================================== -->
            <!-- ======== POPUP D'ESTADÍSTIQUES (Component Extern) ======== -->
            <!-- ==================================== -->
            <EstadistiquesSessioMultiplayer :model-value="showStatsDialog" :exercici="exercici" :total-reps="totalReps"
                @close="sortir" />
            <!-- ==================================== -->
            <!-- ======== FI POPUP D'ESTADÍSTIQUES ======== -->
            <!-- ==================================== -->

        </v-main>
    </v-app>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue'
import EstadistiquesSessioMultiplayer from './EstadistiquesSessioMultiplayer.vue' // NOU: Importar el component d'estadístiques
import { useRoute, useRouter } from 'vue-router'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'

const route = useRoute()
const router = useRouter()

const exercici = route.params.ejercicio
const sessionId = route.params.sessionId
const userId = route.params.userId || `usuari_${Math.floor(Math.random() * 10000)}`
const userName = 'Tu' // S'ha d'obtenir el nom real de l'usuari si és possible

// L'etiqueta de l'exercici es calcula ara dins del component EstadistiquesSessioMultiplayer
const exerciciLabel = computed(() => exercici.toUpperCase()) // Mantinc una versió simple per al títol principal, si cal.

// ===================================================================
// 1. LÒGICA DEL TEMPORITZADOR
// ===================================================================
const initialTime = 60 // 1 minut
const preCountInitial = 5 // 5 segons de preparació
const timeRemaining = ref(initialTime)
const preCount = ref(preCountInitial)
const timerActive = ref(false)
const timerFinished = ref(false)
const showStatsDialog = ref(false) // NOU: Estat per controlar el diàleg d'estadístiques
let timerInterval = null
let preCountInterval = null

const formattedTime = computed(() => {
    const minutes = Math.floor(timeRemaining.value / 60)
    const seconds = timeRemaining.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

function startPreCount() {
    timerFinished.value = false
    showStatsDialog.value = false // Assegurar que el diàleg estigui tancat
    preCount.value = preCountInitial
    preCountInterval = setInterval(() => {
        preCount.value--
        if (preCount.value <= 0) {
            clearInterval(preCountInterval)
            startTimer()
        }
    }, 1000)
}

function startTimer() {
    timeRemaining.value = initialTime
    timerActive.value = true
    timerInterval = setInterval(() => {
        timeRemaining.value--
        if (timeRemaining.value <= 0) {
            stopTimer()
            timerFinished.value = true
            showStatsDialog.value = true // NOU: Mostrar el diàleg quan el temps s'acaba
        }
    }, 1000)
}

function stopTimer() {
    clearInterval(timerInterval)
    clearInterval(preCountInterval)
    timerActive.value = false
}

// ===================================================================
// 2. LÒGICA DE LA PÀGINA
// ===================================================================

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

// NOU: Càlcul de repeticions totals per a les estadístiques
const totalReps = computed(() => {
    const userEntry = leaderboard.value.find(j => j.userId === userId)
    return userEntry ? userEntry.reps : 0
})

onMounted(async () => {
    // Iniciar el temporitzador automàticament
    startPreCount()

    await startLocalStream()
    connectWebSocket()
    await nextTick()
    await startCamera()
})

onBeforeUnmount(() => {
    stopTimer() // Aturar el temporitzador en sortir
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

// Funció checkMoviment (no proporcionada, assumim que existeix)
function checkMoviment(pose) {
    // Lògica de detecció de moviment
    // Aquesta funció hauria d'actualitzar 'count' i enviar la nova repeticions al servidor
    // Per exemple:
    // if (movimentCompletat) {
    //     count.value++
    //     ws.value.send(JSON.stringify({ type: 'reps', reps: count.value }))
    // }
}


// ---------- SORTIR ----------
function sortir() {
    console.log('Sortint de la sessió...')
    try {
        stopTimer() // Assegurar que el temporitzador s'aturi
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
