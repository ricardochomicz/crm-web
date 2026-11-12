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

  function state(stageId: string): StagePage {
    return states.value[stageId] ?? { page: 0, lastPage: 1, total: 0, loading: false, error: '' }
  }

  const total = computed(() => Object.values(states.value).reduce((sum, stage) => sum + stage.total, 0))

  async function fetchStage(stage: FunnelStage, reset = false) {
    const previous = state(stage.id)
    if (previous.loading || (!reset && previous.page >= previous.lastPage)) return
    const generationAtStart = generation
    const tenant = tenantId.value
    const next = reset ? 1 : previous.page + 1
    states.value = { ...states.value, [stage.id]: { ...previous, loading: true, error: '' } }
    try {
      const response = await opportunitiesApi.list(tenant, {
        ...filters.value,
        funnel_stage_id: stage.id,
        include_unassigned: /prospec/i.test(stage.name),
        page: next,
      })
      if (generationAtStart !== generation || tenant !== tenantId.value) return
      const existing = reset ? items.value.filter(item => item.funnel_stage_id !== stage.id && !(item.funnel_stage_id === null && /prospec/i.test(stage.name))) : items.value
      const seen = new Set(existing.map(item => item.id))
      items.value = [...existing, ...response.data.filter(item => !seen.has(item.id))]
      states.value = { ...states.value, [stage.id]: {
        page: response.current_page, lastPage: response.last_page, total: response.total, loading: false, error: '',
      } }
    } catch {
      if (generationAtStart === generation) {
        states.value = { ...states.value, [stage.id]: { ...previous, loading: false, error: 'Não foi possível carregar esta etapa.' } }
      }
    }
  }

  async function reset() {
    generation++
    items.value = []
    states.value = {}
    loading.value = true
    try {
      await Promise.all(stages.value.filter(stage => stage.is_active).map(stage => fetchStage(stage, true)))
    } finally {
      loading.value = false
    }
  }

  function loadMore(stageId: string) {
    const stage = stages.value.find(candidate => candidate.id === stageId)
    if (stage) void fetchStage(stage)
  }

  function updateStage(id: string, stageId: string | null) {
    const item = items.value.find(candidate => candidate.id === id)
    if (!item || item.funnel_stage_id === stageId) return
    const previousId = item.funnel_stage_id
    items.value = items.value.map(candidate => candidate.id === id ? { ...candidate, funnel_stage_id: stageId } : candidate)
    const previousStage = previousId ? states.value[previousId] : undefined
    const nextStage = stageId ? states.value[stageId] : undefined
    states.value = {
      ...states.value,
      ...(previousStage && previousId ? { [previousId]: { ...previousStage, total: Math.max(0, previousStage.total - 1) } } : {}),
      ...(nextStage && stageId ? { [stageId]: { ...nextStage, total: nextStage.total + 1 } } : {}),
    }
  }

  return { items, states, state, total, loading, reset, loadMore, updateStage }
}
