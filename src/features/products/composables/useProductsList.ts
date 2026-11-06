import { ref, watch, type Ref } from 'vue'
import { productsApi, type Product, type ProductFilters } from '../api'
import { toast } from '@/services/toast'
import { errorMessage } from '@/lib/feedback'

const emptyFilters = (): ProductFilters => ({ search: '', operator_id: '', category: '', is_active: '' })

export function useProductsList(tenantId: Ref<string>) {
  const products = ref<Product[]>([])
  const productPage = ref(1)
  const lastPage = ref(1)
  const totalProducts = ref(0)
  const filtersLoading = ref(false)
  const canManage = ref(false)
  const canCreate = ref(false)
  const canUpdate = ref(false)
  const canManagePromotions = ref(false)
  const nameFilter = ref('')
  const operatorFilter = ref('')
  const categoryFilter = ref('')
  const statusFilter = ref('')
  const appliedFilters = ref<ProductFilters>(emptyFilters())
  let requestId = 0

  async function loadProducts(page = productPage.value) {
    const id = tenantId.value
    const sequence = ++requestId
    filtersLoading.value = true
    try {
      const result = await productsApi.list(id, page, appliedFilters.value)
      if (sequence !== requestId || id !== tenantId.value) return
      products.value = result.data
      productPage.value = result.meta.current_page
      lastPage.value = result.meta.last_page
      totalProducts.value = result.meta.total
      canManage.value = result.meta.can_manage
      canCreate.value = result.meta.can_create
      canUpdate.value = result.meta.can_update
      canManagePromotions.value = result.meta.can_manage_promotions
    } catch (error) {
      if (sequence === requestId) toast.error(errorMessage(error))
    } finally {
      if (sequence === requestId) filtersLoading.value = false
    }
  }

  function applyFilters() {
    appliedFilters.value = {
      search: nameFilter.value.trim(),
      operator_id: operatorFilter.value,
      category: categoryFilter.value,
      is_active: statusFilter.value,
    }
    void loadProducts(1)
  }
  function clearFilters() {
    nameFilter.value = ''
    operatorFilter.value = ''
    categoryFilter.value = ''
    statusFilter.value = ''
    applyFilters()
  }
  watch(tenantId, () => {
    ++requestId
    products.value = []
    productPage.value = 1
    lastPage.value = 1
    totalProducts.value = 0
    filtersLoading.value = false
    nameFilter.value = ''
    operatorFilter.value = ''
    categoryFilter.value = ''
    statusFilter.value = ''
    appliedFilters.value = emptyFilters()
  })
  return {
    products, productPage, lastPage, totalProducts, filtersLoading,
    canManage, canCreate, canUpdate, canManagePromotions,
    nameFilter, operatorFilter, categoryFilter, statusFilter,
    loadProducts, applyFilters, clearFilters,
  }
}
