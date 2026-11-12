import { ref, type Ref } from 'vue'
import { opportunitiesApi, type FunnelStage, type Opportunity } from '../api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'

type StagePagination = {
  updateStage: (id: string, stageId: string | null) => void
  refresh: (stageIds?: string[], canApply?: () => boolean, retainedId?: string) => Promise<void>
  total: Readonly<Ref<number>>
}

type MovementContext = {
  tenantId: Readonly<Ref<string>>
  canEdit: Readonly<Ref<boolean>>
  stages: Readonly<Ref<FunnelStage[]>>
  items: Readonly<Ref<Opportunity[]>>
  pagination: StagePagination
  updateTotal: (total: number) => void
}

/** Owns optimistic stage changes and scoped reconciliation without resetting the board. */
export function useOpportunityStageMovement(context: MovementContext) {
  const movingId = ref<string | null>(null)

  async function moveStage(id: string, stageId: string) {
    if (!context.canEdit.value || movingId.value || !stageId) return
    const item = context.items.value.find(candidate => candidate.id === id)
    if (!item || item.funnel_stage_id === stageId) return

    const tenant = context.tenantId.value
    const previousStageId = item.funnel_stage_id
    const setStage = (nextStageId: string | null) => context.pagination.updateStage(id, nextStageId)

    movingId.value = id
    setStage(stageId)
    try {
      const result = await opportunitiesApi.moveStage(tenant, id, stageId)
      if (tenant !== context.tenantId.value) return
      setStage(result.data.funnel_stage_id)
      toast.success('Etapa atualizada.')

      const sourceStageId = previousStageId ?? context.stages.value.find(stage => /prospec/i.test(stage.name))?.id
      const affectedStageIds = [...new Set(
        [sourceStageId, result.data.funnel_stage_id].filter((value): value is string => !!value),
      )]
      try {
        await context.pagination.refresh(affectedStageIds, () => tenant === context.tenantId.value, id)
        context.updateTotal(context.pagination.total.value)
      } catch {
        // The move is persisted: retain the optimistic board if reconciliation fails.
      }
    } catch (e) {
      if (tenant === context.tenantId.value) {
        setStage(previousStageId)
        toast.error(errorMessage(e))
      }
    } finally {
      movingId.value = null
    }
  }

  return { movingId, moveStage }
}
