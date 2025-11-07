<template>
  <v-app>
    <v-main class="d-flex flex-column align-center justify-center pa-8 bg-fitai-bright" style="min-height: 100vh">
      
      <v-card class="pa-6 rounded-2xl elevation-12 glass-card" max-width="450" width="100%">
        <v-card-title class="text-h4 text-center font-weight-bold nextrep-title mb-4">
          <span class="next">Next</span><span class="rep">Rep</span>
        </v-card-title>
        
        <h2 class="text-h6 text-center text-grey-lighten-2 font-weight-regular mb-6">
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
              class="mb-4"
              :rules="[rules.required]"
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
              class="mb-2"
              :rules="[rules.required]"
            ></v-text-field>

            <v-btn
              :loading="loading"
              :disabled="loading"
              type="submit"
              class="neon-btn mt-6"
              variant="elevated"
              size="large"
              block
            >
              Entrar
            </v-btn>

            <v-btn 
              variant="text" 
              class="mt-4 text-white" 
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