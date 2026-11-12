import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import OpportunityKanban from '../components/OpportunityKanban.vue'
import type { Opportunity } from '../api'

const item: Opportunity = {
  id: 'opportunity', code: 'OP-1', title: 'Portabilidade', status: 'open',
  client_id: 'client', tenant_user_id: 'seller', funnel_stage_id: 'proposal',
  operator_id: null, order_type: '', order_type_id: null, description: null,
  expected_close_at: null, estimated_monthly_amount: '99.80', estimated_one_time_amount: '0',
}
const stages = [
  { id: 'prospecting', name: 'Prospecção', position: 1, is_active: true },
  { id: 'proposal', name: 'Proposta', position: 2, is_active: true },
  { id: 'inactive', name: 'Inativa', position: 3, is_active: false },
]
function mountBoard(overrides = {}) {
  return mount(OpportunityKanban, {
    props: { items: [item], stages, canEdit: true, busyId: null, highlightedIds: [], ...overrides },
  })
}

describe('opportunity Kanban movement', () => {
  it.each([
    { canEdit: false },
    { busyId: 'opportunity' },
    { items: [{ ...item, status: 'won' }] },
    { stages: [{ ...stages[1]!, name: 'Para correção' }] },
  ])('does not allow movement when restricted: %o', overrides => {
    const wrapper = mountBoard(overrides)
    expect(wrapper.find('[aria-label="Arrastar oportunidade para outra etapa"]').exists()).toBe(false)
    expect(wrapper.get('article').attributes('draggable')).toBe('false')
  })

  it('accepts a native drop even when dragover cannot read transfer data', async () => {
    const wrapper = mountBoard()
    const dataTransfer = { setData: vi.fn(), getData: vi.fn(() => ''), effectAllowed: '', dropEffect: '' }
    await wrapper.get('article').trigger('dragstart', { dataTransfer })
    const target = wrapper.findAll('section')[0]!
    const over = new Event('dragover', { bubbles: true, cancelable: true })
    Object.defineProperty(over, 'dataTransfer', { value: dataTransfer })
    target.element.dispatchEvent(over)
    expect(over.defaultPrevented).toBe(true)
    expect(dataTransfer.dropEffect).toBe('move')
    await target.trigger('drop', { dataTransfer })
    expect(wrapper.emitted('move')).toEqual([['opportunity', 'prospecting']])
    expect(wrapper.emitted('dragging')).toEqual([[true], [false]])
    await wrapper.get('article').trigger('dragend')
    expect(wrapper.get('article').classes()).not.toContain('opacity-50')
  })

  it('does not emit a move when dropped back into the same stage', async () => {
    const wrapper = mountBoard()
    await wrapper.get('article').trigger('dragstart')
    await wrapper.findAll('section')[1]!.trigger('drop')
    expect(wrapper.emitted('move')).toBeUndefined()
  })
})
