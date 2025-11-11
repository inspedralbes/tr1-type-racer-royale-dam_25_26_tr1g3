<template>
  <v-app>
    <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
      <v-container
        class="text-center text-white pa-4 pa-md-8 fade-in-container expanded-container position-relative"
        style="max-width: 1400px;"
      >
        <v-btn
          class="top-left-back-btn rectangular-btn"
          variant="flat"
          size="large"
          prepend-icon="mdi-arrow-left"
          @click="tornar"
        >
          Tornar
        </v-btn>

        <v-row class="mt-16 mt-md-0">
          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center order-md-1 order-2">
            
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

            <v-card
              class="mt-8 py-5 px-6 text-center rounded-xl count-card"
              color="transparent"
              elevation="10"
              style="width: 85%; border: 2px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); background: rgba(0, 0, 0, 0.3);"
            >
              <h3 class="text-h6 font-weight-regular mb-2 text-grey-lighten-2">REPETICIONS</h3>
              <h1 class="text-h1 font-weight-black text-cyan-lighten-2 counter-value">{{ count }}</h1>
            </v-card>
          </v-col>

          <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center text-center order-md-2 order-1 mb-10">
            
            <h2 class="exercise-title mb-8">
              {{ exerciciLabel }}
            </h2>

            <v-card class="rounded-xl overflow-hidden shadow-card" elevation="8" width="100%" max-width="450">
              <img
                :src="exerciciGif"
                :alt="exerciciLabel"
                class="rounded-lg"
                width="100%"
                style="object-fit: cover; max-height: 400px;"
              />
            </v-card>

            <p class="text-body-1 text-grey-lighten-3 mb-6 font-italic info-text">
              Segueix l’exemple o utilitza la teva pròpia càmera.
            </p>

            <v-card
              class="pa-4 pa-sm-5 rounded-xl mb-6 bg-light-card leaderboard-card"
              elevation="8"
              width="100%"
              max-width="450"
            >
              <h3 class="text-h6 font-weight-bold text-teal-accent-3 mb-4 ranking-title">
                🏆 CLASSIFICACIÓ
              </h3>

              <v-list density="compact" class="text-grey-lighten-3 bg-transparent ranking-list">
                <v-list-item
                  v-for="(user, index) in leaderboard"
                  :key="user.userId"
                  class="rounded-lg mb-2 pa-2 list-item-glow"
                  :class="index === 0 ? 'bg-top1' : index === 1 ? 'bg-top2' : index === 2 ? 'bg-top3' : 'bg-standard'"
                  style="border: 1px solid rgba(255, 255, 255, 0.05);"
                >
                  <div class="d-flex justify-space-between align-center text-body-1 font-weight-medium">
                    <div>
                      <v-icon size="small" class="mr-3" :color="index === 0 ? 'yellow-accent-4' : 'grey-lighten-2'">
                        {{ index === 0 ? 'mdi-trophy-variant' : 'mdi-account-circle' }}
                      </v-icon>
                      <strong class="mr-2">{{ index + 1 }}.</strong> {{ user.userName }}
                    </div>
                    <span class="font-weight-black" :class="index < 3 ? 'text-h6 text-teal-accent-3' : 'text-body-1'">
                      {{ user.reps }} <span class="text-caption font-weight-light">reps</span>
                    </span>
                  </div>
                </v-list-item>
              </v-list>
              <div v-if="!leaderboard.length" class="text-center text-grey-darken-1 pt-3">
                  No hi ha dades a la classificació. Comença a entrenar!
              </div>
            </v-card>
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

import SvgIcon from '@jamescoyle/vue-icon'
import { mdiFolderOutline } from '@mdi/js'

// ===================================================================
// 1. GESTIÓN DE GIFS (Tomado del primer script)
// Se recomienda usar las rutas directas como en el primer script si
// tu configuración de Vite/Webpack lo soporta:
// ===================================================================
import flexionesGif from '@/assets/flexiones.gif'
import sentadillasGif from '@/assets/sentadillas.gif'
import saltosGif from '@/assets/saltos.gif'
import abdominalesGif from '@/assets/abdominales.gif'
import fonsGif from '@/assets/fons.gif'
import pujadesGif from '@/assets/pujades.gif'

