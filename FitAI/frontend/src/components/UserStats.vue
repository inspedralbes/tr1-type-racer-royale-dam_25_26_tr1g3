<template>
  <div>
    <v-card 
      class="rounded-xl overflow-hidden shadow-card video-card"
      elevation="12"
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

    <div class="mt-6 d-flex flex-wrap justify-center gap-2 small-btn-group">
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

      <input
        ref="fileInput"
        type="file"
        accept="video/*"
        @change="loadVideoFromFile"
        style="display: none"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'
import { useWorkoutStore } from '@/stores/workoutStore' // Importem el nou store

import SvgIcon from '@jamescoyle/vue-icon'
import { mdiFolderOutline } from '@mdi/js'

// === Props ===
// Aquest component necessita saber quin exercici detectar
const props = defineProps({
  exercici: {
    type: String,
    required: true
  }
})

// === Stores ===
const workoutStore = useWorkoutStore()

// === Constants i Refs Locals ===
const pathCarregar = mdiFolderOutline
const video = ref(null)
const canvas = ref(null)
const fileInput = ref(null)

let detector = null
let up = false
let streamRef = null
let detecting = false

// === Neteja en desmuntar ===
onBeforeUnmount(() => {
  stopCamera()
})

// === Funcions de Càmera/Vídeo ===
async function startCamera() {
  try {
    if (video.value?.offsetWidth && video.value?.offsetHeight) {
      canvas.value.width = video.value.offsetWidth;
      canvas.value.height = video.value.offsetHeight;
    } else {
      canvas.value.width = 640;
      canvas.value.height = 480;
    }

    streamRef = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    video.value.srcObject = streamRef
    await video.value.play()
    if (!detector) await initMoveNet()
    if (!detecting) {
      detecting = true
      detectPose()
    }
  } catch (e) {
    console.error('No es pot obrir la càmera:', e.message)
  }
}

function stopCamera() {
  if (streamRef) {
    streamRef.getTracks().forEach((t) => t.stop())
    if (video.value) video.value.srcObject = null;
    streamRef = null
  }
  detecting = false
  const ctx = canvas.value?.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
}

function selectVideo() {
  stopCamera()
  fileInput.value?.click()
}

async function loadVideoFromFile(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const ctx = canvas.value?.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  const url = URL.createObjectURL(file)
  video.value.srcObject = null
  stopCamera() 
  video.value.src = url
  
  video.value.onloadedmetadata = () => {
    canvas.value.width = video.value.videoWidth;
    canvas.value.height = video.value.videoHeight;
  };
  
  await video.value.play()
  if (!detector) await initMoveNet()
  detecting = true
  detectVideoFrame()
}

// === Funcions de Detecció (IA) ===
async function initMoveNet() {
  await tf.ready()
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  })
}

async function detectPose() {
  const ctx = canvas.value?.getContext('2d')
  async function poseDetectionFrame() {
    if (!detecting || !video.value || video.value.paused || video.value.ended) return
    
    if (canvas.value.width !== video.value.videoWidth || canvas.value.height !== video.value.videoHeight) {
        canvas.value.width = video.value.videoWidth || 640;
        canvas.value.height = video.value.videoHeight || 480;
    }

    const poses = await detector.estimatePoses(video.value, { flipHorizontal: false })

    if (poses.length > 0) {
      drawPose(ctx, poses[0])
      // ! CANVI CLAU: Comprovem l'estat del timer des de Pinia
      if (workoutStore.timerActive) {
        checkMoviment(poses[0])
      }
    }
    requestAnimationFrame(poseDetectionFrame)
  }
  requestAnimationFrame(poseDetectionFrame)
}

async function detectVideoFrame() {
  const ctx = canvas.value?.getContext('2d')
  async function frameLoop() {
    if (!detecting || !video.value || video.value.paused || video.value.ended) {
        if (video.value?.ended) {
             detecting = false;
        }
        return
    }

    if (canvas.value.width !== video.value.videoWidth || canvas.value.height !== video.value.videoHeight) {
        canvas.value.width = video.value.videoWidth || 640;
        canvas.value.height = video.value.videoHeight || 480;
    }
    
    const poses = await detector.estimatePoses(video.value)
    if (poses.length > 0) {
      drawPose(ctx, poses[0])
      // ! CANVI CLAU: Comprovem l'estat del timer des de Pinia
      if (workoutStore.timerActive) {
        checkMoviment(poses[0])
      }
    }
    requestAnimationFrame(frameLoop)
  }
  requestAnimationFrame(frameLoop)
}

