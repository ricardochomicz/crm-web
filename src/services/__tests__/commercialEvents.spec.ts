import { describe, expect, it, vi } from 'vitest'
import { publishCommercialChanged, subscribeCommercialChanged } from '../commercialEvents'

describe('commercialEvents', () => {
  it('delivers tenant-scoped change details', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeCommercialChanged(listener)
    publishCommercialChanged({ tenantId: 'tenant-a', kind: 'opportunity' })
    expect(listener).toHaveBeenCalledWith({ tenantId: 'tenant-a', kind: 'opportunity' })
    unsubscribe()
    publishCommercialChanged({ tenantId: 'tenant-a', kind: 'activity' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('ignores malformed notifications', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeCommercialChanged(listener)
    window.dispatchEvent(new CustomEvent('commercial:changed', { detail: { kind: 'order' } }))
    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })
})
