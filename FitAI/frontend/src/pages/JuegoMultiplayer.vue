<template>
  <v-app>
    <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
      <v-container
        class="text-center text-white pa-4 pa-md-8 fade-in-container expanded-container position-relative"
        style="max-width: 1600px;"
      >
        <!-- Botó de finalitzar sessió -->
        <v-btn
          class="top-left-back-btn"
          variant="flat"
          size="large"
          prepend-icon="mdi-check-circle-outline"
          color="success"
          @click="finalitzarSessio"
        >
          Finalitzar Sessió
        </v-btn>

        <v-row class="mt-16 mt-md-0">
          <!-- ============================================= -->
          <!-- ===== COLUMNA ESQUERRA: JUGADOR LOCAL ===== -->
          <!-- ============================================= -->
          <v-col cols="12" md="7" class="d-flex flex-column align-center order-md-1 order-2">
            <!-- Nom del jugador local -->
            <h2 class="text-h5 font-weight-bold mb-3 neon-player-name">
              <v-icon color="cyan-accent-3" start>mdi-account-circle</v-icon>
              {{ authStore.userName }} (Tu)
            </h2>

            <!-- Vista de la càmera local -->
            <CameraView
              ref="cameraViewRef"
              :timer-active="true"
              :on-check-moviment="detectarIPublicarMoviment"
              style="max-width: 95%; border-radius: 16px; overflow: hidden;"
            />

            <!-- Comptador de repeticions local (llegeix des de l'store) -->
            <RepetitionCounter
              class="mt-6"
              style="width: 85%; max-width: 450px;"
              :count="workoutStore.count"
            />
          </v-col>

          <!-- ============================================= -->
          <!-- ===== COLUMNA DRETA: ALTRES JUGADORS I INFO ===== -->
          <!-- ============================================= -->
          <v-col cols="12" md="5" class="d-flex flex-column align-center order-md-2 order-1">
            <!-- Informació de l'exercici -->
            <ExerciseInfo :label="exerciciLabel" :gif="exerciciGif" class="mb-6"/>

            <!-- Graella per als altres jugadors -->
            <v-row dense class="justify-center" style="width: 100%;">
              <v-col
                v-for="jugador in altresJugadors"
                :key="jugador.userId"
                cols="12"
                sm="6"
              >
                <v-card class="player-card pa-3 rounded-xl" elevation="8">
                  <h4 class="text-body-1 font-weight-bold neon-player-name-remote mb-2">
                    {{ jugador.userName }}
                  </h4>
                  <!-- Canvas per a l'esquelet remot -->
                  <canvas
                    :ref="el => canvasRemots[jugador.userId] = el"
                    width="640"
                    height="480"
                    class="rounded-lg remote-canvas"
                  ></canvas>
                  <div class="text-h5 font-weight-black text-cyan-lighten-2 mt-2">
                    {{ jugador.reps }} reps
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
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

// GIFs
import flexionesGif from '@/assets/flexiones.gif';
import sentadillasGif from '@/assets/sentadillas.gif';
import saltosGif from '@/assets/saltos.gif';
import abdominalesGif from '@/assets/abdominales.gif';
import fonsGif from '@/assets/fons.gif';
import pujadesGif from '@/assets/pujades.gif';

// --- SETUP INICIAL ---
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const workoutStore = useWorkoutStore(); // Instanciem l'store del joc

const exercici = route.params.ejercicio;
const codi_acces = route.params.codi_acces;

// --- GESTIÓ DE NOMS I GIFS ---
const noms = { Flexions: 'FLEXIONS', Squats: 'SQUATS', Salts: 'SALTS', Abdominals: 'ABDOMINALS', Fons: 'FONS', Pujades: 'PUJADES', flexiones: 'FLEXIONS', sentadillas: 'ESQUATS', saltos: 'SALTS', abdominales: 'ABDOMINALS', fons: 'FONS', pujades: 'PUJADES' };
const gifs = { Flexions: flexionesGif, Squats: sentadillasGif, Salts: saltosGif, Abdominals: abdominalesGif, Fons: fonsGif, Pujades: pujadesGif, flexiones: flexionesGif, sentadillas: sentadillasGif, saltos: saltosGif, abdominales: abdominalesGif, fons: fonsGif, pujades: pujadesGif };
const exerciciLabel = noms[exercici] || 'EXERCICI';
const exerciciGif = gifs[exercici] || '';

// --- ESTAT LOCAL DEL COMPONENT (Mínim i només per a la UI) ---
const up = ref(false); // Per a la lògica de detecció de moviment
const cameraViewRef = ref(null);
const canvasRemots = ref({});

// --- PROPIETATS COMPUTADES (Llegeixen l'estat des de l'store de Pinia) ---
const altresJugadors = computed(() => {
  return workoutStore.leaderboard.filter(j => j.userId !== authStore.user.id).slice(0, 3);
});

// --- CICLE DE VIDA (Delega la lògica a les accions de l'store) ---
onMounted(async () => {
  workoutStore.connectWebSocket(codi_acces, exercici);
  await nextTick();
  startCamera();
});

onBeforeUnmount(() => {
  workoutStore.cleanupSession(); // Neteja la sessió (desconnecta ws, reinicia comptadors, etc.)
});

// --- OBSERVADOR (Watcher): Aquesta és la clau per a la reactivitat remota ---
// Cada cop que l'store rep un nou esquelet, aquest watcher s'activa.
watch(() => workoutStore.lastReceivedPose, (newPoseData) => {
  if (newPoseData && newPoseData.from) {
    dibuixarEsqueletRemot(newPoseData.from, newPoseData.pose);
  }
}, { deep: true });


// --- LÒGICA DE LA CÀMERA LOCAL ---
async function startCamera() {
  if (cameraViewRef.value) {
    try {
      await cameraViewRef.value.start();
    } catch (e) {
      console.error('No es pot obrir la càmera:', e.message);
    }
  }
}

// --- LÒGICA DEL JOC I DETECCIÓ DE MOVIMENT ---

// Aquesta funció es crida quan es completa una repetició
function handleRepCount() {
  workoutStore.incrementCount(); // Crida l'acció de l'store per sumar 1
  up.value = false;
}

// Aquesta funció es crida a cada frame de la nostra càmera
function detectarIPublicarMoviment(pose) {
  // 1. Publica el nostre esquelet a la resta de jugadors
  if (workoutStore.ws?.readyState === WebSocket.OPEN) {
    workoutStore.ws.send(JSON.stringify({
      type: 'pose_update',
      pose: { keypoints: pose.keypoints.map(kp => ({ name: kp.name, x: kp.x, y: kp.y, score: kp.score })) }
    }));
  }

  // 2. Comprova el nostre moviment per comptar repeticions localment
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

// Dibuixa l'esquelet rebut d'un altre jugador en el seu canvas
function dibuixarEsqueletRemot(jugadorId, pose) {
    const canvas = canvasRemots.value[jugadorId];
    if (!canvas || !pose || !pose.keypoints) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const keypointsMap = new Map(pose.keypoints.map(kp => [kp.name, kp]));
    const connections = [ ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'], ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'], ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'], ['left_hip', 'left_knee'], ['right_hip', 'right_knee'], ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle'] ];
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

// --- FUNCIONS DE DETECCIÓ (Idèntiques a JuegoSolo.vue) ---
function checkFlexio(pose) {
  const espatlla = pose.keypoints.find(k => k.name === 'left_shoulder');
  const colze = pose.keypoints.find(k => k.name === 'left_elbow');
  if (!espatlla || !colze || espatlla.score < 0.4 || colze.score < 0.4) return;
  const dist = Math.abs(espatlla.y - colze.y);
  const UMBRAL_ARRIBA = 100, UMBRAL_ABAJO = 50;
  if (dist < UMBRAL_ABAJO && !up.value) up.value = true;
  if (dist > UMBRAL_ARRIBA && up.value) handleRepCount();
}

function checkEsquat(pose) {
  const maluc = pose.keypoints.find(k => k.name === 'left_hip');
  const genoll = pose.keypoints.find(k => k.name === 'left_knee');
  if (!maluc || !genoll || maluc.score < 0.4 || genoll.score < 0.4) return;
  const dist = Math.abs(maluc.y - genoll.y);
  const UMBRAL_ARRIBA = 160, UMBRAL_ABAJO = 100;
  if (dist < UMBRAL_ABAJO && !up.value) up.value = true;
  if (dist > UMBRAL_ARRIBA && up.value) handleRepCount();
}

let initialY = null;
let jumping = false;
function checkSalt(pose) {
  const peu = pose.keypoints.find(k => k.name === 'left_ankle');
  if (!peu || peu.score < 0.4) return;
  if (initialY === null) initialY = peu.y;
  const delta = initialY - peu.y;
  const UMBRAL_SALT = 30;
  if (delta > UMBRAL_SALT && !jumping) {
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
  const UMBRAL_ARRIBA = 150, UMBRAL_ABAJO = 100;
  if (distancia < UMBRAL_ABAJO && !up.value) { up.value = true; }
  if (distancia > UMBRAL_ARRIBA && up.value) { handleRepCount(); }
}

function checkFons(pose) {
  const espatlla = pose.keypoints.find(k => k.name === 'left_shoulder');
  const colze = pose.keypoints.find(k => k.name === 'left_elbow');
  if (!espatlla || !colze || espatlla.score < 0.4 || colze.score < 0.4) return;
  const dist = Math.abs(espatlla.y - colze.y);
  const UMBRAL_ARRIBA = 100, UMBRAL_ABAJO = 50;
  if (dist < UMBRAL_ABAJO && !up.value) up.value = true;
  if (dist > UMBRAL_ARRIBA && up.value) handleRepCount();
}

function checkPujades(pose) {
  const genoll = pose.keypoints.find(k => k.name === 'left_knee');
  const peu = pose.keypoints.find(k => k.name === 'left_ankle');
  if (!genoll || !peu || genoll.score < 0.4 || peu.score < 0.4) return;
  const dist = Math.abs(genoll.y - peu.y);
  const UMBRAL_ABAJO = 200, UMBRAL_ARRIBA = 300;
  if (dist < UMBRAL_ABAJO && !up.value) up.value = true;
  if (dist > UMBRAL_ARRIBA && up.value) handleRepCount();
}

function finalitzarSessio(isUnmount = false) {
  stopCamera();
  const repsFinals = count.value;

  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({
      type: 'finish',
      reps: repsFinals,
      exercici: exercici.toLowerCase(),
      codi_acces: codi_acces
    }));
    ws.value.send(JSON.stringify({ type: 'leave' }));
    ws.value.close();
    ws.value = null;
  }

  if (!isUnmount) {
    router.push({
      name: 'EstadistiquesSessio',
      params: {
        ejercicio: exercici,
        reps: repsFinals,
        tempsTotal: 0,
        calories: Math.round(repsFinals * 0.35)
      }
    });
  }
}
</script>

<style scoped>
.bg-fitai-deep-space {
  background:
    radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
    radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 40%),
    linear-gradient(135deg, #0e111d, #141829 50%, #0e111d 100%);
  background-attachment: fixed;
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
  z-index: 10;
  color: white !important;
  background: #22c55e !important;
  border-radius: 8px !important;
  font-weight: 700 !important;
  box-shadow: 0 0 15px rgba(34, 197, 94, 0.8);
  transition: all 0.3s ease;
}
.top-left-back-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(34, 197, 94, 1);
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
</style>