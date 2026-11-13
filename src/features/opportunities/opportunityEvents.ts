import { publishCommercialChanged, subscribeCommercialChanged } from '@/services/commercialEvents'

/** Local notification for successful opportunity mutations in this browser tab. */
export const OPPORTUNITY_CHANGED_EVENT = 'commercial:opportunity-changed'

export function publishOpportunityChanged(tenantId: string): void {
  if (typeof window === 'undefined') return
  publishCommercialChanged({ tenantId, kind: 'opportunity' })
}

export function subscribeOpportunityChanged(handler: (tenantId: string) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  return subscribeCommercialChanged(change => {
    if (change.kind === 'opportunity') handler(change.tenantId)
  })
}
