import { type Ref } from 'vue'
import type { OpportunityViewMode } from './useOpportunityViewNavigation'

interface Dependencies {
  tenantId: Readonly<Ref<string>>
  viewMode: Readonly<Ref<OpportunityViewMode>>
  dragging: Readonly<Ref<boolean>>
  movingId: Readonly<Ref<string | null>>
  dialogOpen: Readonly<Ref<boolean>>
  version: () => number
  refreshList: (tenant: string, canApply: () => boolean) => Promise<void>
  refreshKanban: (canApply: () => boolean) => Promise<void>
  syncKanbanTotal: () => void
}

/** Applies background updates only while the original tenant, view and interaction remain valid. */
export function useOpportunitySilentRefresh(deps: Dependencies) {
  async function refreshRows(tenant: string, version: number) {
    const mode = deps.viewMode.value
    const canApply = () =>
      tenant === deps.tenantId.value &&
      version === deps.version() &&
      deps.viewMode.value === mode &&
      !deps.dragging.value &&
      !deps.movingId.value &&
      !deps.dialogOpen.value

    if (mode === 'list') {
      await deps.refreshList(tenant, canApply)
      return
    }

    await deps.refreshKanban(canApply)
    if (canApply()) deps.syncKanbanTotal()
  }

  return { refreshRows }
}