const pathCarregar = mdiFolderOutline

const route = useRoute()
const router = useRouter()

const exercici = route.params.ejercicio // Usa 'ejercicio' directamente
const sessionId = route.params.sessionId

// Mapeo de nombres de ejercicio (ajustado para usar las claves del segundo script si son las que vienen por URL)
const noms = {
  Flexions: 'FLEXIONS',
  Squats: 'ESQUATS',
  Salts: 'SALTS',
  Abdominals: 'ABDOMINALS',
  Fons: 'FONS',
  Pujades: 'PUJADES',
  // Asegúrate de que las claves coincidan con el parámetro de ruta `exercici`
  flexiones: 'FLEXIONS',
  sentadillas: 'ESQUATS',
  saltos: 'SALTS',
  abdominales: 'ABDOMINALS',
  fons: 'FONS',
  pujades: 'PUJADES',
}

// Mapeo de GIFs (tomado del primer script con las claves ajustadas)
const gifs = {
  Flexions: flexionesGif,
  Squats: sentadillasGif,
  Salts: saltosGif,
  Abdominals: abdominalesGif,
  Fons: fonsGif,
  Pujades: pujadesGif,
  // Asegúrate de que las claves coincidan con el parámetro de ruta `
  flexiones: flexionesGif,
  sentadillas: sentadillasGif,
  saltos: saltosGif,
  abdominales: abdominalesGif,
  fons: fonsGif,
  pujades: pujadesGif,
}

// Determinar el label y el GIF usando el valor de la URL
const exerciciLabel = noms[exercici] || noms[exercici.charAt(0).toUpperCase() + exercici.slice(1)] || 'EXERCICI'
const exerciciGif = gifs[exercici] || gifs[exercici.charAt(0).toUpperCase() + exercici.slice(1)] || ''

// ===================================================================
// 2. ESTADO
// ===================================================================
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

// ===================================================================
// 3. LIFECYCLE HOOKS
// ===================================================================
onMounted(() => connectWebSocket())

onBeforeUnmount(() => {
  stopCamera();
  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({ type: 'leave' }))
    ws.value.close()
  }
})

// ===================================================================
// 4. FUNCIONES DE CÁMARA/VIDEO (Combinadas y limpiadas)
// Se mantiene la lógica del primer script para la inicialización
// del canvas/video, ya que es más limpia.
// ===================================================================

async function startCamera() {
  try {
    // Inicializar dimensiones del canvas
    if (video.value.offsetWidth && video.value.offsetHeight) {
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
    video.value.srcObject = null
    streamRef = null
    detecting = false
    const ctx = canvas.value.getContext('2d');
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  }
}

function selectVideo() {
  stopCamera()
  fileInput.value?.click()
}

async function loadVideoFromFile(event) {
  const file = event.target.files[0]
  if (!file) return
  
  // 1. Comprova el format (millor si ho fas abans de carregar)
  if (!file.type.startsWith('video/mp4') && !file.type.startsWith('video/webm')) {
    console.warn('Format de vídeo no recomanat. Si us plau, utilitza MP4 o WebM.');
    // Podries mostrar un error a l'usuari aquí
  }
  
  const ctx = canvas.value.getContext('2d');
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  const url = URL.createObjectURL(file)
  video.value.srcObject = null
  stopCamera() 
  video.value.src = url
  
  video.value.onloadedmetadata = async () => {
    // !! IMPORTANT !!
    // Ara que el vídeo està carregat, ajustem el canvas a la mida
    // VISIBLE del vídeo (offsetWidth) per a la funció drawPose.
    canvas.value.width = video.value.offsetWidth;
    canvas.value.height = video.value.offsetHeight;
    
    // Assegura't que MoveNet està llest
    if (!detector) await initMoveNet()
    
    // Inicia la detecció NOMÉS ARA
    detecting = true
    detectVideoFrame()
    
    // Inicia la reproducció (ho pots fer abans, però és més segur aquí)
    await video.value.play()
  };

}

async function initMoveNet() {
  await tf.ready()
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  })
}

