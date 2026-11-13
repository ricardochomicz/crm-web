import { onMounted, onUnmounted, watch, type Ref } from 'vue'
import { opportunitiesApi, type FunnelStage } from '../api'
import { subscribeOrders, subscribeCommercialRealtime } from '@/services/realtime/orders'

type SyncContext = {
  tenantId: Readonly<Ref<string>>
  stages: Ref<FunnelStage[]>
  loading: Readonly<Ref<boolean>>
  movingId: Readonly<Ref<string | null>>
  draggingOpportunity: Readonly<Ref<boolean>>
  dialogOpen: Readonly<Ref<boolean>>
  version: () => number
  refreshRows: (tenantId: string, version: number) => Promise<void>
  refreshOverview: () => void
}

export function useOpportunityRealtimeSync(context: SyncContext) {
  let unsubscribe: (() => void) | undefined
  let unsubscribeCommercial: (() => void) | undefined
  let timer: ReturnType<typeof setInterval> | undefined
  let refreshing = false
  let mounted = false
  let refreshGeneration = 0

  const canApply = (tenant: string, version: number, generation: number) =>
    mounted && generation === refreshGeneration && tenant === context.tenantId.value &&
    version === context.version() && !context.loading.value &&
    !context.draggingOpportunity.value && !context.movingId.value && !context.dialogOpen.value

  async function refresh() {
    if (refreshing || context.loading.value || document.hidden ||
      context.movingId.value || context.draggingOpportunity.value || context.dialogOpen.value) return
    refreshing = true
    const tenant = context.tenantId.value
    const version = context.version()
    const generation = refreshGeneration
    try {
      const [stageResult] = await Promise.all([
        opportunitiesApi.stages(tenant),
        context.refreshRows(tenant, version),
      ])
      if (canApply(tenant, version, generation)) {
        context.stages.value = stageResult.data
        context.refreshOverview()
      }
    } catch {
      // Transient API or connection errors must not discard the current board.
    } finally {
      refreshing = false
    }
  }

  function reconnect() {
    ++refreshGeneration
    if (!mounted) return
    unsubscribe?.()
    unsubscribeCommercial?.()
    unsubscribeCommercial = subscribeCommercialRealtime(context.tenantId.value, () => { void refresh() })
    unsubscribe = subscribeOrders(context.tenantId.value, () => { void refresh() })
  }

  onMounted(() => {
    mounted = true
    reconnect()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    timer = setInterval(refresh, 60000)
  })
  onUnmounted(() => {
    mounted = false
    ++refreshGeneration
    unsubscribe?.()
    unsubscribeCommercial?.()
    unsubscribeCommercial = undefined
    unsubscribe = undefined
    if (timer) clearInterval(timer)
    window.removeEventListener('focus', refresh)
    document.removeEventListener('visibilitychange', refresh)
  })
  watch(context.tenantId, reconnect)
}
