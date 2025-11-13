import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useRankingStore = defineStore('ranking', () => {
  // ESTAT (State)
  const rankingData = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // GETTERS (Computed)
  const sortedRanking = computed(() => {
    // La lògica d'ordenació es mou aquí
    return [...rankingData.value].sort((a, b) => b.puntos - a.puntos)
  })

  // ACCIONS (Actions)
  async function loadRankingData() {
    if (rankingData.value.length > 0) return // Opcional: no tornar a carregar si ja ho tenim

    isLoading.value = true
    error.value = null
    try {
      const response = await fetch('/api/ranking')
      if (!response.ok) {
        throw new Error("No s'ha pogut carregar la classificació")
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