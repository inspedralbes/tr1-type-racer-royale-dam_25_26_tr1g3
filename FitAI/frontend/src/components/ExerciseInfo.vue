<template>
  <h2 class="exercise-title mb-8">
    {{ label }}
  </h2>

  <v-card class="rounded-xl overflow-hidden shadow-card" elevation="8" width="100%" max-width="450">
    <img
      :src="gif"
      :alt="label"
      class="rounded-lg"
      width="100%"
      style="object-fit: cover; max-height: 400px;"
    />
  </v-card>

  <p class="text-body-1 text-grey-lighten-3 mt-6 mb-6 font-italic info-text">
    Segueix l’exemple o utilitza la teva pròpia càmera.
  </p>
</template>

<script setup>
defineProps({
  label: String,
  gif: String
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

.exercise-title {
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: linear-gradient(90deg, #8b5cf6, #3b82f6, #00ffaa);
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
</style>