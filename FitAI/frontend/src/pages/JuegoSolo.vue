<template>
  <v-app>
    <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
      <v-container
        class="text-center text-white pa-4 pa-md-8 fade-in-container expanded-container position-relative"
        style="max-width: 1400px;"
      >
        
        <v-btn
          class="top-right-finish-btn" 
          variant="flat"
          size="large"
          prepend-icon="mdi-exit-to-app" 
          color="#8b5cf6" 
          @click="tornar"
        >
          Finalitzar Sessió
        </v-btn>

        <v-row class="mt-16 mt-md-0">
          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center order-md-1 order-2">
            
            <CameraView 
              ref="cameraViewRef"
              :timer-active="timerActive"
              :on-check-moviment="checkMoviment"
              @video-ended="detecting = false"
            />

            <TimerCard 
              class="mt-6"
              style="width: 85%;"
              @main-timer-start="startTempsCounter"
              @timer-stop="handleTimerStop"
              @timer-reset="handleTimerReset"
              @timer-finished="handleTimerFinished"
              ref="timerCardRef"
            />
            
            <RepetitionCounter 
              class="mt-8"
              style="width: 85%;"
              :count="count"
            />
            
            <div class="mt-8 d-flex flex-wrap justify-center gap-2 small-btn-group">
              <v-btn
                color="#8b5cf6"
                variant="flat"
                size="large"
                rounded="lg"
                class="control-btn-large action-btn"
                @click="startCamera"
              >
                <v-icon start>mdi-video-outline</v-icon>
                Càmera
              </v-btn>

              <v-btn
                color="red-darken-1"
                variant="outlined"
                size="large"
                rounded="lg"
                class="control-btn-large"
                @click="stopCamera"
              >
                <v-icon start>mdi-stop-circle-outline</v-icon>
                Aturar
              </v-btn>

              <v-btn
                color="#3b82f6"
                variant="flat"
                size="large"
                rounded="lg"
                class="control-btn-large action-btn"
                @click="selectVideo"
              >
                <svg-icon type="mdi" :path="pathCarregar" class="mr-1" width="22" height="22" />Vídeo
              </v-btn>
            </div>

          </v-col>

          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center text-center order-md-2 order-1 mb-10">
            
            <ExerciseInfo 
              :label="exerciciLabel"
              :gif="exerciciGif"
            />

            <LeaderboardCard 
              class="mt-6"
              width="100%"
              max-width="450"
              :users="leaderboard"
            />

          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore';


import CameraView from '../components/CameraView.vue'
import TimerCard from '../components/TimerCard.vue'
import RepetitionCounter from '../components/RepetitionCounter.vue'
import ExerciseInfo from '../components/ExerciseInfo.vue'
import LeaderboardCard from '../components/LeaderboardCard.vue'

import SvgIcon from '@jamescoyle/vue-icon'
import { mdiFolderOutline } from '@mdi/js'


import flexionesGif from '@/assets/flexiones.gif'
import sentadillasGif from '@/assets/sentadillas.gif'
import saltosGif from '@/assets/saltos.gif'
import abdominalesGif from '@/assets/abdominales.gif'
import fonsGif from '@/assets/fons.gif'
import pujadesGif from '@/assets/pujades.gif'

const pathCarregar = mdiFolderOutline
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore();

const exercici = route.params.ejercicio
const codi_acces = route.params.codi_acces 

const noms = { 
  Flexions: 'FLEXIONS', Squats: 'SQUATS', Salts: 'SALTS', Abdominals: 'ABDOMINALS', Fons: 'FONS', Pujades: 'PUJADES',
  flexiones: 'FLEXIONS', sentadillas: 'ESQUATS', saltos: 'SALTS', abdominales: 'ABDOMINALS', fons: 'FONS', pujades: 'PUJADES',
}
const gifs = { 
  Flexions: flexionesGif, Squats: sentadillasGif, Salts: saltosGif, Abdominals: abdominalesGif, Fons: fonsGif, Pujades: pujadesGif,
  flexiones: flexionesGif, sentadillas: sentadillasGif, saltos: saltosGif, abdominales: abdominalesGif, fons: fonsGif, pujades: pujadesGif,
}

const exerciciLabel = noms[exercici] || noms[exercici.charAt(0).toUpperCase() + exercici.slice(1)] || 'EXERCICI'
const exerciciGif = gifs[exercici] || gifs[exercici.charAt(0).toUpperCase() + exercici.slice(1)] || ''


const count = ref(0)
const leaderboard = ref([])
const up = ref(false) 
const detecting = ref(false) 

const ws = ref(null)
const userId = authStore.user.id;
const userName = authStore.userName;

const cameraViewRef = ref(null)
const timerCardRef = ref(null)
const timerActive = ref(false)


