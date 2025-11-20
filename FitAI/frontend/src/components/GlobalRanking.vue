<template>
  <v-container
    class="pa-0 pa-sm-4 mb-10"
    :style="{ width: $vuetify.display.mobile ? '100%' : '800px' }"
  >
    <h2 class="text-h4 text-center mb-6 text-white ranking-title">
      🏆 Clasificación Global
    </h2>
    
    <v-alert v-if="store.error" type="error" class="mb-4">
      {{ store.error }}
    </v-alert>

    <v-data-table
      :headers="rankingHeaders"
      :items="store.sortedRanking" :items-per-page="-1"
      :loading="store.isLoading" class="elevation-12 ranking-table"
      density="comfortable"
      hide-default-footer
      :mobile="$vuetify.display.mobile"
      :no-data-text="store.isLoading ? 'Cargando clasificación...' : 'No hay datos de clasificación.'"
    >
      <template #item.pos="{ index }">
        <span :class="['font-weight-bold', getRankClass(index)]">{{ index + 1 }}</span>
      </template>
      <template #item.puntos="{ value }">
        <span class="font-weight-bold text-blue-lighten-2">{{ value.toLocaleString() }}</span>
      </template>
    </v-data-table>
    
    <p class="text-caption text-center mt-4 text-white text-opacity-75">
      *La clasificación se actualiza en tiempo real.
    </p>
  </v-container>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRankingStore } from '@/stores/rankingStore'

const store = useRankingStore()

const rankingHeaders = [
  { title: '#', key: 'pos', align: 'center', sortable: false, width: '50px' },
  { title: 'Jugador', key: 'jugador', align: 'start' },
  { title: 'Puntos', key: 'puntos', align: 'end' },
]

const getRankClass = (index) => {
  if (index === 0) return 'text-amber-lighten-2 text-h5'
  if (index === 1) return 'text-blue-grey-lighten-2 text-h6'
  if (index === 2) return 'text-brown-lighten-2'
  return 'text-white'
}

onMounted(() => {
  store.loadRankingData() 
})
</script>

<style scoped>
.ranking-title {
    text-shadow: 0 0 10px rgba(139, 92, 246, 0.8);
    letter-spacing: 1.5px;
}

.ranking-table {
    border-radius: 12px;
    background-color: rgba(30, 30, 47, 0.9) !important; 
    color: white !important;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(139, 92, 246, 0.3);
}

.ranking-table :deep(th) {
    background-color: rgba(139, 92, 246, 0.2) !important;
    color: #ffffff !important;
    font-weight: bold !important;
    letter-spacing: 1px;
}

.ranking-table :deep(tr) {
    transition: background-color 0.3s ease;
}

.ranking-table :deep(tr:hover) {
    background-color: rgba(59, 130, 246, 0.15) !important;
}

.ranking-table :deep(td) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    color: white;
}

.text-amber-lighten-2 {
    color: #ffb74d !important;
    text-shadow: 0 0 8px #ffb74d;
}
.text-blue-grey-lighten-2 {
    color: #b0bec5 !important;
    text-shadow: 0 0 6px #b0bec5;
}
.text-brown-lighten-2 {
    color: #a1887f !important;
    text-shadow: 0 0 5px #a1887f;
}

.text-blue-lighten-2 {
    color: #81d4fa !important;
    text-shadow: 0 0 6px #81d4fa;
}

.ranking-table :deep(tr:nth-child(1) .v-data-table__td:first-child span) {
    font-size: 1.5rem;
}
.ranking-table :deep(tr:nth-child(2) .v-data-table__td:first-child span) {
    font-size: 1.25rem;
}
</style>