<template>
    <v-app>
        <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
            <v-container
                class="text-center text-white pa-4 pa-md-8 fade-in-container expanded-container position-relative"
                style="max-width: 1600px;">

                <v-btn class="top-left-back-btn" variant="flat" size="large" prepend-icon="mdi-arrow-left"
                    color="error" @click="tornar">
                    Sortir
                </v-btn>

                <!-- COMPTADOR: Mostra PREPARACIÓ o TEMPS DE JOC -->
                <div class="temps-counter" :class="{ 'counter-active': partidaEnCurs }">
                    <template v-if="enPreparacio">
                        PREPARAT: {{ tempsPreparacio }}
                    </template>
                    <template v-else>
                        {{ minuts }}:{{ segonsFormat }}
                    </template>
                </div>

                <v-row class="mt-16 mt-md-0">
                    <v-col cols="12" md="7" class="d-flex flex-column align-center order-md-1 order-2">
                        <h2 class="text-h5 font-weight-bold mb-3 neon-player-name">
                            <v-icon color="cyan-accent-3" start>mdi-account-circle</v-icon>
                            {{ authStore.userName }} (Tu)
                        </h2>

                        <div class="camera-container-wrapper">
                            <CameraView ref="cameraViewRef" :timer-active="true"
                                :on-check-moviment="detectarIPublicarMoviment"
                                style="width: 100%; display: block;" />

                            <!-- OVERLAY SALA D'ESPERA (Només es veu si no ha començat res) -->
                            <div v-if="!partidaEnCurs && !enPreparacio" class="waiting-overlay d-flex flex-column align-center justify-center">
                                <h3 class="text-h4 font-weight-bold text-uppercase mb-6 waiting-title">
                                    SALA D'ESPERA
                                </h3>

                                <div class="controls-wrapper">
                                    <v-btn 
                                        v-if="workoutStore.isHost"
                                        size="x-large" 
                                        rounded="xl"
                                        color="#22c55e" 
                                        class="start-game-btn pulse-animation"
                                        elevation="10"
                                        prepend-icon="mdi-play-circle"
                                        @click="iniciarPartidaGlobal"
                                    >
                                        INICIAR PARTIDA
                                    </v-btn>

                                    <v-chip v-else size="large" class="glass-chip" variant="elevated" color="rgba(0,0,0,0.6)">
                                        <v-progress-circular indeterminate size="20" width="2" class="mr-3" color="cyan-accent-3"></v-progress-circular>
                                        Esperant a l'amfitrió...
                                    </v-chip>
                                </div>

                                <div class="mt-4 text-subtitle-1 font-weight-bold text-white" style="text-shadow: 0 2px 4px black;">
                                    Jugadors connectats: {{ workoutStore.leaderboard.length }}
                                </div>
                            </div>
                        </div>

                        <RepetitionCounter class="mt-6" style="width: 85%; max-width: 450px;"
                            :count="workoutStore.count" />
                    </v-col>

                    <v-col cols="12" md="5" class="d-flex flex-column align-center order-md-2 order-1">
                        <ExerciseInfo :label="exerciciLabel" :gif="exerciciGif" class="mb-6" />

                        <v-row dense class="justify-center" style="width: 100%;">
                            <v-col v-for="jugador in altresJugadors" :key="jugador.userId" cols="12" sm="6" md="4">
                                <v-card class="player-card pa-3 rounded-xl" elevation="8">
                                    <h4 class="text-body-1 font-weight-bold neon-player-name-remote mb-2">
                                        {{ jugador.userName }}
                                    </h4>
                                    <canvas :ref="el => canvasRemots[jugador.userId] = el" width="640" height="480"
                                        class="rounded-lg remote-canvas"></canvas>
                                    <div class="text-h5 font-weight-black text-cyan-lighten-2 mt-2">
                                        {{ jugador.reps }} reps
                                    </div>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-col>
                </v-row>
            </v-container>

            <!-- POPUP AMB EL NOU DISSENY -->
            <v-dialog v-model="mostrarPopup" max-width="600" persistent>
                <EstadistiquesSessioMultiplayer 
                    :exercici="exercici" 
                    :totalReps="workoutStore.count" 
                    :jugador="authStore.userName"
                    :altresJugadors="altresJugadors" 
                />
            </v-dialog>

        </v-main>
    </v-app>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useWorkoutStore } from '@/stores/workoutStore';

