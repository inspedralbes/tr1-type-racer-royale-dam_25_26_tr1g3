import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useRankingStore = defineStore('ranking', () => {
  // ESTAT (State)
  const rankingData = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // GETTERS (Computed)
  const sortedRanking = computed(() => {
    return [...rankingData.value].sort((a, b) => b.puntos - a.puntos)
  })

  // ACCIONS (Actions)
  async function loadRankingData() {
    // -----------------------------------------------------------------
    // 1. ELIMINAMOS ESTA LÍNEA OPCIONAL PARA FORZAR LA ACTUALIZACIÓN
    // if (rankingData.value.length > 0) return 
    // -----------------------------------------------------------------

    isLoading.value = true
    error.value = null
    try {
      // -----------------------------------------------------------------
      // ¡AQUÍ ESTÁN LAS CORRECCIONES!
      // -----------------------------------------------------------------
      const response = await fetch('/api/user/ranking', { // <-- 1. URL CORREGIDA
        credentials: 'include' // <-- 2. AÑADIR CREDENCIALES
      })
      // -----------------------------------------------------------------
      
      if (!response.ok) {
        // Mejoramos el mensaje de error
        if (response.status === 401) {
          throw new Error("No autorizado. Inicia sesión para ver el ranking.");
        }
        throw new Error("No se ha podido cargar la clasificación (Error " + response.status + ")");
      }
      
      const data = await response.json()
      rankingData.value = data
    } catch (e) {
      console.error('Error al carregar la classificació:', e)
      error.value = e.message
      rankingData.value = []
    } finally {
      isLoading.value = false
    }
  }

  return {
    rankingData,
    isLoading,
    error,
    sortedRanking,
    loadRankingData,
  }
})