import { computed, ref, watch, type Ref } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { errorMessage } from '@/lib/feedback'
import { useProductsList } from './useProductsList'
import { useProductFormValidation } from './useProductFormValidation'
import { useProductEditor } from './useProductEditor'
import { useProductPromotions } from './useProductPromotions'
import { PRODUCT_CATEGORIES } from '../types/forms'
import { money } from '../utils/productMoney'

/** Coordinates catalog data, permissions, editor and promotions; UI stays in components. */
export function useProductsPage(tenantId: Ref<string>) {
  const tenant = ref<Tenant>()
  const list = useProductsList(tenantId)
  const {
    products, productPage, lastPage, totalProducts, filtersLoading,
    canManage, canCreate, canUpdate, canManagePromotions,
    nameFilter, operatorFilter, categoryFilter, statusFilter,
    loadProducts, applyFilters, clearFilters,
  } = list
  const operators = ref<TenantOperator[]>([])
  const loading = ref(true)
  const busy = ref(false)
  const error = ref('')
  const categories = PRODUCT_CATEGORIES

  const writable = computed(() => canManage.value && !!tenant.value?.access?.allows_operational_writes)
  const canCreateWritable = computed(() => canCreate.value && writable.value)
  const canUpdateWritable = computed(() => canUpdate.value && writable.value)
  const canPromoteWritable = computed(() => canManagePromotions.value && writable.value)

  async function load() {
    const id = tenantId.value
    loading.value = true
    error.value = ''
    try {
      tenant.value = (await tenantApi.show(id)).data
      if (id !== tenantId.value) return
      await loadProducts(productPage.value)
      if (id !== tenantId.value) return
      operators.value = (await operatorsApi.tenantList(id)).data.filter(o => o.selected && o.is_active)
    } catch (e) {
      if (id === tenantId.value) error.value = errorMessage(e)
    } finally {
      if (id === tenantId.value) loading.value = false
    }
  }

  const validation = useProductFormValidation()
  const editor = useProductEditor(
    tenantId, operators, canCreateWritable, canUpdateWritable, busy, load, validation,
  )
  const promotions = useProductPromotions(
    tenantId, products, canPromoteWritable, busy, load, validation,
  )

  watch(tenantId, () => {
    editor.productModalOpen.value = false
    promotions.promotionModalOpen.value = false
    nameFilter.value = ''
    operatorFilter.value = ''
    categoryFilter.value = ''
    statusFilter.value = ''
    productPage.value = 1
    void load()
  }, { immediate: true })

  return {
    ...list, ...editor, ...promotions,
    productErrors: validation.productErrors,
    promotionErrors: validation.promotionErrors,
    tenant, operators, loading, busy, error, categories, money,
    writable, canCreateWritable, canUpdateWritable, canPromoteWritable, load,
  }
}
