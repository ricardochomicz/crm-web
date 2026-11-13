import { watch, type Ref } from 'vue'
import { errorMessage } from '@/lib/feedback'

type Section = 'open' | 'closed'
type ViewMode = 'list' | 'kanban'

interface OpportunityPageLifecycleDependencies {
  tenantId: Readonly<Ref<string>>
  section: Ref<Section>
  viewMode: Ref<ViewMode>
  page: Ref<number>
  error: Ref<string>
  invalidate: () => unknown
  resetSection: (section: Section) => void
  clearReferenceData: () => void
  loadReferenceData: () => Promise<void>
  reload: () => void
  invalidateRefresh: () => void
}

/** Resets tenant-scoped page state and loads reference data when the tenant changes. */
export function useOpportunityPageLifecycle(deps: OpportunityPageLifecycleDependencies) {
  async function setup() {
    try {
      await deps.loadReferenceData()
    } catch (e) {
      deps.error.value = errorMessage(e)
    }
  }

  watch(deps.tenantId, () => {
    deps.invalidateRefresh()
    deps.invalidate()
    deps.section.value = 'open'
    deps.resetSection('open')
    deps.viewMode.value = 'kanban'
    deps.clearReferenceData()
    deps.page.value = 1
    void setup()
    deps.reload()
  }, { immediate: true })
}
