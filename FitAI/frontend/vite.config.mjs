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
  
  // ==========================================================
  // SECCIÓ "SERVER" CORREGIDA
  // ==========================================================
  server: {
    // Port del teu frontend (correcte)
    port: 3000,

    proxy: {
      // Totes les peticions a /api (ex: /api/register)
      '/api': {
        // CANVI: Apuntar al port correcte del teu server.js
        target: 'http://localhost:4000',
        changeOrigin: true,
        
        // Correcte: No hi ha 'rewrite'
      },
      
      // Totes les peticions a /ws (WebSockets)
      '/ws': {
        // CANVI: Apuntar al port correcte del teu server.js
        target: 'ws://localhost:4000',
        ws: true, // Activa el proxy per a WebSockets
        changeOrigin: true,
      },
    },
  },
  // ==========================================================
})