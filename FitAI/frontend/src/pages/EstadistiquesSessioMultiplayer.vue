<template>
  <v-app>
    <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
      <v-container class="text-center text-white pa-4" style="max-width: 500px;">

        <h1 class="results-title-neon text-h4 text-sm-h3 font-weight-bold mb-10 mt-6">
          SESSIÓ COMPLETADA
        </h1>

        <!-- CANVI 1: Afegeix 'd-flex flex-column' i un 'max-height' a la targeta -->
        <v-card 
          class="results-card rounded-xl pa-6 pa-sm-8 elevation-8 d-flex flex-column"
          style="max-height: 85vh;"
        >

          <h2 v-if="jugador" class="text-h6 font-weight-bold mb-4 text-white">
            Jugador: <span class="text-cyan-lighten-2">{{ jugador }}</span>
          </h2>
          <h2 class="text-h6 font-weight-bold mb-6 text-white ranking-title">RESUM D'ESTADÍSTIQUES</h2>

          <!-- CANVI 2: Embolcalla la secció de dades en un <v-card-text> per fer-la scrollable -->
          <v-card-text class="flex-grow-1 pa-0" style="overflow-y: auto;">
            <v-row class="justify-center">
              <v-col cols="12" sm="8" md="6" class="px-0">

                <v-row class="mb-4 ga-3">
                  <v-col cols="12" class="d-flex">
                    <v-card class="data-card pa-3 rounded-lg flex-grow-1 blue-glow-card" color="#0e111d">
                      <h3 class="text-caption font-weight-light text-blue-lighten-2">EXERCICI</h3>
                      <p class="text-subtitle-1 font-weight-bold text-uppercase">{{ exerciciLabel }}</p>
                    </v-card>
                  </v-col>
                </v-row>

                <v-row class="mb-4 ga-3">
                  <v-col cols="12" class="d-flex">
                    <v-card class="data-card reps-card pa-3 rounded-lg flex-grow-1 purple-glow-card" color="#0e111d">
                      <h3 class="text-caption font-weight-light text-purple-lighten-2">LES TEVES REPETICIONS</h3>
                      <p class="text-h6 font-weight-black reps-number">{{ reps }}</p>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- SECCIÓ ALTRES JUGADORS -->
                <v-divider v-if="altresJugadors.length > 0" class="divider-subtle mx-auto my-4"></v-divider>
                <h3 v-if="altresJugadors.length > 0" class="text-subtitle-2 text-grey-lighten-1 mb-3">RIVALS</h3>

                <v-row v-if="altresJugadors.length > 0" class="mb-4 ga-3">
                  <v-col cols="12" v-for="jug in altresJugadors" :key="jug.userId" class="d-flex">
                    <v-card class="data-card pa-3 rounded-lg flex-grow-1 cyan-glow-card" color="#0e111d">
                      <div class="d-flex justify-space-between align-center">
                          <h3 class="text-body-1 font-weight-bold text-cyan-lighten-2 mb-0">{{ jug.userName }}</h3>
                          <p class="text-h6 font-weight-black reps-number mb-0">{{ jug.reps }}</p>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>

              </v-col>
            </v-row>
          </v-card-text>
          <!-- FI DE LA SECCIÓ SCROLLABLE -->

          <v-divider class="divider-subtle mx-auto my-6"></v-divider>

          <!-- CANVI 3: Embolcalla el botó en <v-card-actions> per a una millor estructura -->
          <v-card-actions class="pa-0 justify-center">
            <v-btn color="#8b5cf6" class="mt-4 clean-button" height="48" @click="$router.push('/')">
              TORNAR A LA PANTALLA PRINCIPAL
              <v-icon end class="ml-2">mdi-home-outline</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
const props = defineProps({
  exercici: { type: String, required: true },
  totalReps: { type: Number, default: 0 },
  jugador: { type: String, default: '' },
  altresJugadors: { type: Array, default: () => [] }
})

