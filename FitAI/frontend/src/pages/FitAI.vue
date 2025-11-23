<template>
  <v-app>
    <v-main
      class="d-flex flex-column align-center pa-4 bg-fitai-bright"
      style="min-height: 100vh"
    >
      <div class="header-content pt-4 pb-6 w-100">
        <div class="d-flex justify-space-between align-center px-4">
            
          <v-btn
            icon
            size="large"
            variant="plain"
            class="profile-btn-clen"
            @click="goToProfile"
          >
            <v-avatar size="60" class="profile-avatar-border"> 
                <v-img 
                    :src="profilePhotoUrl" 
                    alt="Foto de perfil" 
                />
            </v-avatar>
            
            <v-tooltip activator="parent" location="bottom">
              El meu Perfil
            </v-tooltip>
          </v-btn>
          
          <div class="d-flex justify-center logo-title-container" style="flex-grow: 1;">
            <v-img
              src="@/assets/logo.png"
              alt="Logo NextRep"
              max-height="60"
              max-width="60"
              class="logo-home mr-3 mt-1"
              contain
            />
            <h1 class="nextrep-title">
              <span class="next">Next</span><span class="rep">Rep</span>
            </h1>
          </div>
          
<div style="width: 72px; height: 72px;"></div> 
        </div>
      </div>

      <ExerciseList class="w-100" />

      <v-divider class="divider-glow mx-auto my-8"></v-divider>

      <GlobalRanking />

      <StreakPopup 
        v-model="showStreakDialog"
        :racha-actual="rachaActual"
      />

    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import ExerciseList from '@/components/ExerciseList.vue'
import GlobalRanking from '@/components/GlobalRanking.vue'
import StreakPopup from '@/components/StreakPopup.vue' 

const router = useRouter()
const authStore = useAuthStore()


const rachaData = ref({ dias: 1, ultimoAcceso: null })
const showStreakDialog = ref(false)

const rachaImagenes = [
  { dias: 1, imagen: new URL('@/assets/racha1.png', import.meta.url).href, size: 120 },
  { dias: 2, imagen: new URL('@/assets/racha2.png', import.meta.url).href, size: 140 },
  { dias: 3, imagen: new URL('@/assets/racha3.png', import.meta.url).href, size: 160 }
]

const rachaActual = computed(() => {
  const dias = rachaData.value.dias
  if (dias >= 3) return { ...rachaImagenes[2], dias }
  if (dias === 2) return rachaImagenes[1]
  return rachaImagenes[0]
})

const checkAndUpdateUserStreak = async () => {
  try {
    const response = await fetch('/api/user/streak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      rachaData.value = data;

      if (rachaData.value.dias >= 1 && !authStore.hasShownStreakPopup) {
        nextTick(() => {
          showStreakDialog.value = true;
          authStore.setStreakPopupShown(); 
        })
      }
    }
  } catch (error) {
    console.error('Error checking streak:', error);
  }
}

const defaultAvatar = 'https://cdn.vuetifyjs.com/images/cards/halcyon.png' 

const profilePhotoUrl = computed(() => {
    const user = authStore.user;
    if (user && user.foto_url) {
        return user.foto_url + '?' + Date.now(); 
    }
    return defaultAvatar;
});

const goToProfile = () => {
  router.push({ name: 'Profile' });
}

onMounted(() => {
  checkAndUpdateUserStreak(); 
});
</script>

<style>

.logo-home {
    
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
}


.bg-fitai-bright {
  background:
    radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.25) 0%, transparent 45%),
    radial-gradient(circle at 90% 10%, rgba(147, 51, 234, 0.25) 0%, transparent 45%),
    linear-gradient(135deg, #1a2238, #16213e 50%, #0f172a 100%);
  background-attachment: fixed;
  background-size: cover;
  animation: bgShine 18s ease-in-out infinite;
}

@keyframes bgShine {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}


.nextrep-title {
  font-size: 3.5rem; 
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: white;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.85);
  line-height: 1;
  user-select: none;
}

@media (min-width: 600px) {
  .nextrep-title {
    font-size: 4.5rem;
    letter-spacing: 2px;
  }
}

.next {
  color: #ffffff;
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
}

.rep {
  background: linear-gradient(90deg, #9b6bff, #3b82f6, #9b6bff);
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
    max-width: 85%;
    height: 1px;
    border-radius: 4px;
    background: linear-gradient(90deg, transparent 0%, #3b82f6, #8b5cf6, #3b82f6, transparent 100%);
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
    opacity: 0.7;
}
@media (min-width: 600px) {
    .divider-glow {
        max-width: 600px;
        height: 2px;
    }
}


.profile-btn-clean {
    transition: background-color 0.2s ease-in-out;
    border-radius: 50%; 
}

.profile-btn-clean:hover {

    background-color: rgba(255, 255, 255, 0.05) !important;
}


.profile-avatar-border {

    border: 3px solid #3b82f6; 
    box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); 
    background-color: #1a2238; 
}
</style>