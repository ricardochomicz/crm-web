import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import UnitAssignmentsDrawer from '../components/UnitAssignmentsDrawer.vue'
import { unitsApi, type TenantUnit, type UnitAssignment } from '../units'
vi.mock('../units', () => ({ unitsApi: { assignments: vi.fn(), changeAssignments: vi.fn() } }))
const unit: TenantUnit = {
  id: 'unit-a',
  name: 'Filial',
  is_headquarters: false,
  email: null,
  phone: null,
  address: null,
  members_count: 1,
  teams_count: 0,
}
const ana: UnitAssignment = {
  id: 'ana',
  name: 'Ana',
  email: 'ana@example.com',
  removal_blocked_reason: null,
}
const bia: UnitAssignment = {
  id: 'bia',
  name: 'Bia',
  email: 'bia@example.com',
  removal_blocked_reason: null,
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(unitsApi.assignments).mockResolvedValue({
    data: [ana],
    current_page: 1,
    last_page: 1,
    total: 1,
  })
  vi.mocked(unitsApi.changeAssignments).mockResolvedValue(undefined)
})
afterEach(() => vi.useRealTimers())
async function render() {
  const wrapper = mount(UnitAssignmentsDrawer, {
    props: { tenantId: 'company-a', unit },
    global: {
      stubs: {
        AppDialog: { props: { open: Boolean }, template: '<aside v-if="open"><slot /></aside>' },
      },
    },
  })
  await flushPromises()
  return wrapper
}
function button(wrapper: Awaited<ReturnType<typeof render>>, label: string) {
  return wrapper.findAll('button').find((item) => item.text() === label)!
}
describe('Unit assignment drawer', () => {
  it('keeps selected members across pages and searches, submitting only selected ids', async () => {
    vi.useFakeTimers()
    vi.mocked(unitsApi.assignments).mockImplementation(
      async (_tenant, _unit, _kind, _mode, q, page) => ({
        data: q || page === 2 ? [bia] : [ana],
        current_page: page ?? 1,
        last_page: 2,
        total: 21,
      }),
    )
    const wrapper = await render()
    await button(wrapper, 'Adicionar pessoas').trigger('click')
    await flushPromises()
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.get('[aria-label="Próxima página"]').trigger('click')
    await flushPromises()
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.get('input[type="search"]').setValue('bia@example.com')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(unitsApi.assignments).toHaveBeenLastCalledWith(
      'company-a',
      'unit-a',
      'members',
      'available',
      'bia@example.com',
      1,
    )
    expect(wrapper.text()).toContain('2 pessoas selecionadas')
    await button(wrapper, 'Adicionar selecionados').trigger('click')
    await flushPromises()
    expect(unitsApi.changeAssignments).toHaveBeenCalledWith(
      'company-a',
      'unit-a',
      'members',
      'add',
      ['ana', 'bia'],
    )
    expect(wrapper.emitted('changed')).toHaveLength(1)
    wrapper.unmount()
  })
  it('removes only the confirmed member', async () => {
    const wrapper = await render()
    await wrapper.get('[aria-label="Remover vínculo de Ana"]').trigger('click')
    expect(wrapper.text()).toContain('A pessoa continuará na empresa')
    expect(unitsApi.changeAssignments).not.toHaveBeenCalled()
    await button(wrapper, 'Confirmar').trigger('click')
    await flushPromises()
    expect(unitsApi.changeAssignments).toHaveBeenCalledWith(
      'company-a',
      'unit-a',
      'members',
      'remove',
      ['ana'],
    )
    wrapper.unmount()
  })
  it('explains why a team member cannot be removed', async () => {
    vi.mocked(unitsApi.assignments).mockResolvedValue({
      data: [{ ...ana, removal_blocked_reason: 'Atualize a equipe antes de remover.' }],
      current_page: 1,
      last_page: 1,
      total: 1,
    })
    const wrapper = await render()
    expect(
      wrapper.get('[aria-label="Remover vínculo de Ana"]').attributes('disabled'),
    ).toBeDefined()
    expect(wrapper.text()).toContain('Atualize a equipe antes de remover.')
    wrapper.unmount()
  })
  it('shows the original unit before confirming a team transfer', async () => {
    const wrapper = await render()
    vi.mocked(unitsApi.assignments).mockResolvedValue({
      data: [{ id: 'team-a', name: 'Vendas', unit_name: 'Matriz', removal_blocked_reason: null }],
      current_page: 1,
      last_page: 1,
      total: 1,
    })
    await button(wrapper, 'Equipes (0)').trigger('click')
    await flushPromises()
    await button(wrapper, 'Transferir equipes').trigger('click')
    await flushPromises()
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await button(wrapper, 'Revisar transferência').trigger('click')
    expect(wrapper.text()).toContain('Unidade atual: Matriz')
    expect(wrapper.text()).toContain('Transferir equipes para Filial?')
    expect(unitsApi.changeAssignments).not.toHaveBeenCalled()
    await button(wrapper, 'Confirmar').trigger('click')
    await flushPromises()
    expect(unitsApi.changeAssignments).toHaveBeenCalledWith('company-a', 'unit-a', 'teams', 'add', [
      'team-a',
    ])
    wrapper.unmount()
  })
  it('retains selection after a failed save', async () => {
    vi.mocked(unitsApi.changeAssignments).mockRejectedValue(new Error('offline'))
    const wrapper = await render()
    await button(wrapper, 'Adicionar pessoas').trigger('click')
    await flushPromises()
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await button(wrapper, 'Adicionar selecionados').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('1 pessoas selecionadas')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.emitted('changed')).toBeUndefined()
    wrapper.unmount()
  })
})
