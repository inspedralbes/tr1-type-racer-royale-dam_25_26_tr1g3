<template>
  <v-app>
    <v-main class="d-flex flex-column align-center justify-center pa-8 bg-fitai-bright" style="min-height: 100vh">
      
      <v-card class="pa-6 rounded-2xl elevation-12 glass-card" max-width="450" width="100%">
        <v-card-title class="text-h4 text-center font-weight-bold nextrep-title mb-4">
          <span class="next">Next</span><span class="rep">Rep</span>
        </v-card-title>
        
        <h2 class="text-h6 text-center text-grey-lighten-2 font-weight-regular mb-6">
          Crea el teu compte
        </h2>

        <v-divider class="divider-glow mx-auto my-6"></v-divider>

        <v-form @submit.prevent="handleRegister">
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
              v-model="nom"
              label="Nom d'usuari"
              prepend-inner-icon="mdi-account-outline"
              variant="solo-filled"
              density="comfortable"
              class="mb-4"
              :rules="[rules.required]"
            ></v-text-field>

            <v-text-field
              v-model="email"
              label="Email"
              prepend-inner-icon="mdi-email-outline"
              variant="solo-filled"
              density="comfortable"
              class="mb-4"
              :rules="[rules.required, rules.email]"
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
              class="mb-4"
              :rules="[rules.required]"
            ></v-text-field>

            <v-text-field
              v-model="passwordConfirm"
              label="Repeteix la contrasenya"
              prepend-inner-icon="mdi-lock-check-outline"
              :type="showPasswordConfirm ? 'text' : 'password'"
              :append-inner-icon="showPasswordConfirm ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPasswordConfirm = !showPasswordConfirm"
              variant="solo-filled"
              density="comfortable"
              class="mb-2"
              :rules="[rules.required, rules.passwordMatch]"
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
              Crear Compte
            </v-btn>

            <v-btn 
              variant="text" 
              class="mt-4 text-white" 
              block 
              @click="goToLogin"
            >
              Ja tens un compte? Inicia sessió
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

const nom = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const loading = ref(false)
const errorMessage = ref(null)

const rules = {
  required: value => !!value || 'Aquest camp és obligatori.',
  email: value => /.+@.+\..+/.test(value) || 'L\'email ha de ser vàlid.',
  passwordMatch: value => value === password.value || 'Les contrasenyes no coincideixen.'
}

const handleRegister = async () => {
  errorMessage.value = null

  if (!nom.value || !email.value || !password.value || !passwordConfirm.value) {
    errorMessage.value = 'Si us plau, omple tots els camps.'
    return
  }
  if (password.value !== passwordConfirm.value) {
    errorMessage.value = 'Les contrasenyes no coincideixen.'
    return
  }

  loading.value = true

  try {
    await authStore.register(nom.value, email.value, password.value);
    
    router.push({ name: 'Login' });

  } catch (error) {
    loading.value = false;
    errorMessage.value = error.message; 
  }
}

const goToLogin = () => {
  router.push({ name: 'Login' })
}
</script>