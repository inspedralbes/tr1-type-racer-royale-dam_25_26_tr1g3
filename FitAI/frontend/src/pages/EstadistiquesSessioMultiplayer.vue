<template>
    <v-dialog :model-value="modelValue" max-width="600px" persistent>
        
        <v-card 
            class="results-card rounded-xl pa-6 pa-sm-8 elevation-8"
            color="transparent"
        >
            
            <h2 class="text-h6 font-weight-bold mb-6 text-white ranking-title text-center">
                RESUM D'ESTADÍSTIQUES
            </h2>

            <v-row class="mb-4 ga-3 justify-center">
                <v-col cols="12" sm="8" md="6" class="px-0"> 
                    
                    <v-row class="mb-4 ga-3">
                        <v-col cols="12" class="d-flex">
                            <v-card 
                                class="data-card pa-3 rounded-lg flex-grow-1 blue-glow-card" 
                                color="#0e111d"
                            >
                                <h3 class="text-caption font-weight-light text-blue-lighten-2">EXERCICI</h3>
                                <p class="text-subtitle-1 font-weight-bold text-uppercase">{{ exerciciLabel }}</p>
                            </v-card>
                        </v-col>
                    </v-row>
                    
                    <v-row class="mb-8 ga-3">
                        <v-col cols="12" class="d-flex">
                            <v-card 
                                class="data-card reps-card pa-3 rounded-lg flex-grow-1 purple-glow-card" 
                                color="#0e111d"
                            >
                                <h3 class="text-caption font-weight-light text-purple-lighten-2">REPETICIONS TOTALS</h3>
                                <p class="text-h6 font-weight-black reps-number">{{ totalReps }}</p>
                            </v-card>
                        </v-col>
                    </v-row>

                </v-col>
            </v-row>
            
            <v-divider class="divider-subtle mx-auto my-6"></v-divider>

            <v-btn
                color="#8b5cf6"
                class="mt-4 clean-button"
                height="48"
                @click="$emit('close')" 
            >
                TORNAR A LA PANTALLA PRINCIPAL
                <v-icon end class="ml-2">mdi-home-outline</v-icon>
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
/* ==================================== */
/* ======== TARGETES DE DADES (COPIADO DE JUEGOSOLO) ======== */
/* ==================================== */

/* Títol de les estadístiques - mantenim l'estil anterior */
.ranking-title {
    color: #ffffff; 
    text-shadow: 0 0 8px rgba(139, 92, 246, 0.5); 
    letter-spacing: 1.5px;
    text-transform: uppercase;
}

.results-card {
    /* Fondo oscuro con blur para el diálogo */
    background: rgba(30, 30, 47, 0.9) !important; 
    backdrop-filter: blur(12px);
    border: 1px solid rgba(139, 92, 246, 0.3); 
    box-shadow: 
        0 0 8px rgba(139, 92, 246, 0.2), 
        0 8px 25px rgba(0, 0, 0, 0.7); 
    transition: all 0.4s ease;
}

/* Fons de les targetes de dades canviat a un fons més fosc #0e111d per contrast */
.data-card {
    background-color: #0e111d !important; 
    border: 1px solid rgba(255, 255, 255, 0.1); 
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.data-card:hover {
    transform: translateY(-2px);
}

/* Estils de color neó millorats per cada quadre */

.blue-glow-card { /* EXERCICI */
    border: 1px solid #81d4fa;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}
.blue-glow-card:hover {
    box-shadow: 0 0 15px rgba(59, 130, 246, 1);
}

.purple-glow-card { /* REPETICIONS */
    border: 1px solid #ce93d8;
    box-shadow: 0 0 8px rgba(139, 92, 246, 0.5); 
}
.purple-glow-card:hover {
    box-shadow: 0 0 15px rgba(139, 92, 246, 1);
}

/* Estilo para los números grandes (Colores mantenidos) */
.reps-number {
    color: #81d4fa !important; /* En Multiplayer solo necesitamos el azul/morado */
    text-shadow: 0 0 5px rgba(129, 212, 250, 0.6);
}


/* Estilo para los títulos de las tarjetas (Mantenidos) */
.text-blue-lighten-2 {
    color: #81d4fa !important;
    opacity: 0.9;
}
.text-purple-lighten-2 {
    color: #ce93d8 !important;
    opacity: 0.9;
}

/* ==================================== */
/* ======== DIVIDER Y BOTÓN LIMPIO ======== */
/* ==================================== */
.divider-subtle {
    max-width: 90%;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, #3b82f6, #8b5cf6, transparent 100%);
    box-shadow: 0 0 5px rgba(139, 92, 246, 0.4);
    opacity: 0.5;
}

.clean-button {
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 1px;
    border-radius: 8px;
    box-shadow: 
        0 0 8px rgba(139, 92, 246, 0.3),
        0 4px 10px rgba(0, 0, 0, 0.5) !important;
    transition: all 0.2s ease;
}

.clean-button:hover {
    transform: translateY(-1px);
    box-shadow: 
        0 0 12px rgba(139, 92, 246, 0.6), 
        0 6px 15px rgba(0, 0, 0, 0.7) !important;
}
</style>