import CameraView from '../components/CameraView.vue';
import RepetitionCounter from '../components/RepetitionCounter.vue';
import ExerciseInfo from '../components/ExerciseInfo.vue';
// Utilitzem el component nou que acabes de crear a pages
import EstadistiquesSessioMultiplayer from '../pages/EstadistiquesSessioMultiplayer.vue';

import flexionesGif from '@/assets/flexiones.gif';
import sentadillasGif from '@/assets/sentadillas.gif';
import saltosGif from '@/assets/saltos.gif';
import abdominalesGif from '@/assets/abdominales.gif';
import fonsGif from '@/assets/fons.gif';
import pujadesGif from '@/assets/pujades.gif';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const workoutStore = useWorkoutStore();

const exercici = route.params.ejercicio;
const codi_acces = route.params.codi_acces;

const noms = { Flexions: 'FLEXIONS', Squats: 'SQUATS', Salts: 'SALTS', Abdominals: 'ABDOMINALS', Fons: 'FONS', Pujades: 'PUJADES', flexiones: 'FLEXIONS', sentadillas: 'ESQUATS', saltos: 'SALTS', abdominales: 'ABDOMINALS', fons: 'FONS', pujades: 'PUJADES' };
const gifs = { Flexions: flexionesGif, Squats: sentadillasGif, Salts: saltosGif, Abdominals: abdominalesGif, Fons: fonsGif, Pujades: pujadesGif, flexiones: flexionesGif, sentadillas: sentadillasGif, saltos: saltosGif, abdominales: abdominalesGif, fons: fonsGif, pujades: pujadesGif };
const exerciciLabel = noms[exercici] || 'EXERCICI';
const exerciciGif = gifs[exercici] || '';

const up = ref(false);
const cameraViewRef = ref(null);
const canvasRemots = ref({});

const tempsPreparacio = ref(5);
const tempsRestant = ref(60);
const intervalTemps = ref(null);
const intervalPreparacio = ref(null);
const mostrarPopup = ref(false);
const enPreparacio = ref(false);
const esFaseDeJoc = ref(false); // Controla quan es poden fer repeticions

// Detecta si el joc ha rebut l'ordre d'inici
const partidaEnCurs = computed(() => workoutStore.gameStarted);

const altresJugadors = computed(() => {
    return workoutStore.leaderboard.filter(j => j.userId !== authStore.user.id);
});

const minuts = computed(() => Math.floor(tempsRestant.value / 60));
const segons = computed(() => tempsRestant.value % 60);
const segonsFormat = computed(() => (segons.value < 10 ? "0" + segons.value : segons.value));

// === LIFECYCLE ===
onMounted(async () => {
    workoutStore.connectWebSocket(codi_acces, exercici);
    await nextTick();
    startCamera();
    // NO INICIEM TEMPORITZADORS AQUÍ. ESPEREM AL WEBSOCKET.
});

onBeforeUnmount(() => {
    tornar();
});

// === 1. GESTIÓ D'INICI DE PARTIDA ===

// Botó de l'Amfitrió
function iniciarPartidaGlobal() {
    workoutStore.sendStartSignal();
}

// Watcher: Quan rebem 'start' del backend -> Iniciem Compte Enrere (5s)
watch(() => workoutStore.gameStarted, (started) => {
    if (started) {
        iniciarCompteEnrerePreparacio();
    }
});

// Watcher: Dibuix esquelets
watch(() => workoutStore.lastReceivedPose, (newPoseData) => {
    if (newPoseData && newPoseData.from) {
        nextTick(() => {
            dibuixarEsqueletRemot(newPoseData.from, newPoseData.pose);
        });
    }
}, { deep: true });


// === 2. TEMPORITZADORS (5s -> 60s) ===

function iniciarCompteEnrerePreparacio() {
    enPreparacio.value = true;
    tempsPreparacio.value = 5;
    
    if (intervalPreparacio.value) clearInterval(intervalPreparacio.value);

    intervalPreparacio.value = setInterval(() => {
        if (tempsPreparacio.value > 0) {
            tempsPreparacio.value--;
        } else {
            // FI PREPARACIÓ -> INICI JOC REAL
            clearInterval(intervalPreparacio.value);
            enPreparacio.value = false;
            iniciarPartidaReial();
        }
    }, 1000);
}

