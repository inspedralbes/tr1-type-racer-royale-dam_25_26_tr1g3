<template>
  <v-card
    class="pa-4 pa-sm-5 rounded-xl bg-light-card leaderboard-card"
    elevation="8"
  >
    <h3 class="text-h6 font-weight-bold text-teal-accent-3 mb-4 ranking-title">
      🏆 CLASSIFICACIÓ
    </h3>

    <v-list density="compact" class="text-grey-lighten-3 bg-transparent ranking-list">
      <v-list-item
        v-for="(user, index) in users"
        :key="user.userId"
        class="rounded-lg mb-2 pa-2 list-item-glow"
        :class="index === 0 ? 'bg-top1' : index === 1 ? 'bg-top2' : index === 2 ? 'bg-top3' : 'bg-standard'"
        style="border: 1px solid rgba(255, 255, 255, 0.05);"
      >
        <div class="d-flex justify-space-between align-center text-body-1 font-weight-medium">
          <div>
            <v-icon size="small" class="mr-3" :color="index === 0 ? 'yellow-accent-4' : 'grey-lighten-2'">
              {{ index === 0 ? 'mdi-trophy-variant' : 'mdi-account-circle' }}
            </v-icon>
            <strong class="mr-2">{{ index + 1 }}.</strong> {{ user.userName }}
          </div>

          <span class="font-weight-black" :class="index < 3 ? 'text-h6 text-teal-accent-3' : 'text-body-1'">
            {{ user.reps }} <span class="text-caption font-weight-light">reps</span>
          </span>
        </div>
      </v-list-item>
    </v-list>
    <div v-if="!users.length" class="text-center text-grey-darken-1 pt-3">
      No hi ha dades a la classificació. Comença a entrenar!
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  users: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.leaderboard-card {
  background: rgba(255, 255, 255, 0.05); 
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.ranking-title {
    text-shadow: 0 0 8px rgba(0, 255, 170, 0.7); 
}
.bg-top1 {
  background: rgba(255, 215, 0, 0.15) !important; 
  border-left: 5px solid #ffd700 !important;
}
.bg-top2 {
  background: rgba(192, 192, 192, 0.15) !important; 
  border-left: 5px solid #c0c0c0 !important;
}
.bg-top3 {
  background: rgba(176, 141, 87, 0.15) !important; 
  border-left: 5px solid #b08d57 !important;
}
.bg-standard {
    background: rgba(255, 255, 255, 0.03) !important;
}
.list-item-glow {
    transition: all 0.3s ease;
}
.list-item-glow:hover {
    transform: translateX(4px);
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
}
</style>