<template>
    <v-dialog :model-value="modelValue" max-width="600px" persistent>
        <v-card class="rounded-xl pa-6" elevation="10"
            style="backdrop-filter: blur(10px); background: rgba(0, 0, 0, 0.8);">

            <!-- Títol centrat -->
            <h2 class="text-h5 font-weight-bold mb-6 text-teal-accent-3 text-center">
                Estadístiques de la sessió
            </h2>
            <v-row class="mb-4 text-center">

                <!-- Exercici -->
                <v-col cols="12" md="6">
                    <v-card class="pa-4 rounded-xl" color="rgba(139,92,246,0.1)">
                        <h3 class="text-h6 font-weight-bold mb-2 text-white">Exercici</h3>
                        <p class="text-h6 text-white">{{ exerciciLabel }}</p>
                    </v-card>
                </v-col>

                <!-- Repeticions totals -->
                <v-col cols="12" md="6">
                    <v-card class="pa-4 rounded-xl" color="rgba(59,130,246,0.1)">
                        <h3 class="text-h6 font-weight-bold mb-2 text-white">Repeticions totals</h3>
                        <p class="text-h6 text-white">{{ totalReps }}</p>
                    </v-card>
                </v-col>
            </v-row>

            <v-row class="mb-4 text-center">

                <!-- Temps total -->
                <v-col cols="12" md="6">
                    <v-card class="pa-4 rounded-xl" color="rgba(0,255,170,0.1)">
                        <h3 class="text-h6 font-weight-bold mb-2 text-white">Temps total</h3>
                        <p class="text-h6 text-white">{{ formattedTime }}</p>
                    </v-card>
                </v-col>

                <!-- Calories cremades -->
                <v-col cols="12" md="6">
                    <v-card class="pa-4 rounded-xl" color="rgba(255,138,128,0.1)">
                        <h3 class="text-h6 font-weight-bold mb-2 text-white">Calories cremades</h3>
                        <p class="text-h6 text-white">{{ calories }} Kcal</p>
                    </v-card>
                </v-col>
            </v-row>

            <v-btn color="#8b5cf6" class="mt-6 mx-auto d-block" large rounded @click="handleBack">
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
    // NOVES PROPIETATS
    tempsTotal: {
        type: Number,
        default: 0,
    },
    calories: {
        type: Number,
        default: 0,
    },
})

const emit = defineEmits(['close', 'navigate'])

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

// NOU: Funció per formatar el temps de segons a MM:SS
const handleBack = () => {
    emit('navigate', '/')
}
const formattedTime = computed(() => {
    const minuts = Math.floor(props.tempsTotal / 60)
    const segons = props.tempsTotal % 60
    return `${minuts.toString().padStart(2, '0')}:${segons.toString().padStart(2, '0')}`
})
</script>

<style scoped></style>
