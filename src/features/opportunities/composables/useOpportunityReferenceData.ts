import { computed, ref, type Ref } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import { can, type Tenant } from '@/features/tenants/types'
import { orderTypesApi, type OrderType } from '@/features/order-types/api'
import { productsApi, type Product } from '@/features/products/api'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { clientsApi, type Client } from '@/features/clients/api'
import { opportunitiesApi, type FunnelStage } from '../api'

/** Loads the reference data needed by opportunity filters and forms. */
export function useOpportunityReferenceData(tenantId: Readonly<Ref<string>>) {
  const tenant = ref<Tenant>()
  const clients = ref<Client[]>([])
  const products = ref<Product[]>([])
  const operators = ref<TenantOperator[]>([])
  const orderTypes = ref<OrderType[]>([])
  const stages = ref<FunnelStage[]>([])
  const canCreate = computed(() => can(tenant.value, 'opportunities.create') && !!tenant.value?.access?.allows_operational_writes)
  const canEdit = computed(() => can(tenant.value, 'opportunities.update') && !!tenant.value?.access?.allows_operational_writes)
  let generation = 0

  function clear() {
    generation++
    tenant.value = undefined
    clients.value = []
    products.value = []
    operators.value = []
    orderTypes.value = []
    stages.value = []
  }

  async function load() {
    const id = tenantId.value
    const current = ++generation
    const valid = () => current === generation && id === tenantId.value
    const t = await tenantApi.show(id)
    if (!valid()) return
    tenant.value = t.data

    const tenantOperators = await operatorsApi.tenantList(id)
    if (!valid()) return
    operators.value = tenantOperators.data.filter(operator => operator.selected && operator.is_active)

    const types = await orderTypesApi.active()
    if (!valid()) return
    orderTypes.value = types.data

    const stageResult = await opportunitiesApi.stages(id)
    if (!valid()) return
    stages.value = stageResult.data

    if (!canCreate.value && !canEdit.value) return
    const c = await clientsApi.list(id)
    if (!valid()) return
    clients.value = c.data

    const productFilters = { search: '', operator_id: '', category: '', is_active: 'active' }
    const first = await productsApi.list(id, 1, productFilters)
    if (!valid()) return
    const available = [...first.data]
    for (let page = 2; page <= first.meta.last_page; page++) {
      const next = await productsApi.list(id, page, productFilters)
      if (!valid()) return
      available.push(...next.data)
    }
    products.value = available
  }

  return { tenant, clients, products, operators, orderTypes, stages, canCreate, canEdit, clear, load }
}
