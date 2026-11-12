import { ref } from 'vue'
import type { Opportunity } from '../api'

type DragContext = {
  items: Opportunity[]
  canEdit: boolean
  busyId: string | null
}

export function useOpportunityKanbanDrag(
  context: DragContext,
  onMove: (id: string, stageId: string) => void,
) {
  const dragging = ref<string | null>(null)
  const hover = ref<string | null>(null)

  function canDrag(item: Opportunity, stageName: string): boolean {
    return context.canEdit && !context.busyId && item.status === 'open'
      && !/para correção/i.test(stageName)
  }

  function resetDrag() {
    dragging.value = null
    hover.value = null
  }

  function startDrag(event: DragEvent, item: Opportunity) {
    if (!context.canEdit || context.busyId || item.status !== 'open') {
      event.preventDefault()
      return
    }
    dragging.value = item.id
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', item.id)
    }
  }

  function overStage(event: DragEvent, stageId: string) {
    const draggedId = dragging.value || event.dataTransfer?.getData('text/plain')
    if (!context.canEdit || context.busyId || !draggedId || !stageId) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    hover.value = stageId
  }

  function leaveStage(event: DragEvent, stageId: string) {
    const current = event.currentTarget as HTMLElement | null
    const next = event.relatedTarget as Node | null
    if (hover.value === stageId && (!next || !current?.contains(next))) hover.value = null
  }

  function drop(event: DragEvent, stageId: string) {
    event.preventDefault()
    const draggedId = dragging.value || event.dataTransfer?.getData('text/plain')
    resetDrag()
    if (!draggedId || !stageId || !context.canEdit || context.busyId) return
    const item = context.items.find(candidate => candidate.id === draggedId)
    if (item?.status === 'open' && item.funnel_stage_id !== stageId) {
      onMove(item.id, stageId)
    }
  }

  return { dragging, hover, canDrag, resetDrag, startDrag, overStage, leaveStage, drop }
}
