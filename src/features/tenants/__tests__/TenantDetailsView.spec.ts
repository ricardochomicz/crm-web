import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import TenantDetailsView from '../views/TenantDetailsView.vue'
import { tenantApi } from '../api'
import { ApiError } from '@/lib/http'
import type { CompanyDetails } from '../types'
vi.mock('../api', () => ({ tenantApi: { details: vi.fn(), update: vi.fn() } }))
const company: CompanyDetails = {
  id: 'company-a',
  name: 'Empresa original',
  type: 'PJ',
  role: 'OWNER',
  document: '12345678000190',
  trade_name: 'Fantasia',
  email: 'contato@example.com',
  phone: null,
  timezone: 'America/Sao_Paulo',
  access: {
    permissions: ['company.update'],
    can_manage_permissions: true,
    allows_operational_writes: true,
    assignable_roles: [],
    capacity: null,
  },
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(tenantApi.details).mockResolvedValue({ data: structuredClone(company) })
  vi.mocked(tenantApi.update).mockResolvedValue(undefined)
})
async function render() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/empresas/:tenantId/dados', component: TenantDetailsView }],
  })
  await router.push('/empresas/company-a/dados')
  const wrapper = mount(TenantDetailsView, {
    global: { plugins: [router], stubs: { AppShell: { template: '<main><slot /></main>' } } },
  })
  await flushPromises()
  return wrapper
}
describe('Company details', () => {
  it('loads and saves editable fields with success feedback', async () => {
    const wrapper = await render()
    expect(wrapper.get<HTMLInputElement>('#company-email').element.value).toBe(
      'contato@example.com',
    )
    await wrapper.get('#company-name').setValue(' Nome atualizado ')
    await wrapper.get('#trade-name').setValue('')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(tenantApi.update).toHaveBeenCalledWith('company-a', {
      name: 'Nome atualizado',
      trade_name: null,
      email: 'contato@example.com',
      phone: null,
      timezone: 'America/Sao_Paulo',
    })
    expect(wrapper.text()).toContain('Dados da empresa atualizados com sucesso.')
    wrapper.unmount()
  })
  it('restores saved values when discarding edits', async () => {
    const wrapper = await render()
    await wrapper.get('#company-name').setValue('Rascunho')
    await wrapper.get('button[type="button"]').trigger('click')
    expect(wrapper.get<HTMLInputElement>('#company-name').element.value).toBe('Empresa original')
    expect(tenantApi.update).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  it.each(['permission', 'subscription'])('prevents updates blocked by %s', async (reason) => {
    vi.mocked(tenantApi.details).mockResolvedValue({
      data: {
        ...company,
        access: {
          ...company.access!,
          permissions: reason === 'permission' ? [] : ['company.update'],
          allows_operational_writes: reason !== 'subscription',
        },
      },
    })
    const wrapper = await render()
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button[type="submit"]').exists()).toBe(false)
    await wrapper.get('form').trigger('submit')
    expect(tenantApi.update).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  it('preserves entered data and displays server validation errors', async () => {
    vi.mocked(tenantApi.update).mockRejectedValue(
      new ApiError(422, 'Confira os dados.', { timezone: ['Fuso horário inválido.'] }),
    )
    const wrapper = await render()
    await wrapper.get('#company-timezone').setValue('Invalid/Zone')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('#company-timezone').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get<HTMLInputElement>('#company-timezone').element.value).toBe('Invalid/Zone')
    expect(wrapper.text()).toContain('Fuso horário inválido.')
    expect(wrapper.text()).not.toContain('atualizados com sucesso')
    wrapper.unmount()
  })
  it('does not submit missing required values', async () => {
    const wrapper = await render()
    await wrapper.get('#company-name').setValue(' ')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Informe o nome da empresa.')
    expect(tenantApi.update).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
