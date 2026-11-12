import { ref, watch, type Ref } from 'vue'
import { clientsApi, type ConsolidationOptions } from '../api'

type Order = ConsolidationOptions['data']['orders'][number]

export function useContractConsolidation(
  tenantId: Readonly<Ref<string>>,
  clientId: Readonly<Ref<string | null>>,
  open: Readonly<Ref<boolean>>,
) {
  const data = ref<ConsolidationOptions['data']>({ orders: [], contracts: [] })
  const selections = ref<Record<string, string>>({})
  const busyOrderId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref('')
  const success = ref('')
  let requestVersion = 0

  function contractOptions(order: Order) {
    return [
      { value: '', label: 'Criar um novo contrato' },
      ...data.value.contracts
        .filter(
          (contract) =>
            contract.operator_id === order.operator_id &&
            (!order.classification_id ||
              !contract.classification_id ||
              contract.classification_id === order.classification_id),
        )
        .map((contract) => ({
          value: contract.id,
          label: `Contrato ${contract.id.slice(0, 8)} · ${contract.operator_name ?? 'Operadora'} · ${contract.renewal_policy === 'WEIGHTED_AVERAGE' ? 'Média ponderada' : 'Regra pendente'}`,
        })),
    ]
  }

  async function load() {
    const id = clientId.value
    const tenant = tenantId.value
    if (!open.value || !id) return

    const version = ++requestVersion
    loading.value = true
    error.value = ''

    try {
      const response = await clientsApi.consolidationOptions(tenant, id)
      if (version !== requestVersion || !open.value) return
      data.value = response.data
    } catch (failure) {
      if (version !== requestVersion || !open.value) return
      error.value = failure instanceof Error ? failure.message : 'Erro ao carregar pedidos.'
    } finally {
      if (version === requestVersion) loading.value = false
    }
  }

  async function consolidate(orderId: string): Promise<boolean> {
    const id = clientId.value
    const tenant = tenantId.value
    if (!id || !open.value || busyOrderId.value || loading.value) return false

    busyOrderId.value = orderId
    error.value = ''
    success.value = ''

    try {
      await clientsApi.consolidate(
        tenant,
        id,
        orderId,
        selections.value[orderId] || undefined,
      )
      if (id !== clientId.value || tenant !== tenantId.value || !open.value) return false

      delete selections.value[orderId]
      success.value = 'Pedido vinculado ao contrato com sucesso.'
      await load()
      return true
    } catch (failure) {
      if (id === clientId.value && tenant === tenantId.value && open.value) {
        error.value = failure instanceof Error ? failure.message : 'Não foi possível vincular o pedido.'
      }
      return false
    } finally {
      busyOrderId.value = null
    }
  }

  watch([tenantId, clientId, open], () => {
    ++requestVersion
    data.value = { orders: [], contracts: [] }
    selections.value = {}
    error.value = ''
    success.value = ''
    if (open.value && clientId.value) void load()
  }, { immediate: true })

  return {
    data,
    selections,
    busyOrderId,
    loading,
    error,
    success,
    contractOptions,
    load,
    consolidate,
  }
}
