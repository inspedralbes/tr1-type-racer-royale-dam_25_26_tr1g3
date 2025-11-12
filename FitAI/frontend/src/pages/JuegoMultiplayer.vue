<template>
    <v-app>
        <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
            <v-container class="text-center text-white pa-4 pa-md-8 fade-in-container" style="max-width: 1400px;">

                <v-btn class="top-left-back-btn rectangular-btn" variant="flat" size="large"
                    prepend-icon="mdi-arrow-left" @click="sortir">
                    Sortir
                </v-btn>

                <h2 class="exercise-title my-6">{{ exerciciLabel }} — Multijugador</h2>

                <v-row dense class="justify-center">
                    <v-col v-for="(jugador, i) in leaderboard" :key="jugador.userId" cols="12" sm="6" md="6" lg="6"
                        class="d-flex justify-center mb-6">
                        <v-card class="rounded-xl overflow-hidden shadow-card player-card text-center pa-4"
                            elevation="12" width="100%" max-width="550">
                            <h3 class="text-h6 font-weight-bold mb-3 neon-player-name">
                                <v-icon v-if="i === 0" color="yellow-accent-4" start>mdi-trophy-variant</v-icon>
                                
                                {{ jugador.userName }} 
                                
                                <span v-if="jugador.userId === userId"
                                    class="text-caption text-cyan-lighten-2">(Tu)</span>
                            </h3>

                            <div v-if="jugador.userId === userId" class="relative w-full">
                                <video ref="video" autoplay playsinline muted class="rounded-xl w-full"
                                    style="object-fit: cover; background: black;"></video>
                                <canvas ref="canvas" width="640" height="480"
                                    class="absolute top-0 left-0 w-full h-full"></canvas>
                            </div>

                            <div v-else class="text-grey-lighten-2 py-16 text-center bg-dark rounded-xl">
                                <v-icon size="40">mdi-account-circle</v-icon>
                                <p class="mt-2 text-body-2">Càmera no disponible</p>
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'
import { useAuthStore } from '@/stores/authStore'; // AFEGIT: Importar authStore

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore(); // AFEGIT: Instanciar authStore

const exercici = route.params.ejercicio

// CANVIAT: El paràmetre de la ruta ara és 'codi_acces'
const codi_acces = route.params.codi_acces 

// CANVIAT: Obtenir dades de l'usuari real de l'store
const userId = authStore.user.id;
const userName = authStore.userName;

const noms = {
    flexiones: 'FLEXIONS',
    sentadillas: 'ESQUATS',
    saltos: 'SALTS',
    abdominales: 'ABDOMINALS',
}

const exerciciLabel = noms[exercici] || 'EXERCICI'

// Refs
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

onMounted(() => {
    connectWebSocket()
    startCamera()
})

// CANVIAT: Assegura que la funció 'sortir' s'executa en desmuntar
onBeforeUnmount(() => {
    sortir();
})

// ---------- WEBSOCKET (MODIFICAT) ----------
function connectWebSocket() {
    // AFEGIT: Càlcul dinàmic de la URL del WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const WS_URL = `${wsProtocol}//${wsHost}/ws`;

    ws.value = new WebSocket(WS_URL) // CANVIAT: URL dinàmica

    ws.value.onopen = () => {
        console.log('Connectat a la sessió', codi_acces)
        // CANVIAT: Envia les dades reals (codi_acces, userId, userName)
        ws.value.send(JSON.stringify({ type: 'join', codi_acces, userId, userName }))
    }
    
    ws.value.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.type === 'leaderboard') {
            // El leaderboard ara conté { userId, userName, reps }
            leaderboard.value = message.leaderboard 
        }
    }

    // AFEGIT: Gestió d'errors i tancament
    ws.value.onclose = () => console.log('Desconnectat del servidor');
    ws.value.onerror = (err) => console.error('Error WebSocket:', err);
}

