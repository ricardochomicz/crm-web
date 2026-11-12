import { onBeforeUnmount, ref } from 'vue'
import type { Opportunity } from '../api'

type DragContext = { items: Opportunity[]; canEdit: boolean; busyId: string | null }

export function useOpportunityKanbanDrag(
  context: DragContext,
  onMove: (id: string, stageId: string) => void,
  onDragging: (active: boolean) => void = () => {},
) {
  const dragging = ref<string | null>(null)
  const hover = ref<string | null>(null)
  let activeId: string | null = null

  function canDrag(item: Opportunity, stageName: string): boolean {
    return context.canEdit && !context.busyId && item.status === 'open'
      && !/para correção/i.test(stageName)
  }

  function resetDrag() {
    if (activeId) onDragging(false)
    dragging.value = null
    hover.value = null
    activeId = null
  }
  onBeforeUnmount(resetDrag)

  function startDrag(event: DragEvent, item: Opportunity) {
    if (!context.canEdit || context.busyId || item.status !== 'open') {
      event.preventDefault()
      return
    }
    activeId = item.id
    onDragging(true)
    dragging.value = item.id
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', item.id)
      // Keep the browser's native card preview while dragging.
    }
  }

  function overStage(event: DragEvent, stageId: string) {
    // Browsers do not expose dataTransfer.getData() during dragover.
    // The local drag state is the authoritative source until drop.
    if (!activeId || !stageId || !context.canEdit || context.busyId) return
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
    const id = activeId || event.dataTransfer?.getData('text/plain')
    resetDrag()
    if (!id || !stageId || !context.canEdit || context.busyId) return
    const item = context.items.find(candidate => candidate.id === id)
    if (item?.status === 'open' && item.funnel_stage_id !== stageId) onMove(id, stageId)
  }

  return { dragging, hover, canDrag, resetDrag, startDrag, overStage, leaveStage, drop }
}
