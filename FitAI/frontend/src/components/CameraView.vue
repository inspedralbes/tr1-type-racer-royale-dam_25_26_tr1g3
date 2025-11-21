<template>
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
      loop
      width="100%"
      class="rounded-xl"
      style="object-fit: cover;"
      @ended="$emit('videoEnded')"
    ></video>
    <canvas
      ref="canvas"
      width="640"
      height="480"
      style="position:absolute; top:0; left:0; width: 100%; height: 100%;" 
    ></canvas>
  </v-card>

  <input
    ref="fileInput"
    type="file"
    accept="video/*"
    @change="loadVideoFromFile"
    style="display: none"
  />
</template>

<script setup>
import { ref } from 'vue'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'

const props = defineProps({
  timerActive: Boolean,
  onCheckMoviment: Function
})

const emit = defineEmits(['videoEnded'])

const video = ref(null)
const canvas = ref(null)
const fileInput = ref(null)

let detector = null
let streamRef = null
let detecting = false

async function start() {
  try {
    streamRef = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    video.value.srcObject = streamRef
    video.value.src = null
    await video.value.play()

    video.value.onloadedmetadata = () => {
      if (video.value && canvas.value) {
        canvas.value.width = video.value.offsetWidth;
        canvas.value.height = video.value.offsetHeight;
      }
    };

    if (!detector) await initMoveNet()
    if (!detecting) {
      detecting = true
      detectPose()
    }
  } catch (e) {
    console.error('Error a CameraView.start():', e.message)
    throw e
  }
}

function stop() {
  if (streamRef) {
    streamRef.getTracks().forEach((t) => t.stop())
    if (video.value) video.value.srcObject = null;
    streamRef = null
  }
  if (video.value && video.value.src) {
      video.value.pause();
      video.value.src = "";
  }
  detecting = false
  const ctx = canvas.value?.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
}

function select() {
  stop()
  fileInput.value?.click()
}

async function loadVideoFromFile(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const ctx = canvas.value?.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  const url = URL.createObjectURL(file)
  video.value.srcObject = null
  video.value.src = url
  
  video.value.onloadedmetadata = () => {
    if (video.value && canvas.value) {
      canvas.value.width = video.value.offsetWidth;
      canvas.value.height = video.value.offsetHeight;
    }
  };
  
  await video.value.play()
  if (!detector) await initMoveNet()
  detecting = true
  detectVideoFrame()
}

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
    
    if (ctx) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    const poses = await detector.estimatePoses(video.value, { flipHorizontal: false })

    if (poses.length > 0) {
      drawPose(ctx, poses[0], video.value.videoWidth, video.value.videoHeight, video.value.offsetWidth, video.value.offsetHeight)
      if (props.timerActive) {
        props.onCheckMoviment(poses[0])
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
            emit('videoEnded');
        }
        return
    }

    if (ctx) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    
    const poses = await detector.estimatePoses(video.value)
    if (poses.length > 0) {
      drawPose(ctx, poses[0], video.value.videoWidth, video.value.videoHeight, video.value.offsetWidth, video.value.offsetHeight)
      if (props.timerActive) {
        props.onCheckMoviment(poses[0])
      }
    }
    requestAnimationFrame(frameLoop)
  }
  requestAnimationFrame(frameLoop)
}

function drawPose(ctx, pose, videoNaturalWidth, videoNaturalHeight, videoDisplayedWidth, videoDisplayedHeight) {
  const canvasElement = canvas.value;

  if (!ctx || !canvasElement || !pose || !pose.keypoints) return;
  
  if (canvasElement.width !== videoDisplayedWidth || canvasElement.height !== videoDisplayedHeight) {
      canvasElement.width = videoDisplayedWidth;
      canvasElement.height = videoDisplayedHeight;
  }

  const aspectRatioVideo = videoNaturalWidth / videoNaturalHeight;
  const aspectRatioDisplayed = videoDisplayedWidth / videoDisplayedHeight;

  let scaleX, scaleY, offsetX, offsetY;

  if (aspectRatioVideo > aspectRatioDisplayed) {
      scaleX = videoDisplayedWidth / videoNaturalWidth;
      scaleY = scaleX;
      offsetY = (videoDisplayedHeight - videoNaturalHeight * scaleY) / 2;
      offsetX = 0;
  } else {
      scaleY = videoDisplayedHeight / videoNaturalHeight;
      scaleX = scaleY;
      offsetX = (videoDisplayedWidth - videoNaturalWidth * scaleX) / 2;
      offsetY = 0;
  }

  const transformPoint = (kp) => {
    if (!kp || kp.score < 0.4) return null;
    return {
      x: kp.x * scaleX + offsetX,
      y: kp.y * scaleY + offsetY
    };
  };
  
  ctx.fillStyle = '#00ffaa'; 
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#00ffaa';
  
  for (const kp of pose.keypoints) {
    const transformed = transformPoint(kp);
    if (transformed) {
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

    const p1 = transformPoint(kp1);
    const p2 = transformPoint(kp2);
    
    if (p1 && p2) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 0; 
}

defineExpose({
  start,
  stop,
  select
})
</script>

<style scoped>
.shadow-card {
  box-shadow: 0 8px 35px rgba(0, 0, 0, 0.6);
  transition: transform 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.shadow-card:hover {
    transform: translateY(-2px);
}
</style>