import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', redirect: '/app' },
    ...[
      { path: '/login', mode: 'login', title: 'Entrar' },
      { path: '/register', mode: 'register', title: 'Criar conta' },
      { path: '/forgot-password', mode: 'forgot', title: 'Recuperar acesso' },
      { path: '/reset-password/:token', mode: 'reset', title: 'Nova senha' },
    ].map(({ path, mode, title }) => ({
      path,
      component: () => import('@/features/auth/views/AuthView.vue'),
      meta: { authMode: mode, title, guest: mode === 'login' || mode === 'register' },
    })),
    {
      path: '/app',
      component: () => import('@/features/auth/views/AccountView.vue'),
      meta: { requiresAuth: true, title: 'Sua conta' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/app' },
  ],
})
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  try {
    await auth.initialize()
  } catch {
    if (to.meta.requiresAuth) return { path: '/login' }
  }
  if (to.meta.requiresAuth && !auth.user) return '/login'
  if (to.meta.guest && auth.user) return '/app'
})
router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? 'CRM')} · TelecomHub`
})
export default router