function iniciarPartidaReial() {
    esFaseDeJoc.value = true; // Ara sí que comptem reps
    tempsRestant.value = 60;
    
    if (intervalTemps.value) clearInterval(intervalTemps.value);

    intervalTemps.value = setInterval(() => {
        if (tempsRestant.value > 0) {
            tempsRestant.value--;
        } else {
            // FI JOC -> POPUP
            clearInterval(intervalTemps.value);
            esFaseDeJoc.value = false;
            obrirPopupFinal();
        }
    }, 1000);
}

function obrirPopupFinal() {
    mostrarPopup.value = true;
    // Enviem el resultat final
    workoutStore.disconnectWebSocket(); 
}

function tornar() {
    stopCamera();
    if (intervalTemps.value) clearInterval(intervalTemps.value);
    if (intervalPreparacio.value) clearInterval(intervalPreparacio.value);
    workoutStore.cleanupSession();
    router.push('/'); 
}

// === CÀMERA I REPS ===

async function startCamera() {
    if (cameraViewRef.value) {
        try { await cameraViewRef.value.start(); } catch (e) { }
    }
}

function stopCamera() {
    if (cameraViewRef.value) cameraViewRef.value.stop();
}

function handleRepCount() {
    workoutStore.incrementCount();
    up.value = false;
}

function detectarIPublicarMoviment(pose) {
    // 1. Sempre enviem esquelet
    if (workoutStore.ws?.readyState === WebSocket.OPEN) {
        workoutStore.ws.send(JSON.stringify({
            type: 'pose_update',
            pose: { keypoints: pose.keypoints.map(kp => ({ name: kp.name, x: kp.x, y: kp.y, score: kp.score })) }
        }));
    }

    // 2. Només comptem si estem a la fase de joc (passats els 5s i abans d'acabar)
    if (esFaseDeJoc.value) {
        const exerciciNormalitzat = exercici.toLowerCase();
        switch (exerciciNormalitzat) {
            case 'flexiones': case 'flexions': checkFlexio(pose); break;
            case 'sentadillas': case 'squats': checkEsquat(pose); break;
            case 'saltos': case 'salts': checkSalt(pose); break;
            case 'abdominales': checkAbdominal(pose); break;
            case 'fons': checkFons(pose); break;
            case 'pujades': checkPujades(pose); break;
        }
    }
}

// === CANVAS I EXERCICIS (IGUAL) ===

