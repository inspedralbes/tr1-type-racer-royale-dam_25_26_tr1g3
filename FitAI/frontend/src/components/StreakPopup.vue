<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="400"
    persistent
  >
    <v-card class="pa-4 rounded-xl glass-card-futuristic text-center">
      <v-card-title class="text-h5 font-weight-bold text-white">
        ¡Bienvenido de nuevo!
      </v-card-title>
      <v-card-text class="text-white">
        <p class="text-h6 mb-4">Tu racha actual es de:</p>
        <div class="d-flex justify-center align-center mb-4">
          <div class="streak-container-dialog">
            <v-img
              :src="rachaActual.imagen"
              :alt="`Racha día ${rachaActual.dias}`"
              class="streak-image"
              :width="rachaActual.size"
              :height="rachaActual.size"
            />
          </div>
        </div>
        <p class="text-h4 font-weight-bold text-amber-lighten-2">
          {{ rachaActual.dias }} {{ rachaActual.dias === 1 ? 'Día' : 'Días' }}
        </p>
        <p class="text-caption text-white text-opacity-75 mt-1">
          ¡Sigue así para mantener el fuego!
        </p>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn
          color="green-lighten-1"
          variant="flat"
          @click="$emit('update:modelValue', false)"
        >
          ¡Entendido!
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  // Controla si se ve o no (v-model)
  modelValue: {
    type: Boolean,
    default: false
  },
  // Recibe el objeto racha ya calculado del padre
  rachaActual: {
    type: Object,
    required: true,
    default: () => ({ dias: 1, imagen: '', size: 120 })
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.glass-card-futuristic {
  background: rgba(30, 30, 47, 0.9) !important;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.streak-container-dialog {
  padding: 10px;
  border-radius: 50%;
  background: rgba(255, 165, 0, 0.1);
  border: 2px solid rgba(255, 165, 0, 0.6);
  box-shadow: 0 0 20px rgba(255, 165, 0, 0.5);
}

.text-amber-lighten-2 {
  color: #ffd54f !important;
  text-shadow: 0 0 8px rgba(255, 213, 79, 0.8);
}
</style>