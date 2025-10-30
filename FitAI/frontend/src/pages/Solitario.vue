<template>
 <v-app>
   <v-main class="d-flex align-center justify-center pa-8" style="background: linear-gradient(135deg, #141e30, #243b55); min-height: 100vh;">
     <v-container class="elevation-8 rounded-xl pa-6 bg-white" style="max-width: 1200px;">
       <v-row>
         <!-- Columna izquierda: cámara -->
         <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center">
           <h2 class="mb-4 text-primary font-weight-bold">Tu cámara</h2>


           <v-card class="overflow-hidden rounded-xl" elevation="6" width="100%" style="position: relative;">
             <video ref="video" autoplay playsinline muted width="100%" style="border-radius: 12px;"></video>
             <canvas ref="canvas" width="640" height="480" style="position:absolute; top:0; left:0;"></canvas>
           </v-card>


           <div class="mt-4 d-flex gap-2">
             <v-btn color="deep-purple-accent-4" @click="startCamera">Abrir cámara</v-btn>
             <v-btn variant="outlined" color="deep-purple-accent-4" @click="stopCamera">Parar</v-btn>
           </div>


           <v-card class="mt-4 pa-3 text-center rounded-xl" color="deep-purple-darken-1" dark>
             <h3 class="mb-0">Repeticiones</h3>
             <h1 class="display-1 font-weight-bold">{{ count }}</h1>
           </v-card>
         </v-col>


         <!-- Columna derecha: ejercicio -->
         <v-col cols="12" md="6" class="d-flex flex-column align-center justify-center text-center">
           <h2 class="mb-4 text-primary font-weight-bold">Ejercicio: Abdominales</h2>


           <v-card class="overflow-hidden rounded-xl pa-2" elevation="6" width="100%">
             <img src="/src/videos/abdominales.gif" alt="Abdominales" class="rounded-lg" width="100%" />
           </v-card>


           <p class="mt-4 text-grey-darken-1">
             Realiza abdominales siguiendo el movimiento del ejemplo.<br />
             El sistema detectará tus repeticiones automáticamente.
           </p>
         </v-col>
       </v-row>
     </v-container>
   </v-main>
 </v-app>
</template>


<script setup>
import { ref } from 'vue'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'


const video = ref(null)
const canvas = ref(null)
const count = ref(0)
let detector = null
let up = false
let streamRef = null
let detecting = false


// Abrir cámara
async function startCamera() {
 try {
   streamRef = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
   video.value.srcObject = streamRef
   await video.value.play()


   if (!detector) {
     await initMoveNet()
   }


   if (!detecting) {
     detecting = true
     detectPose()
   }
 } catch (e) {
   alert('No se pudo abrir la cámara: ' + e.message)
 }
}


// Parar cámara
function stopCamera() {
 if (streamRef) {
   streamRef.getTracks().forEach(t => t.stop())
   video.value.srcObject = null
   streamRef = null
   detecting = false
 }
}


// Inicializar MoveNet
async function initMoveNet() {
 detector = await poseDetection.createDetector(
   poseDetection.SupportedModels.MoveNet,
   { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
 )
}


// Detección de poses
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




// Dibuja puntos de referencia
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




// Lógica para contar abdominales
function checkAbdominal(pose) {
 const nose = pose.keypoints.find(k => k.name === 'nose')
 const hip = pose.keypoints.find(k => k.name === 'left_hip')


 if (!nose || !hip) return


 const distance = nose.y - hip.y


 // Bajando
 if (distance < 100 && !up) {
   up = true
 }


 // Subiendo
 if (distance > 150 && up) {
   count.value++
   up = false
 }
}
</script>


<style scoped>
h2, h3, h1 {
 font-family: 'Poppins', sans-serif;
}
</style>
