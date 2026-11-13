import { onMounted, onUnmounted, watch, type Ref } from 'vue'
import { subscribeCommercialChanged } from '@/services/commercialEvents'
import { subscribeOrders, subscribeCommercialRealtime } from '@/services/realtime/orders'

/** Refresh radar without losing filters, and never keep listeners across tenants. */
export function useCommercialRadarAutoRefresh(
  tenantId: Readonly<Ref<string>>,
  enabled: Readonly<Ref<boolean>>,
  refresh: () => Promise<void>,
) {
  let unsubscribeCommercial: (() => void) | undefined
  let unsubscribeOrders: (() => void) | undefined
  let unsubscribeRealtime: (() => void) | undefined
  let interval: ReturnType<typeof setInterval> | undefined
  let mounted = false
  let pending = false
  let running = false

  async function run() {
    if (!mounted || !enabled.value || typeof document === 'undefined' || document.hidden) return
    if (running) {
      pending = true
      return
    }
    running = true
    try {
      do {
        pending = false
        await refresh()
      } while (pending && mounted && enabled.value && !document.hidden)
    } finally {
      running = false
    }
  }

  function reconnect() {
    unsubscribeOrders?.()
    unsubscribeRealtime?.()
    unsubscribeOrders = undefined
    unsubscribeRealtime = undefined
    if (mounted && enabled.value && tenantId.value) {
      unsubscribeOrders = subscribeOrders(tenantId.value, () => { void run() })
      unsubscribeRealtime = subscribeCommercialRealtime(tenantId.value, () => { void run() })
    }
  }

  function onFocus() { void run() }

  onMounted(() => {
    mounted = true
    unsubscribeCommercial = subscribeCommercialChanged(change => {
      if (change.tenantId === tenantId.value) void run()
    })
    reconnect()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    interval = setInterval(() => { void run() }, 60000)
  })

  watch([tenantId, enabled], reconnect)

  onUnmounted(() => {
    mounted = false
    pending = false
    unsubscribeCommercial?.()
    unsubscribeOrders?.()
    unsubscribeRealtime?.()
    if (interval) clearInterval(interval)
    window.removeEventListener('focus', onFocus)
    document.removeEventListener('visibilitychange', onFocus)
  })
}