// El resto de detectPose y detectVideoFrame son idénticas en ambos scripts,
// así que mantendremos las del primer script, ya que son ligeramente más compactas.
async function detectPose() {
  const ctx = canvas.value.getContext('2d')
  async function poseDetectionFrame() {
    // !! CORREGIT !! Afegit !video.value
    if (!detecting || !video.value || video.value.paused || video.value.ended) return
    
    // !! ELIMINAT !! Traiem el redimensionament d'aquí.
    // Ja ho fa onloadedmetadata (a l'inici) i drawPose (a cada frame)
    /*
    if (canvas.value.width !== video.value.videoWidth || canvas.value.height !== video.value.videoHeight) {
        canvas.value.width = video.value.videoWidth || 640;
        canvas.value.height = video.value.videoHeight || 480;
    }
    */

    const poses = await detector.estimatePoses(video.value, { flipHorizontal: false })

    if (poses.length > 0) {
      drawPose(ctx, poses[0])
      checkMoviment(poses[0])
    }
    requestAnimationFrame(poseDetectionFrame)
  }
  requestAnimationFrame(poseDetectionFrame)
}

async function detectVideoFrame() {
  const ctx = canvas.value.getContext('2d')
  async function frameLoop() {
    // !! CORREGIT !! Afegit !video.value
    if (!detecting || !video.value || video.value.paused || video.value.ended) {
        if (video.value && video.value.ended) { // Comprovació extra
              detecting = false;
        }
        return
    }

    // !! ELIMINAT !! Traiem el redimensionament d'aquí.
    /*
    if (canvas.value.width !== video.value.videoWidth || canvas.value.height !== video.value.videoHeight) {
        canvas.value.width = video.value.videoWidth || 640;
        canvas.value.height = video.value.videoHeight || 480;
    }
    */
    
    const poses = await detector.estimatePoses(video.value)
    if (poses.length > 0) {
      drawPose(ctx, poses[0])
      checkMoviment(poses[0])
    }
    requestAnimationFrame(frameLoop)
  }
  requestAnimationFrame(frameLoop)
}
// ===================================================================
// 5. DRAWPOSE (Tomado del segundo script por su lógica de escalado)
// Es crucial para que el esqueleto se dibuje bien si el video
// no tiene el mismo tamaño que el canvas mostrado.
// ===================================================================

function drawPose(ctx, pose) {
  const videoElement = video.value;
  const canvasElement = canvas.value;

  if (!videoElement || !canvasElement || !pose || !pose.keypoints) return;

  // Usa las dimensiones *mostradas* por el elemento <video> en el DOM
  // para escalar los puntos clave
  const videoDisplayedWidth = videoElement.offsetWidth;
  const videoDisplayedHeight = videoElement.offsetHeight;
  
  // Usa las dimensiones *naturales* del video para el cálculo de ratio
  const videoNaturalWidth = videoElement.videoWidth;
  const videoNaturalHeight = videoElement.videoHeight;
  
  // El canvas debe tener el mismo tamaño que el video mostrado
  if (canvasElement.width !== videoDisplayedWidth || canvasElement.height !== videoDisplayedHeight) {
    canvasElement.width = videoDisplayedWidth;
    canvasElement.height = videoDisplayedHeight;
  }

  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Calcular el factor de escalado y el desplazamiento (ej. letterboxing/pillarboxing)
  const videoAspectRatio = videoNaturalWidth / videoNaturalHeight;
  const canvasAspectRatio = videoDisplayedWidth / videoDisplayedHeight;
  
  let scaleFactor;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspectRatio > canvasAspectRatio) {
    // Si el video es más ancho (proporcionalmente), el factor se basa en la altura
    scaleFactor = videoDisplayedHeight / videoNaturalHeight;
    offsetX = (videoDisplayedWidth - videoNaturalWidth * scaleFactor) / 2;
  } else {
    // Si el video es más alto (proporcionalmente), el factor se basa en la anchura
    scaleFactor = videoDisplayedWidth / videoNaturalWidth;
    offsetY = (videoDisplayedHeight - videoNaturalHeight * scaleFactor) / 2;
  }

  // Función de transformación para escalar y desplazar cada punto
  const transformPoint = (kp) => {
    if (!kp) return null;
    return {
      x: kp.x * scaleFactor + offsetX,
      y: kp.y * scaleFactor + offsetY
    };
  };
  
  // Dibujar puntos clave
  ctx.fillStyle = '#00ffaa'; // Neón verde/cian
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

  // Dibujar esqueletos (conexiones)
  // Usamos getAdjacentPairs para la detección de MoveNet
  const connections = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#8b5cf6'; // Morado neón para las líneas
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

  ctx.shadowBlur = 0; // Resetear sombra
}