function drawPose(ctx, pose) {
  // ... (La funció drawPose és idèntica, no cal copiar-la aquí per brevetat) ...
  // ... (Copiar i enganxar la teva funció 'drawPose' sencera aquí) ...
  const videoElement = video.value;
  const canvasElement = canvas.value;

  if (!videoElement || !canvasElement || !pose || !pose.keypoints) return;
  const videoDisplayedWidth = videoElement.offsetWidth;
  const videoDisplayedHeight = videoElement.offsetHeight;
  
  const videoNaturalWidth = videoElement.videoWidth;
  const videoNaturalHeight = videoElement.videoHeight;
  
  if (canvasElement.width !== videoDisplayedWidth || canvasElement.height !== videoDisplayedHeight) {
    canvasElement.width = videoDisplayedWidth;
    canvasElement.height = videoDisplayedHeight;
  }
 
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  const videoAspectRatio = videoNaturalWidth / videoNaturalHeight;
  const canvasAspectRatio = videoDisplayedWidth / videoDisplayedHeight;
  
  let scaleFactor;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspectRatio > canvasAspectRatio) {
    scaleFactor = videoDisplayedHeight / videoNaturalHeight;
    offsetX = (videoDisplayedWidth - videoNaturalWidth * scaleFactor) / 2;
  } else {
    scaleFactor = videoDisplayedWidth / videoNaturalWidth;
    offsetY = (videoDisplayedHeight - videoNaturalHeight * scaleFactor) / 2;
  }

  const transformPoint = (kp) => {
    if (!kp) return null;
    return {
      x: kp.x * scaleFactor + offsetX,
      y: kp.y * scaleFactor + offsetY
    };
  };
  
  ctx.fillStyle = '#00ffaa'; 
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#00ffaa';
  
  for (const kp of pose.keypoints) {
    if (kp.score > 0.4) {
      const transformed = transformPoint(kp);
      ctx.beginPath();
      ctx.arc(transformed.x, transformed.y, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  const connections = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#8b5cf6'; 
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#8b5cf6';
  
  for (const [i, j] of connections) {
    const kp1 = pose.keypoints[i];
    const kp2 = pose.keypoints[j];

    if (kp1.score > 0.4 && kp2.score > 0.4) {
      const p1 = transformPoint(kp1);
      const p2 = transformPoint(kp2);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 0; 
}


// === Lògica de Moviment ===

function handleRepCount() {
    up = false;
    // ! CANVI CLAU: Cridem a l'acció de Pinia
    workoutStore.incrementCount();
}

function checkMoviment(pose) {
    // ! CANVI CLAU: Llegim l'exercici de les props
    const exerciciNormalitzat = props.exercici.toLowerCase();

    switch (exerciciNormalitzat) {
        case 'flexiones':
        case 'flexions':
            checkFlexio(pose); 
            break;
        case 'sentadillas':
        case 'squats':
            checkEsquat(pose); 
            break;
        case 'saltos':
        case 'salts':
            checkSalt(pose); 
            break;
        case 'abdominales':
            checkAbdominal(pose);
            break;
        case 'fons':
            checkFons(pose);
            break;
        case 'pujades':
            checkPujades(pose);
            break;
    }
}

// ... (Totes les teves funcions checkFlexio, checkEsquat, checkSalt, etc., van aquí) ...
// ... (Són idèntiques, ja que 'handleRepCount' ha estat modificat) ...

function checkFlexio(pose) {
    const espatlla = pose.keypoints.find(k => k.name === 'left_shoulder')
    const canell = pose.keypoints.find(k => k.name === 'left_wrist')
    if (!espatlla || !canell || espatlla.score < 0.4 || canell.score < 0.4) return
    const dist = Math.abs(espatlla.y - canell.y)
    const UMBRAL_ARRIBA = 200, UMBRAL_ABAJO = 100
    if (dist < UMBRAL_ABAJO && !up) up = true
    if (dist > UMBRAL_ARRIBA && up) handleRepCount()
}

function checkEsquat(pose) {
    const maluc = pose.keypoints.find(k => k.name === 'left_hip')
    const genoll = pose.keypoints.find(k => k.name === 'left_knee')
    if (!maluc || !genoll || maluc.score < 0.4 || genoll.score < 0.4) return
    const dist = Math.abs(maluc.y - genoll.y)
    const UMBRAL_ARRIBA = 160, UMBRAL_ABAJO = 100
    if (dist < UMBRAL_ABAJO && !up) up = true
    if (dist > UMBRAL_ARRIBA && up) handleRepCount()
}

let initialY = null;
let jumping = false;
function checkSalt(pose) {
    const peu = pose.keypoints.find(k => k.name === 'left_ankle')
    if (!peu || peu.score < 0.4) return
    if (initialY === null) initialY = peu.y
    const delta = initialY - peu.y
    const UMBRAL_SALT = 60
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

 if (distancia < UMBRAL_ABAJO && !up) {
   up = true; 
 }

 if (distancia > UMBRAL_ARRIBA && up) {
   handleRepCount(); 
 }
}

function checkFons(pose) {
    const espatlla = pose.keypoints.find(k => k.name === 'left_shoulder')
    const colze = pose.keypoints.find(k => k.name === 'left_elbow')
    if (!espatlla || !colze || espatlla.score < 0.4 || colze.score < 0.4) return
    const dist = Math.abs(espatlla.y - colze.y)
    const UMBRAL_ARRIBA = 100, UMBRAL_ABAJO = 50 
    if (dist < UMBRAL_ABAJO && !up) up = true
    if (dist > UMBRAL_ARRIBA && up) handleRepCount()
}

function checkPujades(pose) {
    const genoll = pose.keypoints.find(k => k.name === 'left_knee')
    const peu = pose.keypoints.find(k => k.name === 'left_ankle')
    if (!genoll || !peu || genoll.score < 0.4 || genoll.score < 0.4) return
    const dist = Math.abs(genoll.y - peu.y)
    const UMBRAL_ABAJO = 200, UMBRAL_ARRIBA = 300 
    if (dist < UMBRAL_ABAJO && !up) up = true
    if (dist > UMBRAL_ARRIBA && up) handleRepCount()
}
</script>

<style scoped>
/* ==================================== */
/* ======== CÁMARA ======== */
/* ==================================== */
.shadow-card {
  box-shadow: 0 8px 35px rgba(0, 0, 0, 0.6);
  transition: transform 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.shadow-card:hover {
    transform: translateY(-2px);
}
.video-card {
    /* (Pots afegir estils específics del video-card si cal) */
}

/* ==================================== */
/* ======== BOTONES DE ACCIÓN ======== */
/* ==================================== */
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