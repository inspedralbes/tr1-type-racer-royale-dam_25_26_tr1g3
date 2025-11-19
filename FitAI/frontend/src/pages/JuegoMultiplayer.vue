<template>
    <v-app>
        <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
            <v-container
                class="text-center text-white pa-4 pa-md-8 fade-in-container expanded-container position-relative"
                style="max-width: 1600px;">

                <!-- BOTÓ ENRERE ARREGLAT -->
                <v-btn class="top-left-back-btn" variant="flat" size="large" prepend-icon="mdi-arrow-left"
                    color="error" @click="tornar">
                    Sortir de la Sala
                </v-btn>

                <div class="temps-counter">
                    {{ minuts }}:{{ segonsFormat }}
                </div>

                <v-row class="mt-16 mt-md-0">
                    <!-- COLUMNA ESQUERRA: CÀMERA LOCAL -->
                    <v-col cols="12" md="7" class="d-flex flex-column align-center order-md-1 order-2">
                        <h2 class="text-h5 font-weight-bold mb-3 neon-player-name">
                            <v-icon color="cyan-accent-3" start>mdi-account-circle</v-icon>
                            {{ authStore.userName }} (Tu)
                        </h2>

                        <CameraView ref="cameraViewRef" :timer-active="true"
                            :on-check-moviment="detectarIPublicarMoviment"
                            style="max-width: 95%; border-radius: 16px; overflow: hidden;" />

                        <RepetitionCounter class="mt-6" style="width: 85%; max-width: 450px;"
                            :count="workoutStore.count" />
                    </v-col>

                    <!-- COLUMNA DRETA: RIVALS I INFO -->
                    <v-col cols="12" md="5" class="d-flex flex-column align-center order-md-2 order-1">
                        <ExerciseInfo :label="exerciciLabel" :gif="exerciciGif" class="mb-6" />

                        <v-row dense class="justify-center" style="width: 100%;">
                            <v-col v-for="jugador in altresJugadors" :key="jugador.userId" cols="12" sm="6" md="4">
                                <v-card class="player-card pa-3 rounded-xl" elevation="8">
                                    <h4 class="text-body-1 font-weight-bold neon-player-name-remote mb-2">
                                        {{ jugador.userName }}
                                    </h4>
                                    <!-- CANVAS PER DIBUIXAR ESQUELETS DELS RIVALS -->
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

            <!-- DIÀLEG ESTADÍSTIQUES -->
            <!-- Quan es tanca (emit close), cridem a tornar() per sortir -->
            <v-dialog v-model="mostrarPopup" width="600" persistent>
                <EstadistiquesSessioMultiplayer 
                    :exercici="exercici" 
                    :totalReps="workoutStore.count" 
                    :modelValue="mostrarPopup"
                    @close="tornar" 
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

// Components
import CameraView from '../components/CameraView.vue';
import RepetitionCounter from '../components/RepetitionCounter.vue';
import ExerciseInfo from '../components/ExerciseInfo.vue';
// Assegura't que la ruta sigui correcta segons on has creat el fitxer (pages o components)
// En el teu missatge anterior deies que l'havies mogut a 'pages', si és a components canvia-ho.
import EstadistiquesSessioMultiplayer from '../pages/EstadistiquesSessioMultiplayer.vue'; 

// GIFs
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

// Filtrem el leaderboard per no mostrar-nos a nosaltres mateixos a la llista de la dreta
const altresJugadors = computed(() => {
    return workoutStore.leaderboard.filter(j => j.userId !== authStore.user.id);
});

const tempsRestant = ref(60);
const intervalTemps = ref(null);
const mostrarPopup = ref(false);

const minuts = computed(() => Math.floor(tempsRestant.value / 60));
const segons = computed(() => tempsRestant.value % 60);
const segonsFormat = computed(() => (segons.value < 10 ? "0" + segons.value : segons.value));

// === LIFECYCLE ===

onMounted(async () => {
    workoutStore.connectWebSocket(codi_acces, exercici);
    await nextTick();
    startCamera();
    iniciarTemporitzador();
});

onBeforeUnmount(() => {
    // Assegurar neteja si es tanca el component bruscament
    tornar();
});

// === WATCHERS ===

watch(() => workoutStore.lastReceivedPose, (newPoseData) => {
    if (newPoseData && newPoseData.from) {
        nextTick(() => {
            dibuixarEsqueletRemot(newPoseData.from, newPoseData.pose);
        });
    }
}, { deep: true });

