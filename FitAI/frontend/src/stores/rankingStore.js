import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useRankingStore = defineStore('ranking', () => {

  const rankingData = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const sortedRanking = computed(() => {
    return [...rankingData.value].sort((a, b) => b.puntos - a.puntos)
  })


  async function loadRankingData() {

    isLoading.value = true
    error.value = null
    try {
      const response = await fetch('/api/user/ranking', { 
        credentials: 'include'
      })
      
      if (!response.ok) {
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