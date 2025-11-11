/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import vuetify from './vuetify'
import router from '@/router'

export function registerPlugins (app, pinia) {

  if (pinia) {
    pinia.use(({ store }) => {
      store.router = router
    })
  }

  app
    .use(vuetify)
    .use(router)
    .use(pinia)
}