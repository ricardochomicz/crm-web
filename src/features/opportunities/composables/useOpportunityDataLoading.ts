import { type Ref } from 'vue'
import { errorMessage } from '@/lib/feedback'
import type { OpportunityViewMode } from './useOpportunityViewNavigation'

interface Dependencies {
  viewMode: Readonly<Ref<OpportunityViewMode>>
  loading: Ref<boolean>
  error: Ref<string>
  total: Ref<number>
  invalidateList: () => unknown
  loadList: () => Promise<void>
  resetKanban: () => Promise<void>
  kanbanTotal: Readonly<Ref<number>>
}

/** Coordinates view loading without owning list queries or stage pagination. */
export function useOpportunityDataLoading(deps: Dependencies) {
  let version = 0
  const getVersion = () => version
  const invalidateRefresh = () => { ++version }

  async function loadList() {
    ++version
    await deps.loadList()
  }

  async function loadKanban() {
    deps.invalidateList()
    const current = ++version
    deps.loading.value = true
    deps.error.value = ''
    try {
      await deps.resetKanban()
      if (current !== version) return
      deps.total.value = deps.kanbanTotal.value
    } catch (e) {
      if (current === version) deps.error.value = errorMessage(e)
    } finally {
      if (current === version) deps.loading.value = false
    }
  }

  function reload() {
    if (deps.viewMode.value === 'kanban') void loadKanban()
    else void loadList()
  }

  return { reload, getVersion, invalidateRefresh }
}
