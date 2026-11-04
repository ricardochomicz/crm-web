import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia } from 'pinia'
import CreateTenantView from '../views/CreateTenantView.vue'
import { tenantApi } from '../api'
vi.mock('../api', () => ({ tenantApi: { plans: vi.fn(), create: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())
async function render() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/empresas/nova', component: CreateTenantView },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push('/empresas/nova')
  await router.isReady()
  const wrapper = mount(CreateTenantView, {
    global: {
      plugins: [createPinia(), router],
      stubs: { AppShell: { template: '<main><slot /></main>' } },
    },
  })
  await flushPromises()
  return { wrapper, router }
}
async function fillCompany(wrapper: Awaited<ReturnType<typeof render>>['wrapper']) {
  await wrapper.get('#company-name').setValue('Empresa de teste')
  await wrapper.get('#document').setValue('12.345.678/0001-90')
  await wrapper.get('#company-email').setValue('contato@example.test')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}
describe('Company onboarding', () => {
  it('validates the company before opening plan selection', async () => {
    vi.mocked(tenantApi.plans).mockResolvedValue({ data: [] })
    const { wrapper } = await render()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Informe o nome da empresa.')
    expect(wrapper.text()).toContain('Informe um CNPJ com 14 dígitos.')
    expect(tenantApi.create).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  it('prevents creation when no active plan is available', async () => {
    vi.mocked(tenantApi.plans).mockResolvedValue({ data: [] })
    const { wrapper } = await render()
    await fillCompany(wrapper)
    expect(wrapper.text()).toContain('Nenhum plano está disponível')
    expect(wrapper.get('.primary-button').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
  it('submits the selected plan and normalized company data and opens its workspace', async () => {
    vi.mocked(tenantApi.plans).mockResolvedValue({
      data: [
        {
          id: 'plan-a',
          name: 'Equipe',
          description: 'Para equipes',
          monthly_price: '199.00',
          currency: 'BRL',
          user_limit: 5,
          storage_limit_mb: 1024,
        },
      ],
    })
    vi.mocked(tenantApi.create).mockResolvedValue({
      data: { id: 'company-a', name: 'Empresa de teste', type: 'PJ' },
    })
    const { wrapper, router } = await render()
    await fillCompany(wrapper)
    await wrapper.get('.primary-button').trigger('click')
    await flushPromises()
    expect(tenantApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_plan_id: 'plan-a',
        tenant: expect.objectContaining({
          name: 'Empresa de teste',
          document: '12345678000190',
          type: 'PJ',
          email: 'contato@example.test',
        }),
      }),
    )
    expect(router.currentRoute.value.path).toBe('/empresas/company-a')
    wrapper.unmount()
  })
})
