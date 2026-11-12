import { ref, watch, type Ref } from 'vue'
import { ordersApi, type CommercialOrder } from '@/features/orders/api'

export function useClientOrderHistory(
  tenantId: Readonly<Ref<string>>,
  clientId: Readonly<Ref<string | null>>,
  enabled: Readonly<Ref<boolean>>,
) {
  const orders = ref<CommercialOrder[]>([])
  const loading = ref(false)
  const error = ref('')
  const selectedOrder = ref<CommercialOrder | null>(null)
  const detailLoading = ref(false)
  const detailError = ref('')
  let version = 0
  let detailVersion = 0

  async function load() {
    const tenant = tenantId.value
    const client = clientId.value
    if (!enabled.value || !client) return

    const requestVersion = ++version
    loading.value = true
    error.value = ''

    try {
      const response = await ordersApi.list(tenant)
      if (requestVersion !== version) return
      orders.value = response.data
        .filter((order) => order.client_id === client)
        .sort((a, b) => (b.created_at ?? b.sold_on ?? '').localeCompare(a.created_at ?? a.sold_on ?? ''))
    } catch (failure) {
      if (requestVersion === version) {
        error.value = failure instanceof Error ? failure.message : 'Não foi possível carregar os pedidos.'
      }
    } finally {
      if (requestVersion === version) loading.value = false
    }
  }

  async function openDetails(order: CommercialOrder) {
    const tenant = tenantId.value
    const requestVersion = ++detailVersion
    selectedOrder.value = order
    detailLoading.value = true
    detailError.value = ''

    try {
      const response = await ordersApi.show(tenant, order.id)
      if (requestVersion === detailVersion) selectedOrder.value = response.data
    } catch (failure) {
      if (requestVersion === detailVersion) {
        detailError.value = failure instanceof Error ? failure.message : 'Não foi possível carregar os detalhes.'
      }
    } finally {
      if (requestVersion === detailVersion) detailLoading.value = false
    }
  }

  function closeDetails() {
    ++detailVersion
    selectedOrder.value = null
    detailError.value = ''
    detailLoading.value = false
  }

  watch([tenantId, clientId, enabled], () => {
    ++version
    orders.value = []
    error.value = ''
    loading.value = false
    closeDetails()
    if (enabled.value && clientId.value) void load()
  }, { immediate: true })

  return {
    orders,
    loading,
    error,
    selectedOrder,
    detailLoading,
    detailError,
    load,
    openDetails,
    closeDetails,
  }
}
