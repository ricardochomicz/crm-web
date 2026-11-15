import { computed, ref, watch, type Ref } from 'vue'
import { ordersApi, type OrderActivationOverview } from '@/features/orders/api'
import { errorMessage } from '@/lib/feedback'

/** Activation figures are based on activated order lines, not won opportunities or collected revenue. */
export function useDashboardActivations(
  tenantId: Readonly<Ref<string>>,
  enabled: Readonly<Ref<boolean>>,
) {
  const data = ref<OrderActivationOverview | null>(null)
  const loading = ref(false)
  const error = ref('')
  let version = 0

  const monthLabel = computed(() => new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date()))

  async function refresh() {
    const current = ++version
    data.value = null
    error.value = ''
    if (!enabled.value || !tenantId.value) {
      loading.value = false
      return
    }
    loading.value = true
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    try {
      const response = await ordersApi.activationOverview(
        tenantId.value,
        `${year}-${month}-01`,
        `${year}-${month}-${day}`,
      )
      if (current === version) data.value = response.data
    } catch (failure) {
      if (current === version) error.value = errorMessage(failure)
    } finally {
      if (current === version) loading.value = false
    }
  }

  watch([tenantId, enabled], () => { void refresh() }, { immediate: true })

  return { data, loading, error, monthLabel, refresh }
}