function dibuixarEsqueletRemot(jugadorId, pose) {
    const canvas = canvasRemots.value[jugadorId];
    if (!canvas || !pose || !pose.keypoints) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const keypointsMap = new Map(pose.keypoints.map(kp => [kp.name, kp]));
    const connections = [['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'], ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'], ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'], ['left_hip', 'left_knee'], ['right_hip', 'right_knee'], ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle']];
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#3b82f6';
    connections.forEach(([p1, p2]) => {
        const kp1 = keypointsMap.get(p1);
        const kp2 = keypointsMap.get(p2);
        if (kp1 && kp2 && kp1.score > 0.4 && kp2.score > 0.4) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.stroke();
        }
    });
    ctx.fillStyle = '#9b6bff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#9b6bff';
    pose.keypoints.forEach(kp => {
        if (kp.score > 0.4) {
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 7, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
    ctx.shadowBlur = 0;
}

function checkFlexio(pose) {
    const espatlla = pose.keypoints.find(k => k.name === 'left_shoulder');
    const colze = pose.keypoints.find(k => k.name === 'left_elbow');
    if (!espatlla || !colze || espatlla.score < 0.4 || colze.score < 0.4) return;
    const dist = Math.abs(espatlla.y - colze.y);
    if (dist < 50 && !up.value) up.value = true;
    if (dist > 100 && up.value) handleRepCount();
}
function checkEsquat(pose) {
    const maluc = pose.keypoints.find(k => k.name === 'left_hip');
    const genoll = pose.keypoints.find(k => k.name === 'left_knee');
    if (!maluc || !genoll || maluc.score < 0.4 || genoll.score < 0.4) return;
    const dist = Math.abs(maluc.y - genoll.y);
    if (dist < 100 && !up.value) up.value = true;
    if (dist > 160 && up.value) handleRepCount();
}
let initialY = null; let jumping = false;
function checkSalt(pose) {
    const peu = pose.keypoints.find(k => k.name === 'left_ankle');
    if (!peu || peu.score < 0.4) return;
    if (initialY === null) initialY = peu.y;
    const delta = initialY - peu.y;
    if (delta > 30 && !jumping) jumping = true;
    else if (delta < 10 && jumping) { jumping = false; handleRepCount(); }
}
function checkAbdominal(pose) {
    const nas = pose.keypoints.find((k) => k.name === 'nose');
    const maluc = pose.keypoints.find((k) => k.name === 'left_hip');
    if (!nas || !maluc || nas.score < 0.4 || maluc.score < 0.4) return;
    const distancia = Math.abs(nas.y - maluc.y);
    if (distancia < 100 && !up.value) up.value = true;
    if (distancia > 150 && up.value) handleRepCount();
}
function checkFons(pose) {
    const espatlla = pose.keypoints.find(k => k.name === 'left_shoulder');
    const colze = pose.keypoints.find(k => k.name === 'left_elbow');
    if (!espatlla || !colze || espatlla.score < 0.4 || colze.score < 0.4) return;
    const dist = Math.abs(espatlla.y - colze.y);
    if (dist < 50 && !up.value) up.value = true;
    if (dist > 100 && up.value) handleRepCount();
}
function checkPujades(pose) {
    const genoll = pose.keypoints.find(k => k.name === 'left_knee');
    const peu = pose.keypoints.find(k => k.name === 'left_ankle');
    if (!genoll || !peu || genoll.score < 0.4 || peu.score < 0.4) return;
    const dist = Math.abs(genoll.y - peu.y);
    if (dist < 200 && !up.value) up.value = true;
    if (dist > 300 && up.value) handleRepCount();
}
</script>

<style scoped>
/* AFEGIT ESTILS OVERLAY DE LA MEVA RESPOSTA ANTERIOR */
.waiting-overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6));
    z-index: 20; pointer-events: none;
}
.controls-wrapper { pointer-events: auto; }
.waiting-title { color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.8); }
.start-game-btn { font-weight: 900; letter-spacing: 1px; box-shadow: 0 0 20px rgba(34, 197, 94, 0.8); pointer-events: auto; }
.glass-chip { background: rgba(0, 0, 0, 0.6) !important; border: 1px solid rgba(255, 255, 255, 0.3); backdrop-filter: blur(5px); }
.pulse-animation { animation: pulse 2s infinite; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }

/* ESTILS DEL COMPTADOR I LAYOUT */
.bg-fitai-deep-space {
    background: radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
                radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 40%),
                linear-gradient(135deg, #0e111d, #141829 50%, #0e111d 100%);
    background-attachment: fixed;
    min-height: 100vh;
}
.fade-in-container { animation: fadeInUp 0.8s cubic-bezier(0.17, 0.84, 0.44, 1) forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.position-relative { position: relative; }
.camera-container-wrapper { position: relative; width: 95%; border-radius: 16px; overflow: hidden; min-height: 300px; border: 1px solid #3b82f6; }

.temps-counter {
    position: fixed; top: 20px; right: 20px;
    background: #0f172a; padding: 12px 20px; border-radius: 12px;
    font-size: 1.5rem; font-weight: bold; color: #94a3b8; z-index: 100; border: 2px solid #334155;
}
.counter-active { color: white; background: #ef4444; border-color: #f87171; box-shadow: 0 0 15px rgba(239, 68, 68, 0.8); }
.top-left-back-btn {
    position: absolute; top: 15px; left: 15px; z-index: 50;
    color: white !important; background: #ef4444 !important;
    font-weight: 700 !important; box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
}
.player-card { background: rgba(30, 30, 47, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); }
.neon-player-name { color: #4dd0e1; text-shadow: 0 0 5px #4dd0e1, 0 0 10px #4dd0e1; }
.neon-player-name-remote { color: #a5b4fc; text-shadow: 0 0 5px #a5b4fc; }
.remote-canvas { width: 100%; height: auto; background-color: #111827; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); }
</style>