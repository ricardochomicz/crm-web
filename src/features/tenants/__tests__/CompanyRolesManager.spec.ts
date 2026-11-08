import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import CompanyRolesManager from '../components/CompanyRolesManager.vue'
import { ApiError, mutate, request } from '@/lib/http'
import { permissionsApi } from '../permissions'
import type { CompanyRole } from '@/features/members/api'

vi.mock('@/lib/http', async (original) => ({
  ...(await original<typeof import('@/lib/http')>()),
  request: vi.fn(),
  mutate: vi.fn(),
}))
vi.mock('../permissions', () => ({ permissionsApi: { roleHistory: vi.fn() } }))
enableAutoUnmount(afterEach)

const role: CompanyRole = {
  id: 'finance',
  code: 'FINANCE',
  name: 'Financeiro',
  legacy_role: 'ASSISTANT',
  permissions: ['clients.view'],
  version: 3,
  is_active: true,
  is_system: true,
  can_assign: true,
}
const catalog = [
  { key: 'clients.view', label: 'Visualizar clientes', group: 'Clientes', requires: [] },
]
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(request).mockResolvedValue({ data: [structuredClone(role)] })
  vi.mocked(permissionsApi.roleHistory).mockResolvedValue({
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
  })
})

async function render() {
  const wrapper = mount(CompanyRolesManager, {
    props: { tenantId: 'company', catalog, canEdit: true },
  })
  await flushPromises()
  return wrapper
}

describe('company role management', () => {
  it('submits the loaded version and permits removing every permission', async () => {
    const wrapper = await render()
    await wrapper.get('button[aria-expanded]').trigger('click')
    const permission = wrapper.findAll('input[type=checkbox]')[1]!
    await permission.setValue(false)
    vi.mocked(mutate).mockResolvedValue({ data: { ...role, permissions: [], version: 4 } })
    vi.mocked(request).mockResolvedValue({ data: [{ ...role, permissions: [], version: 4 }] })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mutate).toHaveBeenCalledWith(
      '/api/v1/tenants/company/roles/finance',
      {
        name: 'Financeiro',
        permissions: [],
        is_active: true,
        version: 3,
      },
      'PATCH',
    )
    expect(wrapper.text()).toContain('Todas as alterações estão salvas')
  })

  it('preserves the draft after a conflict and requires reloading before saving again', async () => {
    const wrapper = await render()
    await wrapper.get('#company-role-name').setValue('Meu rascunho')
    vi.mocked(mutate).mockRejectedValue(new ApiError(409, 'Cargo alterado em outra sessão.'))
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get<HTMLInputElement>('#company-role-name').element.value).toBe('Meu rascunho')
    expect(wrapper.get<HTMLButtonElement>('button[type=submit]').element.disabled).toBe(true)
    await wrapper.get('form').trigger('submit')
    expect(mutate).toHaveBeenCalledTimes(1)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(request).mockResolvedValue({ data: [{ ...role, name: 'Outra sessão', version: 4 }] })
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Recarregar cargo')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.get<HTMLInputElement>('#company-role-name').element.value).toBe('Outra sessão')
    await wrapper.get('#company-role-name').setValue('Revisado')
    vi.mocked(mutate).mockResolvedValue({ data: { ...role, name: 'Revisado', version: 5 } })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mutate).toHaveBeenLastCalledWith(
      '/api/v1/tenants/company/roles/finance',
      expect.objectContaining({ version: 4, name: 'Revisado' }),
      'PATCH',
    )
    vi.restoreAllMocks()
  })

  it('shows the selected role history and requests its next page', async () => {
    vi.mocked(permissionsApi.roleHistory).mockResolvedValue({
      current_page: 1,
      last_page: 2,
      total: 21,
      data: [
        {
          id: 'change',
          actor_name: 'Proprietário',
          tenant_role_id: role.id,
          role: 'ASSISTANT',
          previous_role_state: { name: role.name, is_active: true, permissions: ['clients.view'] },
          role_state: { name: role.name, is_active: false, permissions: [] },
          previous_permissions: ['clients.view'],
          permissions: [],
          version: 4,
          created_at: '2026-11-08T12:00:00Z',
        },
      ],
    })
    const wrapper = await render()
    expect(wrapper.text()).toContain('Proprietário')
    expect(wrapper.text()).toContain('Removidas: Visualizar clientes')
    expect(wrapper.text()).toContain('Inativo para novos vínculos')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Próxima')!
      .trigger('click')
    await flushPromises()
    expect(permissionsApi.roleHistory).toHaveBeenLastCalledWith('company', 'finance', 2)
  })
})
