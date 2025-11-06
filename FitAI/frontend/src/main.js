/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'
import App from './App.vue'
import { createPinia } from 'pinia' 
import { createApp } from 'vue'
import 'unfonts.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

registerPlugins(app)

app.mount('#app')
