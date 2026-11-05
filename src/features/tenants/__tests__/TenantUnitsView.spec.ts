import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import TenantUnitsView from '../views/TenantUnitsView.vue'
import { tenantApi } from '../api'
import { unitsApi, type UnitList } from '../units'
import { ApiError } from '@/lib/http'
vi.mock('../api', () => ({ tenantApi: { show: vi.fn() } }))
vi.mock('../units', () => ({
  unitsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), assignments: vi.fn() },
}))
const result: UnitList = {
  data: [
    {
      id: 'headquarters',
      name: 'Matriz',
      is_headquarters: true,
      email: null,
      phone: null,
      address: null,
      members_count: 1,
      teams_count: 0,
      membership_ids: ['member-a'],
      team_ids: [],
    },
  ],
  meta: {
    can_manage: true,
    members: [{ id: 'member-a', name: 'Ana', status: 'ACTIVE' }],
    teams: [],
  },
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(tenantApi.show).mockResolvedValue({
    data: {
      id: 'company-a',
      name: 'Empresa',
      type: 'PJ',
      role: 'OWNER',
      access: {
        permissions: ['units.manage'],
        can_manage_permissions: true,
        allows_operational_writes: true,
        assignable_roles: [],
        capacity: null,
      },
    },
  })
  vi.mocked(unitsApi.list).mockResolvedValue(structuredClone(result))
  vi.mocked(unitsApi.create).mockResolvedValue(undefined)
  vi.mocked(unitsApi.assignments).mockResolvedValue(undefined)
})
async function render() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/empresas/:tenantId/unidades', component: TenantUnitsView }],
  })
  await router.push('/empresas/company-a/unidades')
  const wrapper = mount(TenantUnitsView, {
    global: { plugins: [router], stubs: { AppShell: { template: '<main><slot /></main>' } } },
  })
  await flushPromises()
  return wrapper
}
describe('Matriz e filiais', () => {
  it('creates a branch with contact details', async () => {
    const wrapper = await render()
    await wrapper.get('header button').trigger('click')
    await wrapper.get('#unit-name').setValue('Filial Centro')
    await wrapper.get('#unit-address').setValue('Rua Central, 10')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(unitsApi.create).toHaveBeenCalledWith('company-a', {
      name: 'Filial Centro',
      address: 'Rua Central, 10',
      email: null,
      phone: null,
    })
    expect(wrapper.text()).toContain('Unidade salva com sucesso.')
    wrapper.unmount()
  })
  it('edits a unit without changing its type', async () => {
    const wrapper = await render()
    await wrapper.get('article button').trigger('click')
    await wrapper.get('#unit-name').setValue('Sede')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(unitsApi.update).toHaveBeenCalledWith('company-a', 'headquarters', {
      name: 'Sede',
      email: null,
      phone: null,
      address: null,
    })
    wrapper.unmount()
  })
  it('saves member assignments', async () => {
    const wrapper = await render()
    await wrapper.findAll('article button')[1]!.trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(unitsApi.assignments).toHaveBeenCalledWith('company-a', 'headquarters', ['member-a'], [])
    expect(wrapper.text()).toContain('Vínculos da unidade atualizados.')
    wrapper.unmount()
  })
  it('keeps form input when validation fails', async () => {
    vi.mocked(unitsApi.create).mockRejectedValue(
      new ApiError(422, 'Confira os dados', { name: ['Nome inválido.'] }),
    )
    const wrapper = await render()
    await wrapper.get('header button').trigger('click')
    await wrapper.get('#unit-name').setValue('Filial')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get<HTMLInputElement>('#unit-name').element.value).toBe('Filial')
    expect(wrapper.get('#unit-name').attributes('aria-invalid')).toBe('true')
    wrapper.unmount()
  })
  it('hides management actions from members without permission', async () => {
    vi.mocked(unitsApi.list).mockResolvedValue({
      ...result,
      meta: { can_manage: false, members: [], teams: [] },
    })
    const wrapper = await render()
    expect(wrapper.find('header button').exists()).toBe(false)
    expect(wrapper.find('article button').exists()).toBe(false)
    wrapper.unmount()
  })
})