const tempsActiuTotal = ref(0) 
let tempsInterval = null       


onMounted(() => connectWebSocket())
onBeforeUnmount(() => {
    stopCamera();
    if (ws.value) ws.value.close();
})


async function startCamera() {
  if (!cameraViewRef.value) return;
  try {
    await cameraViewRef.value.start();
    detecting.value = true;
  } catch (e) {
    console.error('No es pot obrir la càmera:', e.message)
  }
}

function stopCamera() {
  if (!cameraViewRef.value) return;
  cameraViewRef.value.stop();
  detecting.value = false;
}

function selectVideo() {
  if (!cameraViewRef.value) return;
  cameraViewRef.value.select();
  detecting.value = true; 
}


function startTempsCounter() {
  timerActive.value = true
  if (tempsInterval) clearInterval(tempsInterval) 
  tempsInterval = setInterval(() => {
    tempsActiuTotal.value++
  }, 1000)
}

function stopTempsCounter() {
  timerActive.value = false
  if (tempsInterval) {
    clearInterval(tempsInterval)
    tempsInterval = null
  }
}

function handleTimerStop(seconds) {
  stopTempsCounter()
  if (seconds) tempsActiuTotal.value = seconds;
}

function handleTimerFinished(seconds) {
  stopTempsCounter() 
  if (detecting.value) {
    stopCamera()
  }
  tornar(seconds);
}

function handleTimerReset() {
  stopTempsCounter() 
  count.value = 0 
  tempsActiuTotal.value = 0
  initialY = null; 
}


async function tornar(arg = null) {
  stopCamera();
  timerCardRef.value?.stopTimer(); 
  stopTempsCounter(); 
  
  const repsFinals = count.value;
  const exerciciNormalitzat = exercici.toLowerCase();


  let tempsFinal;
  if (typeof arg === 'number') {
      tempsFinal = arg;
  } else {
      tempsFinal = tempsActiuTotal.value;
  }

  console.log("Finalizando sesión -> Reps:", repsFinals, "Temps:", tempsFinal);


  try {
      await fetch('/api/user/save-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              reps: repsFinals,
              time: tempsFinal 
          })
      });
      
      await authStore.refreshUser(); 

  } catch (error) {
      console.error("Error al guardar las estadísticas:", error);
  }


  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({
      type: 'finish',
      reps: repsFinals,
      exercici: exerciciNormalitzat,
      codi_acces: codi_acces
    }));
    ws.value.send(JSON.stringify({ type: 'leave' }));
    ws.value.close();
    ws.value = null; 
  }
  

  router.push({ 
    name: 'EstadistiquesSessio', 
    params: { 
      ejercicio: exercici,
      reps: repsFinals,
      tempsTotal: tempsFinal
    } 
  });
}



function handleRepCount() {
  if (!timerActive.value) return; 

  count.value++;
  up.value = false;
  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({ type: 'update', reps: count.value }));
  }
}

function checkMoviment(pose) {
  const exerciciNormalitzat = exercici.toLowerCase();
  switch (exerciciNormalitzat) {
    case 'flexiones': checkFlexio(pose); break;
    case 'sentadillas': checkEsquat(pose); break;
    case 'saltos': checkSalt(pose); break;
    case 'abdominales': checkAbdominal(pose); break;
    case 'fons': checkFons(pose); break;
    case 'pujades': checkPujades(pose); break;
    case 'flexions': checkFlexio(pose); break;
    case 'squats': checkEsquat(pose); break;
    case 'salts': checkSalt(pose); break;
  }
}

function checkFlexio(pose) {
  const espatlla = pose.keypoints.find(k => k.name === 'left_shoulder')
  const colze = pose.keypoints.find(k => k.name === 'left_elbow') 
  if (!espatlla || !colze || espatlla.score < 0.4 || colze.score < 0.4) return
  const dist = Math.abs(espatlla.y - colze.y)
  const UMBRAL_ARRIBA = 100, UMBRAL_ABAJO = 50 
  if (dist < UMBRAL_ABAJO && !up.value) up.value = true
  if (dist > UMBRAL_ARRIBA && up.value) handleRepCount()
}

function checkEsquat(pose) {
  const maluc = pose.keypoints.find(k => k.name === 'left_hip')
  const genoll = pose.keypoints.find(k => k.name === 'left_knee')
  if (!maluc || !genoll || maluc.score < 0.4 || genoll.score < 0.4) return
  const dist = Math.abs(maluc.y - genoll.y)
  const UMBRAL_ARRIBA = 160, UMBRAL_ABAJO = 100
  if (dist < UMBRAL_ABAJO && !up.value) up.value = true
  if (dist > UMBRAL_ARRIBA && up.value) handleRepCount()
}

