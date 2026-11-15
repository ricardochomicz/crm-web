import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { useDashboardActivations } from '../composables/useDashboardActivations'
import { useDashboardConsultants } from '../composables/useDashboardConsultants'
import { usePendingActivations } from '../composables/usePendingActivations'
import { ordersApi } from '@/features/orders/api'
import { productivityApi } from '@/features/productivity/api'

vi.mock('@/features/orders/api', () => ({
  ordersApi: { activationOverview: vi.fn(), pendingActivationOverview: vi.fn() },
}))
vi.mock('@/features/productivity/api', () => ({
  productivityApi: { overview: vi.fn() },
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

afterEach(() => { vi.resetAllMocks() })

describe('dashboard asynchronous state', () => {
  it('ignores activation responses from a previous tenant', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    vi.mocked(ordersApi.activationOverview)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const tenantId = ref('tenant-a')
    const enabled = ref(true)
    const period = ref<'month' | 'quarter'>('month')
    const scope = effectScope()
    const state = scope.run(() => useDashboardActivations(tenantId, enabled, period))!
    await nextTick()
    tenantId.value = 'tenant-b'
    await nextTick()
    second.resolve({ data: { marker: 'new' } })
    await flushPromises()
    first.resolve({ data: { marker: 'old' } })
    await flushPromises()
    expect((state.data.value as any)?.marker).toBe('new')
    expect(state.loading.value).toBe(false)
    scope.stop()
  })

  it('invalidates productivity results when the period changes', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    vi.mocked(productivityApi.overview)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const tenantId = ref('tenant-a')
    const enabled = ref(true)
    const period = ref<'month' | 'quarter'>('month')
    const scope = effectScope()
    const state = scope.run(() => useDashboardConsultants(tenantId, enabled, period))!
    await nextTick()
    period.value = 'quarter'
    await nextTick()
    second.resolve({ data: [{ id: 'new', name: 'Novo', orders: 2, monthly_amount: 50, opportunities: 1 }] })
    await flushPromises()
    first.resolve({ data: [{ id: 'old', name: 'Antigo', orders: 10, monthly_amount: 500, opportunities: 3 }] })
    await flushPromises()
    expect(state.consultants.value.map(row => row.value)).toEqual(['new'])
    expect(state.totals.value.orders).toBe(2)
    scope.stop()
  })

  it('does not display pending activations after the section is disabled', async () => {
    const pending = deferred<any>()
    vi.mocked(ordersApi.pendingActivationOverview).mockReturnValueOnce(pending.promise)
    const tenantId = ref('tenant-a')
    const enabled = ref(true)
    const scope = effectScope()
    const state = scope.run(() => usePendingActivations(tenantId, enabled))!
    await nextTick()
    enabled.value = false
    await nextTick()
    pending.resolve({ data: { marker: 'stale' } })
    await flushPromises()
    expect(state.data.value).toBeNull()
    expect(state.loading.value).toBe(false)
    scope.stop()
  })

  it('ignores responses after the component scope is disposed', async () => {
    const pending = deferred<any>()
    vi.mocked(ordersApi.pendingActivationOverview).mockReturnValueOnce(pending.promise)
    const scope = effectScope()
    const state = scope.run(() => usePendingActivations(ref('tenant-a'), ref(true)))!
    await nextTick()
    scope.stop()
    pending.resolve({ data: { marker: 'stale' } })
    await flushPromises()
    expect(state.data.value).toBeNull()
  })
})
