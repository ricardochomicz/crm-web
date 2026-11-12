import { onUnmounted, ref } from 'vue'
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
  let pending: { id: string; x: number; y: number; pointerId: number } | null = null

  function canDrag(item: Opportunity, stageName: string): boolean {
    return context.canEdit && !context.busyId && item.status === 'open'
      && !/para correção/i.test(stageName)
  }

  function detach() {
    window.removeEventListener('pointermove', pointerMove)
    window.removeEventListener('pointerup', pointerUp)
    window.removeEventListener('pointercancel', resetDrag)
  }

  function resetDrag() {
    pending = null
    dragging.value = null
    hover.value = null
    detach()
  }

  function stageAt(x: number, y: number): string | null {
    const element = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-kanban-stage]')
    return element?.dataset.kanbanStage || null
  }

  function pointerDown(event: PointerEvent, item: Opportunity, stageName: string) {
    if (event.button !== 0 || !canDrag(item, stageName)) return
    // Buttons and links inside the card retain their normal click behavior.
    if ((event.target as HTMLElement).closest('button, a, input, textarea, select, [role="button"]')) return
    resetDrag()
    pending = { id: item.id, x: event.clientX, y: event.clientY, pointerId: event.pointerId }
    window.addEventListener('pointermove', pointerMove)
    window.addEventListener('pointerup', pointerUp)
    window.addEventListener('pointercancel', resetDrag)
  }

  function pointerMove(event: PointerEvent) {
    if (!pending || event.pointerId !== pending.pointerId) return
    if (!dragging.value && Math.hypot(event.clientX - pending.x, event.clientY - pending.y) < 6) return
    dragging.value = pending.id
    hover.value = stageAt(event.clientX, event.clientY)
  }

  function pointerUp(event: PointerEvent) {
    if (!pending || event.pointerId !== pending.pointerId) return
    const id = dragging.value
    const stageId = stageAt(event.clientX, event.clientY)
    resetDrag()
    if (!id || !stageId || !context.canEdit || context.busyId) return
    const item = context.items.find(candidate => candidate.id === id)
    if (item?.status === 'open' && item.funnel_stage_id !== stageId) onMove(id, stageId)
  }

  onUnmounted(resetDrag)
  return { dragging, hover, canDrag, resetDrag, pointerDown }
}