// ===================================================================
// 5.1. FUNCIÓN AUXILIAR PARA CÁLCULO DE ÁNGULO
// ===================================================================


/**
* Calcula el ángulo en grados formado por tres puntos clave (A, B, C).
* El ángulo se centra en el punto B (la articulación).
* @param {object} keypoints - Array de keypoints de la pose.
* @param {string} p1Name - Nombre del primer punto (ej. 'left_shoulder').
* @param {string} p2Name - Nombre del punto central (articulación) (ej. 'left_elbow').
* @param {string} p3Name - Nombre del tercer punto (ej. 'left_wrist').
* @returns {number | null} - El ángulo en grados (0-180) o null si algún punto no es válido.
*/
function getAngle(keypoints, p1Name, p2Name, p3Name) {
  const p1 = keypoints.find((k) => k.name === p1Name);
  const p2 = keypoints.find((k) => k.name === p2Name);
  const p3 = keypoints.find((k) => k.name === p3Name);


  if (!p1 || !p2 || !p3 || p1.score < 0.4 || p2.score < 0.4 || p3.score < 0.4) {
   return null; // Retorna null si alguno de los puntos no es fiable o no existe
  }


  const radianes =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) -
    Math.atan2(p1.y - p2.y, p1.x - p2.x);


 let angle = Math.abs(radianes * (180 / Math.PI));


 // Asegura que el ángulo esté entre 0 y 180 grados
  if (angle > 180.0) {
    angle = 360 - angle;
  }


  return angle;
}


// ===================================================================
// 6. LÓGICA DE MOVIMIENTO (Idéntica en ambos, mantenemos una versión)
// ===================================================================

function checkMoviment(pose) {
  if (exercici === 'abdominales') checkAbdominal(pose)
  if (exercici === 'flexiones') checkFlexiones(pose)
  if (exercici === 'sentadillas') checkSentadillas(pose)
  if (exercici === 'saltos') checkSaltos(pose)
  if (exercici === 'fons') checkFons(pose)
  if (exercici === 'pujades') checkPujades(pose)
}

function checkAbdominal(pose) {
  const nas = pose.keypoints.find((k) => k.name === 'nose')
  const maluc = pose.keypoints.find((k) => k.name === 'left_hip')
  if (!nas || !maluc || nas.score < 0.4 || maluc.score < 0.4) return; // Validación de score

  const distancia = Math.abs(nas.y - maluc.y)
  const UMBRAL_ARRIBA = 150; 
  const UMBRAL_ABAJO = 100;

  if (distancia < UMBRAL_ABAJO && !up) {
      up = true; 
  }

  if (distancia > UMBRAL_ARRIBA && up) {
    count.value++
    up = false
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'update', reps: count.value }))
    }
  }
}

function checkFlexiones(pose) {
 // Usaremos el lado izquierdo o derecho, el que tenga mejor visibilidad (score)
  const angleL = getAngle(pose.keypoints, 'left_shoulder', 'left_elbow', 'left_wrist');
  const angleR = getAngle(pose.keypoints, 'right_shoulder', 'right_elbow', 'right_wrist');


 // Elegir el ángulo más fiable. Si ambos son null, salir.
  const angle = angleL !== null && (angleR === null || angleL > angleR) ? angleL : angleR;


  if (angle === null) return;


 // UMBRALES DE ÁNGULO
 const UMBRAL_ABAJO = 90; // Codo flexionado (ángulo agudo o recto)
 const UMBRAL_ARRIBA = 160; // Codo extendido (casi recto)


 // Fase de "abajo" (el codo se dobla)
  if (angle < UMBRAL_ABAJO && !up) {
     // El codo ha pasado el punto de flexión (ha bajado)
      up = true;
  }


 // Fase de "arriba" (el codo se extiende y se completa la repetición)
  if (angle > UMBRAL_ARRIBA && up) {
    count.value++;
    up = false;
   // Notificación al WebSocket
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'update', reps: count.value }))
    }
  }
}


