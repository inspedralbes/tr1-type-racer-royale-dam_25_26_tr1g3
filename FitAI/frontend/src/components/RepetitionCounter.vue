<template>
  <v-card
    class="py-5 px-6 text-center rounded-xl count-card"
    color="transparent"
    elevation="10"
    style="border: 2px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); background: rgba(0, 0, 0, 0.3);"
  >
    <h3 class="text-h6 font-weight-regular mb-2 text-grey-lighten-2">REPETICIONS</h3>
    <h1 class="text-h1 font-weight-black text-cyan-lighten-2 counter-value">{{ count }}</h1>
  </v-card>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.count-card {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
}
.counter-value {
  letter-spacing: 3px;
  text-shadow: 0px 0px 18px rgba(59, 130, 246, 0.9); 
  font-size: 4rem !important;
}
@media (min-width: 600px) {
  .counter-value {
    font-size: 5rem !important;
  }
}
</style>