const noms = { Flexions: 'FLEXIONS', Squats: 'SQUATS', Salts: 'SALTS', Abdominals: 'ABDOMINALS', Fons: 'FONS', Pujades: 'PUJADES', flexiones: 'FLEXIONS', sentadillas: 'ESQUATS', saltos: 'SALTS', abdominales: 'ABDOMINALS', fons: 'FONS', pujades: 'PUJADES' }

const exerciciLabel = noms[props.exercici] || props.exercici
const reps = props.totalReps
const jugador = props.jugador
const altresJugadors = props.altresJugadors
</script>

<style scoped>
/* ELS ESTILS NO HAN CANVIAT, SÓN ELS MATEIXOS */
.bg-fitai-deep-space {
  background: radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 40%),
    linear-gradient(135deg, #0e111d, #141829 50%, #0e111d 100%);
  background-attachment: fixed;
  background-size: cover;
  min-height: 100vh;
  animation: backgroundPulse 12s ease infinite alternate;
}
@keyframes backgroundPulse { 0% { filter: brightness(1); } 100% { filter: brightness(1.03); } }

.results-title-neon {
  font-size: 2.5rem; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;
  background: linear-gradient(90deg, #9b6bff, #3b4ef6, #8851ff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-size: 200% 200%; animation: gradientShift 6s ease infinite;
  position: relative; line-height: 1.1; text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}
.results-title-neon::after {
  content: ''; position: absolute; bottom: -10px; left: 50%; width: 160px; height: 3px;
  transform: translateX(-50%); background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px; box-shadow: 0 0 10px rgba(139, 92, 246, 0.9);
  animation: pulseGlow 2.5s infinite ease-in-out;
}
@keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes pulseGlow { 0%, 100% { opacity: 0.7; box-shadow: 0 0 12px rgba(139, 92, 246, 0.4); } 50% { opacity: 1; box-shadow: 0 0 25px rgba(139, 92, 246, 0.9); } }

.ranking-title { color: #ffffff; text-shadow: 0 0 8px rgba(139, 92, 246, 0.5); letter-spacing: 1.5px; text-transform: uppercase; }
.results-card { background: rgba(30, 30, 47, 0.95) !important; backdrop-filter: blur(12px); border: 1px solid rgba(139, 92, 246, 0.3); box-shadow: 0 0 8px rgba(139, 92, 246, 0.2), 0 8px 25px rgba(0, 0, 0, 0.7); }
.data-card { background-color: #0e111d !important; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 0 5px rgba(0, 0, 0, 0.2); transition: transform 0.3s ease; }
.data-card:hover { transform: translateY(-2px); }
.blue-glow-card { border: 1px solid #81d4fa; box-shadow: 0 0 8px rgba(59, 130, 246, 0.5); }
.purple-glow-card { border: 1px solid #ce93d8; box-shadow: 0 0 8px rgba(139, 92, 246, 0.5); }
.cyan-glow-card { border: 1px solid #00ffaa; box-shadow: 0 0 8px rgba(0, 255, 170, 0.5); }
.reps-number { color: #81d4fa !important; text-shadow: 0 0 5px rgba(129, 212, 250, 0.6); }
.text-blue-lighten-2 { color: #81d4fa !important; opacity: 0.9; }
.text-purple-lighten-2 { color: #ce93d8 !important; opacity: 0.9; }
.text-cyan-lighten-2 { color: #00ffaa !important; opacity: 0.9; }
.divider-subtle { max-width: 90%; height: 1px; background: linear-gradient(90deg, transparent 0%, #3b82f6, #8b5cf6, transparent 100%); opacity: 0.5; }
.clean-button { text-transform: uppercase; font-weight: 600; letter-spacing: 1px; border-radius: 8px; color: white !important; box-shadow: 0 0 8px rgba(139, 92, 246, 0.3); }
</style>