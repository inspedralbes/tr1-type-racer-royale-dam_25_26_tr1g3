<template>
    <v-dialog :model-value="modelValue" max-width="600px" persistent>
        <v-card class="rounded-xl pa-6" elevation="10" style="backdrop-filter: blur(10px); background: rgba(0, 0, 0, 0.8);">
            <h2 class="text-h5 font-weight-bold mb-4 text-teal-accent-3 text-center">📊 Estadístiques de la sessió</h2>

            <v-row class="mb-4">
                <v-col cols="12" md="6">
                    <v-card class="pa-4 rounded-xl" color="rgba(139,92,246,0.1)">
                        <h3 class="text-h6 font-weight-bold mb-2 text-white">Exercici</h3>
                        <p class="text-h6 text-white">{{ exerciciLabel }}</p>
                    </v-card>
                </v-col>
                <v-col cols="12" md="6">
                    <v-card class="pa-4 rounded-xl" color="rgba(59,130,246,0.1)">
                        <h3 class="text-h6 font-weight-bold mb-2 text-white">Repeticions totals</h3>
                        <p class="text-h6 text-white">{{ totalReps }}</p>
                    </v-card>
                </v-col>
            </v-row>

            <v-btn
                color="#8b5cf6"
                class="mt-6"
                large
                rounded
                @click="$emit('close')" 
            >
                Tornar
            </v-btn>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true,
    },
    exercici: {
        type: String,
        required: true,
    },
    totalReps: {
        type: Number,
        required: true,
    },
})

const emit = defineEmits(['close'])

const noms = {
    Flexions: 'FLEXIONS',
    Squats: 'SQUATS',
    Salts: 'SALTS',
    Abdominals: 'ABDOMINALS',
    Fons: 'FONS',
    Pujades: 'PUJADES',
    flexiones: 'FLEXIONS',
    sentadillas: 'ESQUATS',
    saltos: 'SALTS',
    abdominales: 'ABDOMINALS',
    fons: 'FONS',
    pujades: 'PUJADES',
}

// Obtenir l'etiqueta correcta o utilitzar el valor per defecte
const exerciciLabel = computed(() => noms[props.exercici] || props.exercici.toUpperCase())
</script>

<style scoped>
/* No hi ha estils específics aquí, ja que els estils de fons i targetes ja estan definits a Vuetify o al component pare */
</style>
