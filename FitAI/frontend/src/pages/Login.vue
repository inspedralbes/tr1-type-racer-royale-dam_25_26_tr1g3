<template>
  <v-app>
    <v-main class="d-flex flex-column align-center justify-center pa-8 bg-fitai-deep-space" style="min-height: 100vh">
      
      <v-card class="pa-6 rounded-xl elevation-12 glass-card-futuristic fade-in-container" max-width="450" width="100%">
        
      <v-img
      src="@/assets/logo.png" 
      alt="Logo NextRep"
      class="logo-login mb-4"
      max-height="100"
      contain
      ></v-img>

        <v-card-title class="text-h4 text-center font-weight-bold nextrep-title-login mb-4">
          <span class="next">Next</span><span class="rep">Rep</span>
        </v-card-title>
        
        <h2 class="text-h6 text-center text-purple-lighten-4 font-weight-regular mb-6">
          Inicia sessió per continuar
        </h2>

        <v-divider class="divider-glow mx-auto my-6"></v-divider>

        <v-form @submit.prevent="handleLogin">
          <v-card-text>
            <v-alert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              class="mb-4 glass-alert"
              closable
              @click:close="errorMessage = null"
            >
              {{ errorMessage }}
            </v-alert>

            <v-text-field
              v-model="email"
              label="Email o usuari"
              prepend-inner-icon="mdi-account-outline"
              variant="solo-filled"
              density="comfortable"
              class="mb-4 custom-input"
              :rules="[rules.required]"
              flat
            ></v-text-field>

            <v-text-field
              v-model="password"
              label="Contrasenya"
              prepend-inner-icon="mdi-lock-outline"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              variant="solo-filled"
              density="comfortable"
              class="mb-2 custom-input"
              :rules="[rules.required]"
              flat
            ></v-text-field>

            <v-btn
              :loading="loading"
              :disabled="loading"
              type="submit"
              class="neon-btn-primary mt-6"
              variant="elevated"
              size="large"
              block
            >
              Entrar
            </v-btn>

            <v-btn 
              variant="text" 
              class="mt-4 neon-btn-secondary" 
              block 
              @click="goToRegister"
            >
              No tens un compte? Registra't
            </v-btn>

          </v-card-text>
        </v-form>
      </v-card>

    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore' 

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref(null)

const rules = {
  required: value => !!value || 'Aquest camp és obligatori.',
}

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Si us plau, omple tots els camps.'
    return
  }

  loading.value = true
  errorMessage.value = null

  try {
    await authStore.login(email.value, password.value);
    
    router.push({ name: 'Home' });

  } catch (error) {
    loading.value = false;
    errorMessage.value = error.message; 
    password.value = '';
  }
}

const goToRegister = () => {
    router.push({ name: 'Register' });
}
</script>

<style scoped>

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

.logo-login {
    margin-left: auto;
    margin-right: auto;
    filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.5));
}

.glass-card-futuristic {
  background: rgba(30, 30, 47, 0.7); 
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.nextrep-title-login {
  font-size: 3rem !important;
  font-weight: 900 !important;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-align: center;
  line-height: 1;
  user-select: none;
}

.next {
  color: #ffffff;
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8)); 
}

.rep {
  background: linear-gradient(90deg, #9b6bff, #3b82f6);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-style: italic;
  animation: gradientShift 5s ease infinite;
  text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}


.divider-glow {
    height: 2px;
    border-radius: 4px;
    background: linear-gradient(90deg, transparent 0%, #3b82f6, #8b5cf6, #3b82f6, transparent 100%);
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.8);
    opacity: 0.8;
}

.custom-input {
    padding: 0 !important;
}

.custom-input :deep(.v-field) {
    background-color: rgba(0, 0, 0, 0.3) !important; 
    color: white !important;
    border-radius: 10px !important;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
}


.custom-input :deep(.v-field__input),
.custom-input :deep(.v-label) {
    color: #e0f7fa !important; 
    opacity: 1 !important;
}


.custom-input :deep(.v-input__prepend-inner .v-icon) {
    color: #8b5cf6 !important; 
}


.custom-input:focus-within :deep(.v-field) {
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.7) !important; 
    border-color: #3b82f6;
}


.neon-btn-primary {
    background: linear-gradient(90deg, #8b5cf6, #3b82f6) !important; 
    color: white !important;
    font-weight: bold;
    letter-spacing: 1px;
    border-radius: 10px !important;
    transition: all 0.4s ease;
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.8); 
}

.neon-btn-primary:hover {
    transform: translateY(-2px);
    background: linear-gradient(90deg, #a78bfa, #60a5fa) !important; 
    box-shadow: 0 0 25px rgba(139, 92, 246, 1.2), 0 5px 20px rgba(0, 0, 0, 0.5); 
}

.neon-btn-secondary {
    color: #9b6bff !important; 
    font-weight: 500;
    transition: color 0.3s ease;
}

.neon-btn-secondary:hover {
    color: #3b82f6 !important; 
    text-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
    background-color: transparent !important;
}

.glass-alert {
    background-color: rgba(255, 0, 0, 0.1) !important;
    border-left: 5px solid #ff5252 !important;
    color: white !important;
    backdrop-filter: blur(5px);
}
</style>