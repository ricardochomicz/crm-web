import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './features/auth/store'
const app = createApp(App)
app.use(createPinia())
app.use(router)
window.addEventListener('auth:expired', () => {
  useAuthStore().clear()
  if (router.currentRoute.value.meta.requiresAuth) void router.replace('/login?expired=1')
})
app.mount('#app')
