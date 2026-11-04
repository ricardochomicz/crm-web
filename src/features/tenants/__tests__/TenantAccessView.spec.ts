import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia } from 'pinia'
import TenantAccessView from '../views/TenantAccessView.vue'
import { tenantApi } from '../api'
import type { Tenant } from '../types'
vi.mock('../api', () => ({ tenantApi: { list: vi.fn(), select: vi.fn() } }))
const company: Tenant = { id: 'company-a', name: 'Empresa A', type: 'PJ', role: 'OWNER' }
beforeEach(() => vi.resetAllMocks())
async function render(autoEnter = true) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/app', component: TenantAccessView, meta: { autoEnter } },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push('/app')
  await router.isReady()
  const wrapper = mount(TenantAccessView, {
    global: {
      plugins: [createPinia(), router],
      stubs: { AppShell: { template: '<main><slot /></main>' } },
    },
  })
  await flushPromises()
  return { wrapper, router }
}
describe('Company entry flow', () => {
  it('offers onboarding when there are no active memberships', async () => {
    vi.mocked(tenantApi.list).mockResolvedValue({
      data: [],
      total: 0,
      current_page: 1,
      last_page: 1,
    })
    const { wrapper } = await render()
    expect(wrapper.text()).toContain('Você ainda não tem acesso a uma empresa ativa')
    expect(wrapper.get('a[href="/empresas/nova"]').text()).toContain('Criar minha empresa')
    expect(tenantApi.select).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  it('persists and opens the only available company', async () => {
    vi.mocked(tenantApi.list).mockResolvedValue({
      data: [company],
      total: 1,
      current_page: 1,
      last_page: 1,
    })
    const { wrapper, router } = await render()
    expect(tenantApi.select).toHaveBeenCalledWith(company.id)
    expect(router.currentRoute.value.path).toBe('/empresas/company-a')
    wrapper.unmount()
  })
  it('waits for selection when multiple companies are available', async () => {
    vi.mocked(tenantApi.list).mockResolvedValue({
      data: [company, { ...company, id: 'company-b', name: 'Empresa B' }],
      total: 2,
      current_page: 1,
      last_page: 1,
    })
    const { wrapper, router } = await render()
    expect(tenantApi.select).not.toHaveBeenCalled()
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Empresa B'))!
      .trigger('click')
    await flushPromises()
    expect(tenantApi.select).toHaveBeenCalledWith('company-b')
    expect(router.currentRoute.value.path).toBe('/empresas/company-b')
    wrapper.unmount()
  })
  it('does not auto-enter when explicitly switching companies', async () => {
    vi.mocked(tenantApi.list).mockResolvedValue({
      data: [company],
      total: 1,
      current_page: 1,
      last_page: 1,
    })
    const { wrapper } = await render(false)
    expect(tenantApi.select).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Acessar empresa')
    wrapper.unmount()
  })
  it('shows a retryable error instead of treating an API failure as an empty account', async () => {
    vi.mocked(tenantApi.list).mockRejectedValue(new Error('network'))
    const { wrapper } = await render()
    expect(wrapper.get('[role="alert"]').text()).toContain('Tentar novamente')
    expect(wrapper.find('a[href="/empresas/nova"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
