import { computed, ref, type Ref } from 'vue'
import { opportunitiesApi, type FunnelStage, type Opportunity, type OpportunityFilters } from '../api'

type StagePage = { page: number; lastPage: number; total: number; loading: boolean; error: string }

export function useOpportunityStagePagination(
  tenantId: Ref<string>,
  stages: Ref<FunnelStage[]>,
  filters: Ref<OpportunityFilters>,
) {
  const items = ref<Opportunity[]>([])
  const states = ref<Record<string, StagePage>>({})
  const loading = ref(false)
  let generation = 0
  let mutationVersion = 0

  function state(stageId: string): StagePage {
    return states.value[stageId] ?? { page: 0, lastPage: 1, total: 0, loading: false, error: '' }
  }

  const total = computed(() => Object.values(states.value).reduce((sum, stage) => sum + stage.total, 0))

  async function fetchStage(stage: FunnelStage, reset = false) {
    const previous = state(stage.id)
    if (previous.loading || (!reset && previous.page >= previous.lastPage)) return
    const generationAtStart = generation
    const mutationAtStart = mutationVersion
    const tenant = tenantId.value
    const requestFilters = { ...filters.value }
    const next = reset ? 1 : previous.page + 1
    states.value = { ...states.value, [stage.id]: { ...previous, loading: true, error: '' } }
    try {
      const response = await opportunitiesApi.list(tenant, {
        ...requestFilters,
        funnel_stage_id: stage.id,
        include_unassigned: /prospec/i.test(stage.name),
        page: next,
      })
      if (generationAtStart !== generation || tenant !== tenantId.value) return
      if (mutationAtStart !== mutationVersion) {
        states.value = { ...states.value, [stage.id]: { ...state(stage.id), loading: false } }
        return
      }
      const existing = reset ? items.value.filter(item => item.funnel_stage_id !== stage.id && !(item.funnel_stage_id === null && /prospec/i.test(stage.name))) : items.value
      const seen = new Set(existing.map(item => item.id))
      items.value = [...existing, ...response.data.filter(item => !seen.has(item.id))]
      states.value = { ...states.value, [stage.id]: {
        page: response.current_page, lastPage: response.last_page, total: response.total, loading: false, error: '',
      } }
    } catch {
      if (generationAtStart === generation && tenant === tenantId.value && mutationAtStart === mutationVersion) {
        states.value = { ...states.value, [stage.id]: { ...state(stage.id), loading: false, error: 'Não foi possível carregar esta etapa.' } }
      }
    }
  }

  async function reset() {
    const currentGeneration = ++generation
    items.value = []
    states.value = {}
    loading.value = true
    try {
      await Promise.all(stages.value.filter(stage => stage.is_active).map(stage => fetchStage(stage, true)))
    } finally {
      if (currentGeneration === generation) loading.value = false
    }
  }

  function loadMore(stageId: string) {
    const stage = stages.value.find(candidate => candidate.id === stageId)
    if (stage?.is_active) void fetchStage(stage)
  }

  async function refresh(stageIds = stages.value.filter(stage => stage.is_active).map(stage => stage.id), canApply = () => true, retainedId?: string) {
    const generationAtStart = generation
    const mutationAtStart = mutationVersion
    const tenant = tenantId.value
    const requestFilters = { ...filters.value }
    const results = await Promise.all(stageIds.map(async stageId => {
      const stage = stages.value.find(candidate => candidate.id === stageId)
      if (!stage) return null
      const loadedPage = state(stageId).page
      const pages = await Promise.all(Array.from({ length: Math.max(1, loadedPage) }, (_, index) =>
        opportunitiesApi.list(tenant, {
          ...requestFilters, funnel_stage_id: stageId, include_unassigned: /prospec/i.test(stage.name), page: index + 1,
        }),
      ))
      return { stage, pages, loadedPage }
    }))
    if (generationAtStart !== generation || mutationAtStart !== mutationVersion || tenant !== tenantId.value || !canApply()) return
    if (results.some(result => result && state(result.stage.id).page !== result.loadedPage)) return
    const refreshedIds = new Set(stageIds)
    const retained = items.value.find(item => item.id === retainedId)
    const nextItems = items.value.filter(item => !refreshedIds.has(item.funnel_stage_id ?? stages.value.find(stage => /prospec/i.test(stage.name))?.id ?? ''))
    const nextStates = { ...states.value }
    for (const result of results) {
      if (!result) continue
      const first = result.pages[0]!
      nextItems.push(...result.pages.flatMap(page => page.data))
      nextStates[result.stage.id] = {
        page: Math.min(result.pages.length, first.last_page), lastPage: first.last_page,
        total: first.total, loading: false, error: '',
      }
    }
    if (retained && !nextItems.some(item => item.id === retained.id)) nextItems.push(retained)
    items.value = [...new Map(nextItems.map(item => [item.id, item])).values()]
    states.value = nextStates
  }

  function updateStage(id: string, stageId: string | null) {
    const item = items.value.find(candidate => candidate.id === id)
    if (!item || item.funnel_stage_id === stageId) return
    mutationVersion++
    const previousId = item.funnel_stage_id ?? stages.value.find(stage => /prospec/i.test(stage.name))?.id
    const nextId = stageId ?? stages.value.find(stage => /prospec/i.test(stage.name))?.id
    items.value = items.value.map(candidate => candidate.id === id ? { ...candidate, funnel_stage_id: stageId } : candidate)
    const previousStage = previousId ? states.value[previousId] : undefined
    const nextStage = nextId ? states.value[nextId] : undefined
    if (previousId === nextId) return
    states.value = {
      ...states.value,
      ...(previousStage && previousId ? { [previousId]: { ...previousStage, total: Math.max(0, previousStage.total - 1) } } : {}),
      ...(nextStage && nextId ? { [nextId]: { ...nextStage, total: nextStage.total + 1 } } : {}),
    }
  }

  return { items, states, state, total, loading, reset, refresh, loadMore, updateStage }
}