let initialY = null;
let jumping = false;
function checkSalt(pose) {
  const peu = pose.keypoints.find(k => k.name === 'left_ankle')
  if (!peu || peu.score < 0.4) return
  if (initialY === null) initialY = peu.y
  const delta = initialY - peu.y 
  const UMBRAL_SALT = 30 
  if (delta > UMBRAL_SALT && !jumping) { 
    jumping = true
  } else if (delta < 10 && jumping) { 
    jumping = false; 
    handleRepCount(); 
  }
}

function checkAbdominal(pose) {
  const nas = pose.keypoints.find((k) => k.name === 'nose')
  const maluc = pose.keypoints.find((k) => k.name === 'left_hip')
  if (!nas || !maluc || nas.score < 0.4 || maluc.score < 0.4) return
  const distancia = Math.abs(nas.y - maluc.y)
  const UMBRAL_ARRIBA = 150; 
  const UMBRAL_ABAJO = 100;
  if (distancia < UMBRAL_ABAJO && !up.value) { up.value = true; }
  if (distancia > UMBRAL_ARRIBA && up.value) { handleRepCount(); }
}

function checkFons(pose) {
  const espatlla = pose.keypoints.find(k => k.name === 'left_shoulder')
  const colze = pose.keypoints.find(k => k.name === 'left_elbow')
  if (!espatlla || !colze || espatlla.score < 0.4 || colze.score < 0.4) return
  const dist = Math.abs(espatlla.y - colze.y)
  const UMBRAL_ARRIBA = 100, UMBRAL_ABAJO = 50 
  if (dist < UMBRAL_ABAJO && !up.value) up.value = true
  if (dist > UMBRAL_ARRIBA && up.value) handleRepCount()
}

function checkPujades(pose) {
  const genoll = pose.keypoints.find(k => k.name === 'left_knee')
  const peu = pose.keypoints.find(k => k.name === 'left_ankle')
  if (!genoll || !peu || genoll.score < 0.4 || peu.score < 0.4) return
  const dist = Math.abs(genoll.y - peu.y)
  const UMBRAL_ABAJO = 200, UMBRAL_ARRIBA = 300 
  if (dist < UMBRAL_ABAJO && !up.value) up.value = true
  if (dist > UMBRAL_ARRIBA && up.value) handleRepCount()
}


function connectWebSocket() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.host;
  const wsUrl = `${wsProtocol}//${wsHost}/ws`;
  
  ws.value = new WebSocket(wsUrl); 

  ws.value.onopen = () => {
    ws.value.send(JSON.stringify({ type: 'join', codi_acces, userId, userName }));
  };

  ws.value.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'leaderboard') {
      leaderboard.value = message.leaderboard;
    }
    if (message.type === 'joined') {
      ws.value.send(JSON.stringify({ type: 'start', codi_acces: codi_acces }));
    }
  };
  ws.value.onclose = () => console.log('Desconnectat del servidor');
}
</script>

<style scoped>

.bg-fitai-deep-space {
  background: 
    radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
    radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 40%),
    linear-gradient(135deg, #0e111d, #141829 50%, #0e111d 100%);
  background-attachment: fixed;
  background-size: cover;
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

.top-right-finish-btn {
  position: absolute;
  top: 15px; 
  right: 15px; 
  z-index: 10;
  color: white !important; 
  background: #8b5cf6 !important; 
  border-radius: 8px !important; 
  font-weight: 700 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 8px rgba(139, 92, 246, 0.6); 
  transition: all 0.2s ease;
  min-width: 180px; 
  margin-top: 10px;
}
.top-right-finish-btn:hover {
    transform: translateY(-2px); 
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.7), 0 0 15px rgba(139, 92, 246, 0.8);
}
@media (max-width: 600px) {
  .top-right-finish-btn {
    position: static; 
    width: 100%;
    margin-bottom: 20px;
    margin-top: 0;
  }
}


.shadow-card {
  box-shadow: 0 8px 35px rgba(0, 0, 0, 0.6);
  transition: transform 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.shadow-card:hover {
    transform: translateY(-2px);
}


.small-btn-group {
  gap: 12px;
}
.control-btn-large {
  font-size: 1rem;
  padding: 8px 16px !important;
  min-width: 140px;
  font-weight: 700;
  letter-spacing: 0.5px;
  transition: all 0.25s ease-in-out;
  border-radius: 8px !important;
}
@media (max-width: 450px) {
  .control-btn-large {
    min-width: 120px;
    font-size: 0.9rem;
    padding: 6px 12px !important;
  }
}
.action-btn {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}
.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(130, 90, 255, 0.6);
  filter: brightness(1.1); 
}

</style>