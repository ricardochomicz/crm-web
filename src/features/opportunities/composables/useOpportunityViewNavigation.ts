import { type Ref } from 'vue'
import { opportunitiesApi, type FunnelStage } from '../api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

export type OpportunitySection = 'open' | 'closed'
export type OpportunityViewMode = 'list' | 'kanban'

interface Dependencies {
  tenantId: Readonly<Ref<string>>
  section: Ref<OpportunitySection>
  viewMode: Ref<OpportunityViewMode>
  stages: Ref<FunnelStage[]>
  resetSection: (section: OpportunitySection) => void
  reload: () => void
}

/** Keeps navigation and stage lookups out of the page orchestrator. */
export function useOpportunityViewNavigation(deps: Dependencies) {
  let stageRequest = 0

  async function ensureStages(force = false) {
    if (!force && deps.stages.value.length > 0) return
    const current = ++stageRequest
    const tenant = deps.tenantId.value
    try {
      const result = await opportunitiesApi.stages(tenant)
      if (current !== stageRequest || tenant !== deps.tenantId.value) return
      deps.stages.value = result.data
    } catch (e) {
      if (current === stageRequest && tenant === deps.tenantId.value) toast.error(errorMessage(e))
    }
  }

  function switchSection(next: OpportunitySection) {
    deps.section.value = next
    deps.resetSection(next)
    deps.viewMode.value = next === 'closed' ? 'list' : 'kanban'
    if (next === 'open') void ensureStages()
    deps.reload()
  }

  async function changeView(mode: OpportunityViewMode) {
    deps.viewMode.value = mode
    if (mode === 'kanban') await ensureStages(true)
    deps.reload()
  }

  return { switchSection, changeView }
}
