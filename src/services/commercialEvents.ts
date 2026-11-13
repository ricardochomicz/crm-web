/**
 * Local, tenant-scoped domain notifications.
 * Only publish after a mutation has been persisted successfully.
 * This is an in-tab event bus, not a cross-user realtime transport.
 */
export type CommercialChangeKind = 'opportunity' | 'activity' | 'order'
export type CommercialChange = { tenantId: string; kind: CommercialChangeKind }

export const COMMERCIAL_CHANGED_EVENT = 'commercial:changed'

export function publishCommercialChanged(change: CommercialChange): void {
  if (typeof window === 'undefined' || !change.tenantId) return
  window.dispatchEvent(new CustomEvent<CommercialChange>(COMMERCIAL_CHANGED_EVENT, {
    detail: change,
  }))
}

export function subscribeCommercialChanged(
  handler: (change: CommercialChange) => void,
): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (event: Event) => {
    const change = (event as CustomEvent<CommercialChange>).detail
    if (!change?.tenantId || !['opportunity', 'activity', 'order'].includes(change.kind)) return
    handler(change)
  }
  window.addEventListener(COMMERCIAL_CHANGED_EVENT, listener)
  return () => window.removeEventListener(COMMERCIAL_CHANGED_EVENT, listener)
}
