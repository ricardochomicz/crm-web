/** Notify other mounted views that calendar data changed successfully. */
export const ACTIVITY_CHANGED_EVENT = 'calendar:activity-changed'

export function publishActivityChanged(tenantId: string) {
  window.dispatchEvent(new CustomEvent(ACTIVITY_CHANGED_EVENT, { detail: { tenantId } }))
}

export function subscribeActivityChanged(handler: (tenantId: string) => void) {
  const listener = (event: Event) => {
    const tenantId = (event as CustomEvent<{ tenantId?: string }>).detail?.tenantId
    if (tenantId) handler(tenantId)
  }
  window.addEventListener(ACTIVITY_CHANGED_EVENT, listener)
  return () => window.removeEventListener(ACTIVITY_CHANGED_EVENT, listener)
}