// === FUNCIÓ TORNAR CORREGIDA ===

function tornar() {
    // 1. Aturar Càmera Local
    stopCamera();

    // 2. Aturar Temporitzador Local
    if (intervalTemps.value) {
        clearInterval(intervalTemps.value);
        intervalTemps.value = null;
    }

    // 3. Netejar Store (Tanca WebSocket, reseteja comptadors)
    workoutStore.cleanupSession();

    // 4. Navegar a l'inici (o Dashboard)
    router.push('/'); 
}

function iniciarTemporitzador() {
    if (intervalTemps.value) clearInterval(intervalTemps.value);
    
    intervalTemps.value = setInterval(() => {
        if (tempsRestant.value > 0) {
            tempsRestant.value--;
        } else {
            clearInterval(intervalTemps.value);
            obrirPopupFinal();
        }
    }, 1000);
}

function obrirPopupFinal() {
    mostrarPopup.value = true;
    // No cridem 'tornar' aquí encara, esperem que l'usuari tanqui el popup
}

async function startCamera() {
    if (cameraViewRef.value) {
        try {
            await cameraViewRef.value.start();
        } catch (e) { console.error("Error càmera:", e); }
    }
}

function stopCamera() {
    if (cameraViewRef.value) {
        cameraViewRef.value.stop();
    }
}

// === LÒGICA EXERCICIS ===

function handleRepCount() {
    workoutStore.incrementCount();
    up.value = false;
}

function detectingIPublicarMoviment(pose) {
    // Publicar esquelet per WebSocket (perquè els altres ens vegin)
    if (workoutStore.ws?.readyState === WebSocket.OPEN) {
        workoutStore.ws.send(JSON.stringify({
            type: 'pose_update',
            pose: { keypoints: pose.keypoints.map(kp => ({ name: kp.name, x: kp.x, y: kp.y, score: kp.score })) }
        }));
    }

    const exerciciNormalitzat = exercici.toLowerCase();
    // Només comptem reps si el temps no s'ha acabat
    if (tempsRestant.value > 0) {
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

// Alias per al template
const detectarIPublicarMoviment = detectingIPublicarMoviment;

// === DIBUIX CANVAS ===

function dibuixarEsqueletRemot(jugadorId, pose) {
    const canvas = canvasRemots.value[jugadorId];
    if (!canvas || !pose || !pose.keypoints) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Escalar punts si cal (la càmera ve a 640x480, el canvas també ho és al HTML)
    // Si volguessis ajustar per targetes més petites, aquí aplicaries escales.
    
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

// === RECONEIXEMENT EXERCICIS ===

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

let initialY = null;
let jumping = false;
function checkSalt(pose) {
    const peu = pose.keypoints.find(k => k.name === 'left_ankle');
    if (!peu || peu.score < 0.4) return;
    if (initialY === null) initialY = peu.y;
    const delta = initialY - peu.y;
    if (delta > 30 && !jumping) {
        jumping = true;
    } else if (delta < 10 && jumping) {
        jumping = false;
        handleRepCount();
    }
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
.bg-fitai-deep-space {
    background:
        radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
        radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 40%),
        linear-gradient(135deg, #0e111d, #141829 50%, #0e111d 100%);
    background-attachment: fixed;
    min-height: 100vh;
}

.fade-in-container {
    animation: fadeInUp 0.8s cubic-bezier(0.17, 0.84, 0.44, 1) forwards;
}

@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.position-relative {
    position: relative;
}

.top-left-back-btn {
    position: absolute;
    top: 15px;
    left: 15px;
    z-index: 50;
    color: white !important;
    background: #ef4444 !important; /* Vermell per sortir */
    border-radius: 8px !important;
    font-weight: 700 !important;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
    transition: all 0.3s ease;
}

.top-left-back-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.9);
}

.player-card {
    background: rgba(30, 30, 47, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
}

.neon-player-name {
    color: #4dd0e1;
    text-shadow: 0 0 5px #4dd0e1, 0 0 10px #4dd0e1;
}

.neon-player-name-remote {
    color: #a5b4fc;
    text-shadow: 0 0 5px #a5b4fc;
}

.remote-canvas {
    width: 100%;
    height: auto;
    background-color: #111827;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.temps-counter {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #0ea5e9;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
    box-shadow: 0 0 15px rgba(14, 165, 233, 0.7);
    z-index: 100;
}
</style>