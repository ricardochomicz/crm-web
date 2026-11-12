import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { opportunitiesApi, type Opportunity, type OpportunityFilters } from '../api'
import { useOpportunityStagePagination } from '../composables/useOpportunityStagePagination'

vi.mock('../api', () => ({ opportunitiesApi: { list: vi.fn() } }))

const stages = [
  { id: 'source', name: 'Prospecção', position: 1, is_active: true },
  { id: 'target', name: 'Proposta', position: 2, is_active: true },
  { id: 'other', name: 'Negociação', position: 3, is_active: true },
]
const opportunity = (id: string, stage: string | null) => ({ id, funnel_stage_id: stage, status: 'open' }) as Opportunity
function setup() {
  vi.mocked(opportunitiesApi.list).mockReset()
  const pagination = useOpportunityStagePagination(ref('tenant'), ref(stages), ref<OpportunityFilters>({ status: 'open' }))
  pagination.items.value = [opportunity('first', 'source'), opportunity('moved', 'source'), opportunity('untouched', 'other')]
  pagination.states.value = Object.fromEntries(stages.map(stage => [stage.id, {
    page: stage.id === 'source' ? 2 : 1, lastPage: 3, total: stage.id === 'source' ? 3 : 1, loading: false, error: '',
  }]))
  return pagination
}
const response = (items: Opportunity[], page = 1) => ({ data: items, current_page: page, last_page: 3, total: 3, per_page: 1 })

describe('stage pagination during Kanban movement', () => {
  it('keeps cards mounted while refreshing and discards the refresh if a drag begins', async () => {
    const pagination = setup()
    let resolve!: (value: ReturnType<typeof response>) => void
    vi.mocked(opportunitiesApi.list).mockImplementation(() => new Promise(done => { resolve = done }))
    const before = pagination.items.value
    let dragging = false
    const refresh = pagination.refresh(['target'], () => !dragging)
    expect(pagination.items.value).toBe(before)
    dragging = true
    resolve(response([opportunity('new', 'target')]))
    await refresh
    expect(pagination.items.value).toBe(before)
  })

  it('reconciles all loaded source pages without resetting other columns or hiding the moved card', async () => {
    const pagination = setup()
    const otherState = pagination.states.value.other
    pagination.updateStage('moved', 'target')
    expect(pagination.states.value.source?.total).toBe(2)
    expect(pagination.states.value.target?.total).toBe(2)
    vi.mocked(opportunitiesApi.list).mockImplementation(async (_tenant, filters) => response(
      [opportunity(`${filters?.funnel_stage_id}-${filters?.page}`, filters?.funnel_stage_id ?? null)], filters?.page,
    ))
    await pagination.refresh(['source', 'target'], () => true, 'moved')
    expect(vi.mocked(opportunitiesApi.list).mock.calls.map(([, filters]) => [filters?.funnel_stage_id, filters?.page]))
      .toEqual([['source', 1], ['source', 2], ['target', 1]])
    expect(pagination.states.value.source?.page).toBe(2)
    expect(pagination.states.value.other).toBe(otherState)
    expect(pagination.items.value.find(item => item.id === 'moved')?.funnel_stage_id).toBe('target')
    expect(pagination.items.value.some(item => item.id === 'untouched')).toBe(true)
    expect(pagination.items.value.some(item => item.id === 'source-2')).toBe(true)
  })

  it('does not overwrite a move with an earlier refresh response', async () => {
    const pagination = setup()
    let resolve!: (value: ReturnType<typeof response>) => void
    vi.mocked(opportunitiesApi.list).mockImplementation(() => new Promise(done => { resolve = done }))
    const refresh = pagination.refresh(['target'])
    pagination.updateStage('moved', 'target')
    resolve(response([]))
    await refresh
    expect(pagination.items.value.find(item => item.id === 'moved')?.funnel_stage_id).toBe('target')
  })

  it('counts unassigned opportunities in prospecting when moving them', () => {
    const pagination = setup()
    pagination.items.value = [opportunity('moved', null)]
    pagination.updateStage('moved', 'target')
    expect(pagination.states.value.source?.total).toBe(2)
    expect(pagination.states.value.target?.total).toBe(2)
    pagination.updateStage('moved', null)
    expect(pagination.states.value.source?.total).toBe(3)
    expect(pagination.states.value.target?.total).toBe(1)
  })
})
