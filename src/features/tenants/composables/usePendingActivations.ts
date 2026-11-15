import { ref, watch, type Ref } from 'vue'
import { ordersApi, type PendingActivationOverview } from '@/features/orders/api'
import { errorMessage } from '@/lib/feedback'

export function usePendingActivations(tenantId: Readonly<Ref<string>>, enabled: Readonly<Ref<boolean>>) {
  const data = ref<PendingActivationOverview | null>(null)
  const loading = ref(false)
  const error = ref('')
  let version = 0

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
      const response = await ordersApi.pendingActivationOverview(tenantId.value)
      if (current === version) data.value = response.data
    } catch (failure) {
      if (current === version) error.value = errorMessage(failure)
    } finally {
      if (current === version) loading.value = false
    }
  }

  watch([tenantId, enabled], () => { void refresh() }, { immediate: true })
  return { data, loading, error, refresh }
}
