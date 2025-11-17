<template>
  <v-app>
    <v-main class="d-flex flex-column align-center justify-center pa-8 bg-fitai-deep-space" style="min-height: 100vh">

      <v-card 
        class="pa-6 rounded-xl elevation-12 glass-card-futuristic fade-in-container text-center" 
        max-width="600" 
        width="100%"
        v-if="user"
      >
        <v-card-title class="text-h4 font-weight-bold mb-4 nextrep-title-login">
          El meu Perfil <v-icon color="purple-lighten-2">mdi-account-circle</v-icon>
        </v-card-title>
        
        <v-divider class="divider-glow mx-auto my-6"></v-divider>

        <div class="mb-6 photo-upload-container">
          
          <input 
            type="file" 
            ref="fileInput" 
            style="display: none" 
            accept="image/*"
            @change="onFileSelected"
          >

          <v-avatar size="128" class="profile-avatar mb-4 elevation-6" @click="triggerFileInput">
            <v-img :src="previewImage || user.foto_url || defaultAvatar" alt="Foto de perfil"></v-img>
            
            <div class="camera-overlay">
                <v-icon size="36" color="white">mdi-camera-plus</v-icon>
            </div>
          </v-avatar>
          
          <h2 class="text-h4 font-weight-bold text-white mb-2 user-name-glow">{{ user.nom }}</h2>
          <p class="text-subtitle-1 text-purple-lighten-4">{{ user.email }}</p>

          <div v-if="selectedFile" class="mt-4 d-flex justify-center ga-4">
              <v-btn
                :loading="uploading"
                :disabled="uploading"
                color="green-lighten-1"
                class="neon-btn-upload"
                @click="uploadPhoto"
              >
                  <v-icon start>mdi-upload</v-icon>
                  Pujar Foto
              </v-btn>
              <v-btn
                color="red-lighten-1"
                variant="outlined"
                @click="cancelUpload"
              >
                  <v-icon start>mdi-close</v-icon>
                  Cancel·lar
              </v-btn>
          </div>
          <v-alert
              v-if="uploadMessage"
              :type="uploadMessageType"
              variant="tonal"
              class="mt-4 glass-alert"
          >
              {{ uploadMessage }}
          </v-alert>

        </div>

        <v-divider class="divider-glow mx-auto my-6"></v-divider>
        <v-row dense class="text-left">
          <v-col cols="12" md="6">
            <v-list class="transparent-list">
              <v-list-item class="mb-2">
                <template v-slot:prepend>
                  <v-icon color="blue-lighten-2" class="mr-2">mdi-dumbbell</v-icon>
                </template>
                <v-list-item-title class="font-weight-medium">Repeticions Totals:</v-list-item-title>
                <v-list-item-subtitle class="text-white">{{ (user.repeticions_totals || 0).toLocaleString() }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>

          <v-col cols="12" md="6">
            <v-list class="transparent-list">
              <v-list-item class="mb-2">
                <template v-slot:prepend>
                  <v-icon color="green-lighten-2" class="mr-2">mdi-clock-check-outline</v-icon>
                </template>
                <v-list-item-title class="font-weight-medium">Sessions Completades:</v-list-item-title>
                <v-list-item-subtitle class="text-white">{{ user.sessions_completades || 0 }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
        
 <v-divider class="divider-glow mx-auto my-6"></v-divider>

        <v-btn 
            @click="goToHome"
            class="neon-btn-secondary mt-4 mb-2" 
            size="large"
            block
            variant="tonal"
        >
            <v-icon start>mdi-home-outline</v-icon>
            Tornar a l'Inici
        </v-btn>
        
        <v-btn 
            @click="handleLogout"
            class="neon-btn-primary mb-4" 
            size="large"
            block
        >
            <v-icon start>mdi-logout</v-icon>
            Tancar Sessió
        </v-btn>

      </v-card>

      <v-alert
        v-else
        type="warning"
        variant="tonal"
        class="glass-alert fade-in-container"
      >
        No s'ha pogut carregar el perfil. Si us plau, inicia sessió.
      </v-alert>

    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore' 

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const defaultAvatar = ref('https://cdn.vuetifyjs.com/images/cards/halcyon.png') 

// Estats per a la càrrega de fotos
const fileInput = ref(null)
const selectedFile = ref(null)
const previewImage = ref(null)
const uploading = ref(false)
const uploadMessage = ref(null)
const uploadMessageType = ref('info')


/**
 * 1. Simula un clic al camp de fitxer ocult.
 */
const triggerFileInput = () => {
    fileInput.value.click();
}

/**
 * 2. Gestiona la selecció del fitxer i crea una previsualització.
 */
const onFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
        // Estableix el fitxer per a la càrrega
        selectedFile.value = file;
        
        // Crea una URL local per a la previsualització
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.value = e.target.result;
        };
        reader.readAsDataURL(file);
        
        uploadMessage.value = `Fitxer seleccionat: ${file.name}. Prem "Pujar Foto" per guardar.`;
        uploadMessageType.value = 'info';
    } else {
        cancelUpload();
    }
}

