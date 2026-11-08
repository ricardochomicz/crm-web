import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import AppNavigation from '../layout/AppNavigation.vue'
import type { Tenant } from '@/features/tenants/types'

vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/empresas/company/comissoes' }) }))
vi.mock('@/features/auth/store', () => ({ useAuthStore: () => ({ user: {} }) }))
enableAutoUnmount(afterEach)

function render(permissions: string[]) {
  const tenant: Tenant = {
    id: 'company', name: 'Empresa', type: 'PJ', role: 'ASSISTANT',
    access: { permissions, can_manage_permissions: false, allows_operational_writes: true, assignable_roles: [], capacity: null },
  }
  return mount(AppNavigation, { props: { tenant }, global: { stubs: {
    RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' }, AppIcon: true,
  } } })
}

describe('commercial navigation permissions', () => {
  it('does not expose goals, team commissions or classifications with only commission access', () => {
    const wrapper = render(['commissions.view'])
    expect(wrapper.find('a[href$="/comissoes"]').exists()).toBe(true)
    expect(wrapper.find('a[href$="/metas-comerciais"]').exists()).toBe(false)
    expect(wrapper.find('a[href$="/comissoes-equipe"]').exists()).toBe(false)
    expect(wrapper.find('a[href$="/classificacoes"]').exists()).toBe(false)
  })

  it('respects explicit permissions for a custom operational role', () => {
    const wrapper = render(['commercial-goals.view', 'team-commissions.view', 'operator-classifications.view'])
    expect(wrapper.find('a[href$="/metas-comerciais"]').exists()).toBe(true)
    expect(wrapper.find('a[href$="/comissoes-equipe"]').exists()).toBe(true)
    expect(wrapper.find('a[href$="/classificacoes"]').exists()).toBe(true)
    expect(wrapper.find('a[href$="/comissoes"]').exists()).toBe(false)
  })
})
