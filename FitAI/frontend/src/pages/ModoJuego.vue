<template>
  <v-app>
    <v-main class="d-flex flex-column align-center pa-4 bg-fitai-deep-space">
      <v-container
        class="text-center text-white pt-10 pb-16 px-4 fade-in-container position-relative"
      >
        <!-- ======== 1. BOTÓN DE NAVEGACIÓN (VOLVER) - AHORA RECTANGULAR ======== -->
        <v-btn
            class="top-left-back-btn rectangular-btn"
            variant="flat"
            size="large"
            prepend-icon="mdi-arrow-left"
            @click="$router.push('/')"
        >
          Tornar
        </v-btn>

        <!-- Título del ejercicio (Animado) -->
        <h2 class="exercise-title mb-4 pt-4">
          {{ exerciciLabel }}
        </h2>

        <!-- Subtítulo -->
        <p class="subtitle mb-12">
          Vols jugar sol o multijugador?
        </p>

        <!-- Opciones de Juego (Apiladas y Grandes) -->
        <v-row justify="center" align="center" class="ga-6">
          <!-- Tarjeta Modo Sol -->
          <v-col cols="12" class="d-flex justify-center pa-2">
            <v-card
              class="option-card solo-card"
              elevation="14"
              @click="jugarSol"
            >

              <v-icon size="48" class="mb-3 text-blue-300 glow-icon"
                >mdi-account-circle-outline</v-icon
              >
              <div class="option-title">Mode Individual</div>
              <p class="option-desc">
                Entrena al teu ritme i millora les teves marques.
              </p>
            </v-card>
          </v-col>

          <!-- Tarjeta Multijugador -->
          <v-col cols="12" class="d-flex justify-center pa-2">
            <v-card
              class="option-card multi-card"
              elevation="14"
              @click="jugarMultijugador"
            >
              <v-icon size="48" class="mb-3 text-purple-300 glow-icon"
                >mdi-account-group-outline</v-icon
              >
              <div class="option-title">Multijugador</div>
              <p class="option-desc">
                Reta els teus amics i competeix en temps real.
              </p>
            </v-card>
          </v-col>
        </v-row>

        <!-- Mensaje de Error (si ocurre en la conexión) -->
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mt-10 mx-auto"
          max-width="400"
          closable
        >
          {{ errorMessage }}
        </v-alert>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const errorMessage = ref(null)

const exercici = route.params.ejercicio

const nombres = {
  Flexions: 'Flexions',
  Squats: 'Squats',
  Salts: 'Salts',
  Abdominals: 'Abdominals',
  // Se asume que si hay más ejercicios en el listado de 'Kim', deberían ir aquí:
  // Fons: 'Fons', 
  // Pujades: 'Pujades', 
}

const exerciciLabel = computed(() => nombres[exercici] || 'Exercici')

// 🟢 FUNCIÓN ACTUALIZADA (TOMADA DE 'prueva') para usar la API de la BBDD
const jugarSol = async () => {
  errorMessage.value = null
  try {
    // ➡️ Llama a la nueva API para crear una sala/sesión en la BBDD
    const res = await fetch('/api/sala/crear', { method: 'POST', credentials: 'include' })

    if (!res.ok) {
      // Intenta obtener el mensaje de error del cuerpo de la respuesta
      const errorData = await res.json();
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json()
    
    // ➡️ Navega usando 'codi_acces' (lo que devuelve la nueva API de BBDD)
    router.push({
      name: 'JuegoSolo',
      params: { ejercicio: exercici, codi_acces: data.codi_acces },
    })
  } catch (err) {
    console.error('Error al intentar crear la sessió:', err.message)
    errorMessage.value = `No s'ha pogut crear la sessió (Error de connexió). ${err.message}`
  }
}

const jugarMultijugador = () => {
  router.push({ name: 'Multiplayer', params: { ejercicio: exercici } })
}
</script>

<style scoped>
/* ==================================== */
/* ======== FONDO Y LAYOUT ======== */
/* ==================================== */
.bg-fitai-deep-space {

  background:
    radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
    radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 40%),
    linear-gradient(135deg, #0e111d, #141829 50%, #0e111d 100%);
  background-attachment: fixed;
  background-size: cover;
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
/* ======== TÍTULO Y TEXTOS ======== */
/* ==================================== */
.exercise-title {

  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: linear-gradient(90deg, #9b6bff, #3b4ef6, #8851ff);
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
    font-size: 3.5rem;
  }
}


.exercise-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  width: 150px;
  height: 3px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.9);
  animation: pulseGlow 2.5s infinite ease-in-out;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.7; box-shadow: 0 0 12px rgba(139, 92, 246, 0.4); }
  50% { opacity: 1; box-shadow: 0 0 25px rgba(139, 92, 246, 0.9); }
}

.subtitle {
  font-size: 1rem;
  color: #a0a0b9;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}
@media (min-width: 600px) {
  .subtitle {
    font-size: 1.35rem;
  }
}

/* ==================================== */
/* ======== CARTAS DE OPCIÓN (GRANDES Y APILADAS) ======== */
/* ==================================== */
.option-card {
  width: 100%;

  max-width: 500px; 

  height: 250px; 
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  color: white;
  backdrop-filter: blur(15px);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px; /* Aumentamos el padding para más espacio */
}

.option-title {
  /* Mantenemos tamaño grande en móvil y escritorio */
  font-size: 1.75rem; 
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.option-desc {
  /* Aumentamos el tamaño de la fuente para mejor legibilidad */
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.75);
}

.glow-icon {
  text-shadow: 0 0 10px currentColor; 
}

/* --- MODO SOLO (AZUL) --- */
.solo-card {
  background: rgba(59, 130, 246, 0.1); 
  border: 3px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}
.solo-card:hover {
  transform: scale(1.05);
  background: rgba(59, 130, 246, 0.2);
  box-shadow:
    0 0 25px rgba(59, 130, 246, 0.8),
    0 10px 40px rgba(0, 0, 0, 0.7);
}

/* --- MULTIJUGADOR (MORADO) --- */
.multi-card {
  background: rgba(139, 92, 246, 0.1); 
  border: 3px solid rgba(139, 92, 246, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}
.multi-card:hover {
  transform: scale(1.05);
  background: rgba(139, 92, 246, 0.2);
  box-shadow:
    0 0 25px rgba(139, 92, 246, 0.8),
    0 10px 40px rgba(0, 0, 0, 0.7);
}

/* ==================================== */
/* ======== BOTÓN SUPERIOR IZQUIERDO (MÁS GRANDE) ======== */
/* ==================================== */
.top-left-back-btn {
  /* [MODIFICAR COLOR Y TAMAÑO DEL BOTÓN DE VOLVER] */
  position: absolute;
  top: 15px; /* Ajuste la posición vertical */
  left: 15px; /* Ajuste la posición horizontal */
  z-index: 10;
  color: white !important; /* Texto blanco para mejor contraste */
  background: #8b5cf6 !important; /* Fondo morado neón para el botón rectangular */
  border-radius: 8px; /* Bordes redondeados */
  box-shadow: 0 0 15px rgba(139, 92, 246, 1); /* Brillo neón */
  transition: all 0.3s ease;
}
.top-left-back-btn:hover {
    transform: scale(1.05); /* Ligeramente más grande en hover */
    box-shadow: 0 0 20px rgba(139, 92, 246, 1.2);
}

/* Eliminamos los estilos del botón de abajo */
.fixed-bottom-button, .back-btn {
    display: none !important;
}
</style>