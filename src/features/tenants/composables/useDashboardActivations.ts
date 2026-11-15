import { ref, watch, type Ref } from 'vue'
import { ordersApi, type OrderActivationOverview } from '@/features/orders/api'
import { errorMessage } from '@/lib/feedback'
import { useDashboardPeriod, type DashboardPeriod } from './useDashboardPeriod'

/** Activation figures are based on activated order lines, not won opportunities or collected revenue. */
export function useDashboardActivations(
  tenantId: Readonly<Ref<string>>,
  enabled: Readonly<Ref<boolean>>,
  period: Readonly<Ref<DashboardPeriod>>,
) {
  const data = ref<OrderActivationOverview | null>(null)
  const loading = ref(false)
  const error = ref('')
  let version = 0

  const { range, label: periodLabel } = useDashboardPeriod(period)

  async function refresh() {
    const current = ++version
    data.value = null
    error.value = ''
    if (!enabled.value || !tenantId.value) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      const response = await ordersApi.activationOverview(
        tenantId.value,
        range.value.from,
        range.value.to,
      )
      if (current === version) data.value = response.data
    } catch (failure) {
      if (current === version) error.value = errorMessage(failure)
    } finally {
      if (current === version) loading.value = false
    }
  }

  watch([tenantId, enabled, period], () => { void refresh() }, { immediate: true })

  return { data, loading, error, periodLabel, refresh }
}