function checkSentadillas(pose) {
 // Usaremos el lado izquierdo o derecho, el que tenga mejor visibilidad (score)
  const angleL = getAngle(pose.keypoints, 'left_hip', 'left_knee', 'left_ankle');
  const angleR = getAngle(pose.keypoints, 'right_hip', 'right_knee', 'right_ankle');


 // Elegir el ángulo más fiable. Si ambos son null, salir.
  const angle = angleL !== null && (angleR === null || angleL > angleR) ? angleL : angleR;


  if (angle === null) return;


 // UMBRALES DE ÁNGULO
 const UMBRAL_ABAJO = 90; // Rodilla bien doblada (sentadilla profunda)
 const UMBRAL_ARRIBA = 165; // Rodilla casi recta (de pie)


 // Fase de "abajo" (el ángulo se reduce al doblar la rodilla)
  if (angle < UMBRAL_ABAJO && !up) {
     // Ha pasado el punto de máxima flexión (está abajo)
      up = true;
  }


 // Fase de "arriba" (el ángulo se extiende y se completa la repetición)
  if (angle > UMBRAL_ARRIBA && up) {
    count.value++;
    up = false;
   // Notificación al WebSocket
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'update', reps: count.value }))
    }
  }
}

function checkSaltos(pose) {
  const shoulderL = pose.keypoints.find((k) => k.name === 'left_shoulder');
  const shoulderR = pose.keypoints.find((k) => k.name === 'right_shoulder');
  const wristL = pose.keypoints.find((k) => k.name === 'left_wrist');
  const ankleL = pose.keypoints.find((k) => k.name === 'left_ankle');
  const ankleR = pose.keypoints.find((k) => k.name === 'right_ankle');

  // Validació de punts clau
  if (!shoulderL || !shoulderR || !wristL || !ankleL || !ankleR ||
      shoulderL.score < 0.4 || shoulderR.score < 0.4 || wristL.score < 0.4 || 
      ankleL.score < 0.4 || ankleR.score < 0.4) {
    return;
  }

  // --- LÒGICA MILLORADA ---

  // 1. Condició de Braços (Relativa - Es manté igual)
  // La nina (wrist) més amunt (menor 'y') que l'espatlla (shoulder)
  const brazosArriba = wristL.y < shoulderL.y;

  // 2. Condició de Peus (Relativa - Normalitzada)
  
  // A. Calcular la nostra "unitat de mesura": l'amplada de les espatlles
  const shoulderWidth = Math.abs(shoulderL.x - shoulderR.x);
  
  // B. Calcular la distància actual dels turmells
  const distanciaPies = Math.abs(ankleL.x - ankleR.x);

  // C. Definir llindars RELATIUS a l'amplada de les espatlles
  // Llindar Obert: Els peus estan més separats que 1.5 vegades l'amplada de les espatlles.
  const UMBRAL_PIES_ABIERTO_RATIO = 1.5; 
  // Llindar Tancat: Els peus estan més junts que 0.5 vegades l'amplada de les espatlles.
  const UMBRAL_PIES_CERRADO_RATIO = 0.5;

  // D. Comprovar les condicions relatives
  const piesAbiertos = distanciaPies > (shoulderWidth * UMBRAL_PIES_ABIERTO_RATIO);
  const piesCerrados = distanciaPies < (shoulderWidth * UMBRAL_PIES_CERRADO_RATIO);

  // --- LÒGICA DE COMPTADOR ---

  // Fase 1: Abierto (Preparació per tancar)
  // El cos està en posició "oberta" (braços amunt I peus oberts)
  if (brazosArriba && piesAbiertos && !up) {
      up = true;
  }

  // Fase 2: Cerrado (Repetició completada)
  // El cos torna a la posició "tancada" (braços avall I peus tancats)
  if (!brazosArriba && piesCerrados && up) {
    count.value++;
    up = false;
    // Notificació al WebSocket
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'update', reps: count.value }))
    }
  }
}