// ---------- CÀMERA ----------
async function startCamera() {
    try {
        streamRef = await navigator.mediaDevices.getUserMedia({ video: true })
        video.value.srcObject = streamRef
        await video.value.play()
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
        if (video.value) video.value.srcObject = null;
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
    const ctx = canvas.value?.getContext('2d')
    async function loop() {
        if (!detecting || !video.value || video.value.paused || video.value.ended) return
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
    if (!canvas.value) return; // Control per si el component es destrueix
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

// ---------- DETECCIÓ ----------
function checkMoviment(pose) {
    switch (exercici) {
        case 'flexiones':
            checkFlexio(pose)
            break
        case 'sentadillas':
            checkEsquat(pose)
            break
        case 'saltos':
            checkSalt(pose)
            break
        case 'abdominales':
            checkAbdominal(pose)
            break
    }
}

// ---------------- FLEXIONS ----------------
function checkFlexio(pose) {
    const espatlla = pose.keypoints.find(k => k.name === 'left_shoulder')
    const canell = pose.keypoints.find(k => k.name === 'left_wrist')
    const maluc = pose.keypoints.find(k => k.name === 'left_hip')
    if (!espatlla || !canell || !maluc) return

    // Distància vertical entre espatlla i canell
    const dist = Math.abs(espatlla.y - canell.y)

    const UMBRAL_ARRIBA = 200
    const UMBRAL_ABAJO = 100

    if (dist < UMBRAL_ABAJO && !up) up = true
    if (dist > UMBRAL_ARRIBA && up) {
        count.value++
        up = false
        sendReps()
    }
}

// ---------------- SQUATS ----------------
function checkEsquat(pose) {
    const maluc = pose.keypoints.find(k => k.name === 'left_hip')
    const genoll = pose.keypoints.find(k => k.name === 'left_knee')
    if (!maluc || !genoll) return

    const dist = Math.abs(maluc.y - genoll.y)
    const UMBRAL_ARRIBA = 160
    const UMBRAL_ABAJO = 100

    if (dist < UMBRAL_ABAJO && !up) up = true
    if (dist > UMBRAL_ARRIBA && up) {
        count.value++
        up = false
        sendReps()
    }
}

// ---------------- SALTS ----------------
let initialY = null
let jumping = false
function checkSalt(pose) {
    const peu = pose.keypoints.find(k => k.name === 'left_ankle')
    if (!peu) return

    if (initialY === null) initialY = peu.y
    const delta = initialY - peu.y

    const UMBRAL_SALT = 60
    if (delta > UMBRAL_SALT && !jumping) {
        jumping = true
    } else if (delta < 10 && jumping) {
        count.value++
        jumping = false
        sendReps()
    }
}

// ---------------- ABDOMINALS ----------------
function checkAbdominal(pose) {
    const nas = pose.keypoints.find(k => k.name === 'nose')
    const maluc = pose.keypoints.find(k => k.name === 'left_hip')
    if (!nas || !maluc) return

    const dist = Math.abs(nas.y - maluc.y)
    const UMBRAL_ARRIBA = 150
    const UMBRAL_ABAJO = 100

    if (dist < UMBRAL_ABAJO && !up) up = true
    if (dist > UMBRAL_ARRIBA && up) {
        count.value++
        up = false
        sendReps()
    }
}

// ---------------- ENVIAMENT REPETICIONS ----------------
function sendReps() {
    if (ws.value?.readyState === WebSocket.OPEN) {
        ws.value.send(JSON.stringify({ type: 'update', reps: count.value }))
    }
}


// ---------- SORTIR (MODIFICAT) ----------
function sortir() {
    stopCamera()

    if (ws.value?.readyState === WebSocket.OPEN) {
        // 1. AFEGIT: Enviem el missatge 'finish' per guardar les dades a la BBDD
        ws.value.send(JSON.stringify({
            type: 'finish',
            reps: count.value,
            exercici: exercici,
            codi_acces: codi_acces
        }));
        
        // 2. Enviem 'leave' per actualitzar la UI de la resta
        ws.value.send(JSON.stringify({ type: 'leave' }));
        
        // 3. Tanquem el socket
        ws.value.close();
        ws.value = null; // Important per evitar crides duplicades des de onBeforeUnmount
    }

    // 4. Tornem enrere
    router.back()
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