import { onMounted, onUnmounted, watch, type Ref } from 'vue'
import { opportunitiesApi, type FunnelStage } from '../api'
import { subscribeOrders } from '@/services/realtime/orders'

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
  let timer: ReturnType<typeof setInterval> | undefined
  let refreshing = false

  async function refresh() {
    if (refreshing || context.loading.value || document.hidden ||
      context.movingId.value || context.draggingOpportunity.value || context.dialogOpen.value) return
    refreshing = true
    try {
      const tenant = context.tenantId.value
      const version = context.version()
      const [stageResult] = await Promise.all([
        opportunitiesApi.stages(tenant),
        context.refreshRows(tenant, version),
      ])
      if (tenant === context.tenantId.value && version === context.version() &&
        !context.draggingOpportunity.value && !context.movingId.value) {
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
    unsubscribe?.()
    unsubscribe = subscribeOrders(context.tenantId.value, () => { void refresh() })
  }

  onMounted(() => {
    reconnect()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    timer = setInterval(refresh, 60000)
  })
  onUnmounted(() => {
    unsubscribe?.()
    if (timer) clearInterval(timer)
    window.removeEventListener('focus', refresh)
    document.removeEventListener('visibilitychange', refresh)
  })
  watch(context.tenantId, reconnect)
}