function checkFons(pose) {
  // Usaremos el lado izquierdo o derecho, el que tenga mejor visibilidad (score)
  const angleL = getAngle(pose.keypoints, 'left_shoulder', 'left_elbow', 'left_wrist');
  const angleR = getAngle(pose.keypoints, 'right_shoulder', 'right_elbow', 'right_wrist');

  // Elegir el ángulo más fiable.
  const angle = angleL !== null && (angleR === null || angleL > angleR) ? angleL : angleR;

  if (angle === null) return;

  // UMBRALES DE ÁNGULO para Dips (similares a Flexiones, ya que es el mismo movimiento articular)
  const UMBRAL_ABAJO = 90; // Codo flexionado (ángulo agudo/recto al bajar)
  const UMBRAL_ARRIBA = 160; // Codo extendido (casi recto al subir)

  // Fase de "abajo" (el codo se dobla para bajar el cuerpo)
  if (angle < UMBRAL_ABAJO && !up) {
      // El codo ha pasado el punto de flexión (ha bajado)
      up = true;
  }

  // Fase de "arriba" (el codo se extiende y se completa la repetición)
  if (angle > UMBRAL_ARRIBA && up) {
    count.value++;
    up = false;
    // Notificación al WebSocket
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'update', reps: count.value }))
    }
  }
}

function checkPujades(pose) {
  // Usaremos el lado izquierdo o derecho, el que tenga mejor visibilidad (score)
  const hipL = pose.keypoints.find((k) => k.name === 'left_hip');
  const kneeL = pose.keypoints.find((k) => k.name === 'left_knee');
  const ankleL = pose.keypoints.find((k) => k.name === 'left_ankle');

  const hipR = pose.keypoints.find((k) => k.name === 'right_hip');
  const kneeR = pose.keypoints.find((k) => k.name === 'right_knee');
  const ankleR = pose.keypoints.find((k) => k.name === 'right_ankle');

  // Función auxiliar para verificar una pierna
  const checkLeg = (hip, knee, ankle) => {
      if (!hip || !knee || !ankle || hip.score < 0.4 || knee.score < 0.4 || ankle.score < 0.4) return false;
      // 1. La rodilla está levantada por encima de la cadera (y más alta que la otra rodilla/cadera)
      // Nota: Recuerda que 'y' más pequeño = más arriba.
      const rodillaArriba = knee.y < hip.y; 
      
      // 2. La rodilla está mucho más alta que el tobillo (pierna doblada)
      const distanciaKneeAnkle = Math.abs(knee.y - ankle.y);
      const UMBRAL_PIERNA_DOBLADA = 100; // La rodilla debe estar separada del tobillo
      
      // 3. La rodilla debe estar cerca de la cadera horizontalmente (rodilla levantada hacia el cuerpo)
      const distanciaHorizontal = Math.abs(knee.x - hip.x);
      const UMBRAL_HORIZONTAL = 50; 

      return rodillaArriba && distanciaKneeAnkle > UMBRAL_PIERNA_DOBLADA && distanciaHorizontal < UMBRAL_HORIZONTAL;
  }
  
  // Condición de repetición: Al menos una rodilla debe estar arriba
  const piernaArriba = checkLeg(hipL, kneeL, ankleL) || checkLeg(hipR, kneeR, ankleR);

  // Fase 1: Rodilla arriba
  if (piernaArriba && !up) {
      up = true;
  }

  // Fase 2: Rodilla abajo (vuelta a la posición inicial)
  if (!piernaArriba && up) {
    count.value++;
    up = false;
    // Notificación al WebSocket
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'update', reps: count.value }))
    }
  }
}

// ===================================================================
// 7. WEBSOCKET (Idéntica, mantenemos la del segundo script)
// ===================================================================