/**
 * 3. Lògica per a pujar la foto al servidor.
 * La funció **`uploadPhoto`** és la que gestiona el guardat de la foto seleccionada.
 */
const uploadPhoto = async () => {
    if (!selectedFile.value) return;

    uploading.value = true;
    uploadMessage.value = 'Pujant imatge...';
    uploadMessageType.value = 'info';

    try {
        // Envia el fitxer a través de FormData
        const formData = new FormData();
        formData.append('profilePicture', selectedFile.value);
        
        // **!!! CRIDA A L'ACCIÓ D'ACTUALITZACIÓ DEL STORE (cal implementar-la) !!!**
        // Aquesta funció ha d'estar implementada en el teu `authStore` per enviar la imatge al backend.
        await authStore.updateProfilePicture(formData); 
        
        uploadMessage.value = 'Foto de perfil actualitzada correctament!';
        uploadMessageType.value = 'success';
        
        // Neteja l'estat i actualitza la URL de l'usuari (això ho faria l'authStore després de la resposta del backend)
        selectedFile.value = null;
        previewImage.value = null;

    } catch (error) {
        console.error('Error al pujar la foto:', error);
        uploadMessage.value = error.message || 'Error desconegut al pujar la foto.';
        uploadMessageType.value = 'error';
    } finally {
        uploading.value = false;
        // Reinicia el camp de fitxer perquè es pugui tornar a seleccionar el mateix fitxer
        fileInput.value.value = ''; 
    }
}

/**
 * 4. Cancel·la la càrrega i neteja la previsualització.
 */
const cancelUpload = () => {
    selectedFile.value = null;
    previewImage.value = null;
    uploadMessage.value = null;
    fileInput.value.value = '';
}

/**
 * 5. Funció per tornar a la pàgina d'inici.
 * Redirigeix a la ruta amb el nom 'FitAi'.
 */
const goToHome = () => {
    // Asume que tu ruta de inicio se llama 'FitAi' en el Vue Router
    router.push({ name: 'Home' });
}

const handleLogout = async () => {
    await authStore.logout();
    router.push({ name: 'Login' });
}
</script>

<style scoped>
/* ==================================== */
/* ======== ESTILS DE FONS I CONTENIDOR ======== */
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
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
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
    color: #ffffff;
    text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}

.divider-glow {
    height: 2px;
    border-radius: 4px;
    background: linear-gradient(90deg, transparent 0%, #3b82f6, #8b5cf6, #3b82f6, transparent 100%);
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.8);
    opacity: 0.8;
}

/* Estil que faltava per a l'alerta */
.glass-alert {
    background-color: rgba(255, 152, 0, 0.1) !important; /* Base per advertència (groc/taronja) */
    border-left: 5px solid #ff9800 !important;
    color: white !important;
    backdrop-filter: blur(5px);
}


/* ==================================== */
/* ======== ESTILS DE LA FOTO DE PERFIL ======== */
/* ==================================== */

.photo-upload-container {
    position: relative;
    display: inline-block;
}

.profile-avatar {
    border: 3px solid #8b5cf6; 
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.9);
    cursor: pointer; 
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

.profile-avatar:hover {
    box-shadow: 0 0 30px rgba(59, 130, 246, 1.2); 
    transform: scale(1.05);
}

.camera-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5); 
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.profile-avatar:hover .camera-overlay {
    opacity: 1; 
}

.user-name-glow {
    text-shadow: 0 0 5px rgba(59, 130, 246, 0.8);
}


/* ==================================== */
/* ======== ESTILS D'ELEMENTS INTERNS ======== */
/* ==================================== */

/* Llista de dades transparent */
.transparent-list {
    background-color: transparent !important;
    color: #ffffff;
}

.transparent-list .v-list-item {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    transition: background-color 0.3s;
    margin-bottom: 8px; 
    border: 1px solid rgba(139, 92, 246, 0.1);
}

.transparent-list .v-list-item:hover {
    background-color: rgba(59, 130, 246, 0.1);
}

.transparent-list .v-list-item-title {
    color: #a78bfa !important;
}


/* Botons */

/* Botó de Pujar Foto (Verd Neón) */
.neon-btn-upload {
    background: linear-gradient(90deg, #10b981, #34d399) !important; 
    color: white !important;
    font-weight: bold;
    border-radius: 8px !important;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
    transition: all 0.4s ease;
}

.neon-btn-upload:hover {
    box-shadow: 0 0 20px rgba(16, 185, 129, 1.2), 0 5px 15px rgba(0, 0, 0, 0.5);
    transform: translateY(-1px);
}

.neon-btn-secondary {
    color: #3b82f6 !important; /* Text blau neón */
    border: 1px solid rgba(59, 130, 246, 0.4);
    background-color: rgba(59, 130, 246, 0.1) !important;
    font-weight: bold;
    letter-spacing: 0.5px;
    border-radius: 10px !important;
    transition: all 0.3s ease;
}

.neon-btn-secondary:hover {
    background-color: rgba(59, 130, 246, 0.25) !important;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
    transform: translateY(-1px);
}

/* Botó de Tancar Sessió (Primari Morat/Blau) */
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
</style>