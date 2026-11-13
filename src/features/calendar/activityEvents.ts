import { publishCommercialChanged, subscribeCommercialChanged } from '@/services/commercialEvents'

/** Notify other mounted views that calendar data changed successfully. */
export const ACTIVITY_CHANGED_EVENT = 'calendar:activity-changed'

export function publishActivityChanged(tenantId: string) {
  publishCommercialChanged({ tenantId, kind: 'activity' })
}

export function subscribeActivityChanged(handler: (tenantId: string) => void) {
  return subscribeCommercialChanged(change => {
    if (change.kind === 'activity') handler(change.tenantId)
  })
}
