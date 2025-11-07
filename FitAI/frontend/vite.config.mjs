// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import Fonts from 'unplugin-fonts/vite'
import VueRouter from 'unplugin-vue-router/vite'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    Components(),
    Fonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            weights: [100, 300, 400, 500, 700, 900],
            styles: ['normal', 'italic'],
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: [
      'vuetify',
      'vue-router',
      'unplugin-vue-router/runtime',
      'unplugin-vue-router/data-loaders',
      'unplugin-vue-router/data-loaders/basic',
    ],
  },
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    // Aquest és el port del teu frontend (npm run dev)
    port: 3000,

    // ==========================================================
    // SECCIÓ AFEGIDA: PROXY
    // ==========================================================
    proxy: {
      // Totes les peticions a /api (ex: /api/create-session)
      '/api': {
        // es redirigiran al teu backend (node server.js)
        target: 'http://localhost:4000',
        changeOrigin: true,
        // reescriu la ruta de '/api/create-session' a '/create-session'
        rewrite: (path) => path.replace(/^\/api/, ''), 
      },
      // Totes les peticions a /ws (WebSockets)
      '/ws': {
        // es redirigiran al teu backend
        target: 'http://localhost:4000',
        ws: true, // Activa el proxy per a WebSockets
        changeOrigin: true,
      },
    },
    // ==========================================================
  },
})