function connectWebSocket() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.host;
  const wsUrl = `${wsProtocol}//${wsHost}/ws`;
  
  console.log(`Connectant a WebSocket a: ${wsUrl}`);

  ws.value = new WebSocket(wsUrl); 

  ws.value.onopen = () => {
    console.log('Connectat al servidor WebSocket');
    ws.value.send(JSON.stringify({ type: 'join', sessionId, userId: userId.value }));
  };
  ws.value.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'leaderboard') {
      leaderboard.value = message.leaderboard;
    }
  };
  ws.value.onclose = () => console.log('Desconnectat del servidor');
  ws.value.onerror = (err) => console.error('Error WebSocket:', err);
}

// ===================================================================
// 8. NAVEGACIÓN
// ===================================================================

function tornar() {
  stopCamera();
  router.back()
}

</script>

<style scoped>
/* ==================================== */
/* ======== FONDO Y LAYOUT ======== */
/* ==================================== */
.bg-fitai-deep-space {
  /* Fondo oscuro dinámico con brillo sutil */
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
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.position-relative {
    position: relative;
}

/* ==================================== */
/* ======== BOTÓN SUPERIOR IZQUIERDO (MÁS GRANDE Y NEÓN) ======== */
/* ==================================== */
.top-left-back-btn {
  position: absolute;
  top: 15px; 
  left: 15px; 
  z-index: 10;
  color: white !important; 
  background: #8b5cf6 !important; 
  border-radius: 8px !important; 
  font-weight: 700 !important;
  box-shadow: 0 0 15px rgba(139, 92, 246, 1); 
  transition: all 0.3s ease;
  min-width: 120px;

  /* Asegurar que no se solape con el título */
  margin-top: 10px;
}
.top-left-back-btn:hover {
    transform: scale(1.05); 
    box-shadow: 0 0 20px rgba(139, 92, 246, 1.2);
}

/* ==================================== */
/* ======== TÍTULO EXERCICI (ANIMADO) ======== */
/* ==================================== */
.exercise-title {
  /* Tamaño de fuente responsive */
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: linear-gradient(90deg, #8b5cf6, #3b82f6, #00ffaa); /* Mezcla de colores neón */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradientShift 6s ease infinite;
  position: relative;
  line-height: 1.1;
  text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}
@media (min-width: 600px) {
  .exercise-title {
    font-size: 3rem;
  }
}
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}


/* ==================================== */
/* ======== CÁMARA Y CONTADOR ======== */
/* ==================================== */
.shadow-card {
  box-shadow: 0 8px 35px rgba(0, 0, 0, 0.6);
  transition: transform 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05); /* Added subtle border */
}
.shadow-card:hover {
    transform: translateY(-2px);
}

/* CONTADOR (Deep Space Glass) */
.count-card {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
}
.counter-value {
    letter-spacing: 3px;
    /* Ajuste de color a azul neón para mejor armonía con el tema */
    text-shadow: 0px 0px 18px rgba(59, 130, 246, 0.9); 
    font-size: 4rem !important;
}
@media (min-width: 600px) {
  .counter-value {
    font-size: 5rem !important;
  }
}

/* ==================================== */
/* ======== BOTONES DE ACCIÓN (Grandes/Responsive) ======== */
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

/* Ajuste para móviles para evitar que los botones se salgan de la pantalla */
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


/* ==================================== */
/* ======== CLASIFICACIÓN (LEADERBOARD) ======== */
/* ==================================== */
.leaderboard-card {
  background: rgba(255, 255, 255, 0.05); 
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ranking-title {
    /* Sombra más definida para el título del ranking */
    text-shadow: 0 0 8px rgba(0, 255, 170, 0.7); 
}

.bg-top1 {
  background: rgba(255, 215, 0, 0.15) !important; 
  border-left: 5px solid #ffd700 !important;
}
.bg-top2 {
  background: rgba(192, 192, 192, 0.15) !important; 
  border-left: 5px solid #c0c0c0 !important;
}
.bg-top3 {
  background: rgba(176, 141, 87, 0.15) !important; 
  border-left: 5px solid #b08d57 !important;
}
.bg-standard {
     /* Fondo ligeramente más sutil para los no-ganadores */
     background: rgba(255, 255, 255, 0.03) !important;
}
.list-item-glow {
    transition: all 0.3s ease;
}
.list-item-glow:hover {
    transform: translateX(4px);
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
}

</style>