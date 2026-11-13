/** Local notification for successful opportunity mutations in this browser tab. */
export const OPPORTUNITY_CHANGED_EVENT = 'commercial:opportunity-changed'

export function publishOpportunityChanged(tenantId: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPPORTUNITY_CHANGED_EVENT, { detail: { tenantId } }))
}

export function subscribeOpportunityChanged(handler: (tenantId: string) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (event: Event) => {
    const id = (event as CustomEvent<{ tenantId?: string }>).detail?.tenantId
    if (id) handler(id)
  }
  window.addEventListener(OPPORTUNITY_CHANGED_EVENT, listener)
  return () => window.removeEventListener(OPPORTUNITY_CHANGED_EVENT, listener)
}
