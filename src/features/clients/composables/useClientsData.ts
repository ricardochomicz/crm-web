import { ref, type Ref } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import type { Tenant } from '@/features/tenants/types'
import {
  clientsApi,
  type Client,
  type Classification,
  type Seller,
} from '../api'

interface ClientsDataDependencies {
  tenantId: Readonly<Ref<string>>
  onPendingContact: (client: Client) => Promise<void>
  hasPendingContact: () => boolean
}

export function useClientsData({
  tenantId,
  onPendingContact,
  hasPendingContact,
}: ClientsDataDependencies) {
  const tenant = ref<Tenant>()
  const rows = ref<Client[]>([])
  const operators = ref<TenantOperator[]>([])
  const classes = ref<Classification[]>([])
  const sellers = ref<Seller[]>([])
  const canAssignSeller = ref(false)
  const currentSellerId = ref<string | null>(null)
  const loading = ref(true)
  const error = ref('')
  const canManage = ref(false)
  const canCreate = ref(false)
  let requestVersion = 0

  function invalidate() {
    ++requestVersion
    loading.value = false
  }

  async function load() {
    const version = ++requestVersion
    const currentTenantId = tenantId.value
    loading.value = true
    error.value = ''

    try {
      const [tenantResponse, clientsResponse, operatorsResponse, classificationsResponse, optionsResponse] =
        await Promise.all([
          tenantApi.show(currentTenantId),
          clientsApi.list(currentTenantId),
          operatorsApi.available(),
          clientsApi.classifications(currentTenantId),
          clientsApi.options(currentTenantId),
        ])

      if (version !== requestVersion || currentTenantId !== tenantId.value) return

      tenant.value = tenantResponse.data
      rows.value = clientsResponse.data
      operators.value = operatorsResponse.data.map((operator) => ({ ...operator, selected: true }))
      classes.value = classificationsResponse.data
      sellers.value = optionsResponse.data.sellers
      canAssignSeller.value = optionsResponse.data.can_assign_seller
      currentSellerId.value = optionsResponse.data.current_seller_id
      canManage.value = clientsResponse.meta.can_manage
      canCreate.value = clientsResponse.meta.can_create

      const pending = clientsResponse.data.find((client) => client.contact_pending)
      if (pending && clientsResponse.meta.can_create && !hasPendingContact()) {
        await onPendingContact(pending)
      }
    } catch (cause) {
      if (version === requestVersion && currentTenantId === tenantId.value) {
        error.value = cause instanceof Error ? cause.message : 'Erro ao carregar clientes.'
      }
    } finally {
      if (version === requestVersion && currentTenantId === tenantId.value) {
        loading.value = false
      }
    }
  }

  return {
    tenant,
    rows,
    operators,
    classes,
    sellers,
    canAssignSeller,
    currentSellerId,
    loading,
    error,
    canManage,
    canCreate,
    load,
    invalidate,
  }
}
