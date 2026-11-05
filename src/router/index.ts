import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'
import { authDestination } from '@/features/auth/navigation'
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
      component: () => import('@/features/tenants/views/TenantAccessView.vue'),
      meta: { requiresAuth: true, title: 'Seu espaço', autoEnter: true },
    },
    {
      path: '/empresas',
      component: () => import('@/features/tenants/views/TenantAccessView.vue'),
      meta: { requiresAuth: true, title: 'Minhas empresas' },
    },
    {
      path: '/empresas/nova',
      component: () => import('@/features/tenants/views/CreateTenantView.vue'),
      meta: { requiresAuth: true, title: 'Criar empresa' },
    },
    {
      path: '/empresas/:tenantId/unidades',
      component: () => import('@/features/tenants/views/TenantUnitsView.vue'),
      meta: { requiresAuth: true, title: 'Matriz e filiais' },
    },
    {
      path: '/empresas/:tenantId',
      component: () => import('@/features/tenants/views/TenantDashboardView.vue'),
      meta: { requiresAuth: true, title: 'Início' },
    },
    {
      path: '/empresas/:tenantId/dados',
      component: () => import('@/features/tenants/views/TenantDetailsView.vue'),
      meta: { requiresAuth: true, title: 'Dados da empresa' },
    },
    {
      path: '/empresas/:tenantId/assinatura',
      component: () => import('@/features/tenants/views/TenantSubscriptionView.vue'),
      meta: { requiresAuth: true, title: 'Plano e assinatura' },
    },
    {
      path: '/empresas/:tenantId/equipe',
      component: () => import('@/features/members/views/TeamView.vue'),
      meta: { requiresAuth: true, title: 'Membros e convites' },
    },
    {
      path: '/empresas/:tenantId/equipes',
      component: () => import('@/features/teams/views/TeamsView.vue'),
      meta: { requiresAuth: true, title: 'Equipes' },
    },
    {
      path: '/empresas/:tenantId/permissoes',
      component: () => import('@/features/tenants/views/TenantPermissionsView.vue'),
      meta: { requiresAuth: true, title: 'Cargos e permissões' },
    },
    {
      path: '/convites',
      component: () => import('@/features/invitations/views/AcceptInvitationView.vue'),
      meta: { title: 'Aceitar convite' },
    },
    {
      path: '/admin',
      component: () => import('@/features/admin/views/PlatformView.vue'),
      meta: { requiresAuth: true, admin: true, title: 'Administração' },
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
  if (to.meta.admin && !auth.user?.is_platform_admin) return '/app'
  if (to.meta.guest && auth.user) return authDestination(to)
})
router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? 'CRM')} · TelecomHub`
})
export default router
