import { computed, ref, watch, type Ref } from 'vue'
import { tenantApi } from '@/features/tenants/api'
import type { Tenant } from '@/features/tenants/types'
import { operatorsApi, type TenantOperator } from '@/features/operators/api'
import { errorMessage } from '@/lib/feedback'
import { toast } from '@/services/toast'
import { productsApi, type Product, type ProductPromotion } from '../api'
import { useProductsList } from './useProductsList'
import { useProductFormValidation } from './useProductFormValidation'
import { PRODUCT_CATEGORIES, emptyProductForm, emptyPromotionForm, type ProductFormValues, type ProductPromotionFormValues } from '../types/forms'

/** Estado e operações da página de produtos, sem dependências de apresentação. */
export function useProductsPage(tenantId: Ref<string>) {
const tenant = ref<Tenant>()
const { products, productPage, lastPage, totalProducts, filtersLoading, canManage, canCreate, canUpdate, canManagePromotions, nameFilter, operatorFilter, categoryFilter, statusFilter, loadProducts, applyFilters, clearFilters } = useProductsList(tenantId)
const operators = ref<TenantOperator[]>([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const categories = PRODUCT_CATEGORIES
const form = ref<ProductFormValues>(emptyProductForm())
const { productErrors, promotionErrors, validateProduct, validatePromotion, applyApiErrors } = useProductFormValidation()
const editingId = ref('')
const promoProductId = ref('')
const promoEditingId = ref('')
const promo = ref<ProductPromotionFormValues>(emptyPromotionForm())
const productModalOpen = ref(false)
const promotionModalOpen = ref(false)
const money = (value: unknown) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const parseBrl = (value: string) => Number(value.replace(/[^0-9]/g, '')) / 100
const formatBrlInput = (value: string) => money(parseBrl(value))
const priceDisplay = computed({ get: () => form.value.price, set: (value: string) => { form.value.price = formatBrlInput(value) } })
const promotionPriceDisplay = computed({ get: () => promo.value.promotional_price, set: (value: string) => { promo.value.promotional_price = formatBrlInput(value) } })
const currentPromotion = (p: Product): ProductPromotion | undefined => p.promotions?.find(pr => pr.is_active && pr.starts_at <= new Date().toISOString().slice(0, 10) && pr.ends_at >= new Date().toISOString().slice(0, 10))
const promotionPrice = (p: Product): string | null => { const active = currentPromotion(p); return active ? money(active.promotional_price) : null }
const selectedProduct = computed(() => products.value.find(p => p.id === promoProductId.value))
function newProduct() { reset(); productErrors.value = {}; productModalOpen.value = true }
function closeProduct() { if (!busy.value) productModalOpen.value = false }
function closePromotion() { if (!busy.value) promotionModalOpen.value = false }
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
    await loadProducts(productPage.value)
    operators.value = (await operatorsApi.tenantList(id)).data.filter(o => o.selected && o.is_active)
  } catch (e) {
    if (id === tenantId.value) error.value = errorMessage(e)
  } finally {
    if (id === tenantId.value) loading.value = false
  }
}
function edit(p: Product) {
  productModalOpen.value = true
  productErrors.value = {}
  editingId.value = p.id
  form.value = { operator_id: p.operator_id, name: p.name, description: p.description ?? '', category: p.category, price: money(p.price), is_active: p.is_active }
}
function reset() { editingId.value = ''; form.value = emptyProductForm() }
async function save() {
  if (!(editingId.value ? canUpdateWritable.value : canCreateWritable.value) || busy.value) return
  if (!validateProduct(form.value, operators.value.map(o => o.id), categories.map(c => c[0]!))) return
  busy.value = true
  try {
    const payload = { ...form.value, operator_id: Number(form.value.operator_id), price: parseBrl(form.value.price) }
    await productsApi.save(tenantId.value, payload, editingId.value || undefined)
    toast.success('Produto salvo.')
    reset()
    productModalOpen.value = false
    await load()
  } catch (e) { applyApiErrors(e, 'product'); toast.error(errorMessage(e)) }
  finally { busy.value = false }
}
function promotion(p: Product, existing?: ProductPromotion) {
  promotionErrors.value = {}
  promotionModalOpen.value = true
  promoProductId.value = p.id
  promoEditingId.value = existing?.id ?? ''
  promo.value = existing ? { name: existing.name, promotional_price: money(existing.promotional_price), starts_at: existing.starts_at, ends_at: existing.ends_at, is_active: existing.is_active } : emptyPromotionForm()
}
async function savePromotion() {
  if (!canPromoteWritable.value || busy.value) return
  if (!validatePromotion(promo.value)) return
  busy.value = true
  try {
    await productsApi.savePromotion(tenantId.value, promoProductId.value, { ...promo.value, promotional_price: parseBrl(promo.value.promotional_price) }, promoEditingId.value || undefined)
    toast.success('Promoção salva.')
    promoProductId.value = ''
    promotionModalOpen.value = false
    await load()
  } catch (e) { applyApiErrors(e, 'promotion'); toast.error(errorMessage(e)) }
  finally { busy.value = false }
}
watch(tenantId, () => { productModalOpen.value = false; promotionModalOpen.value = false; nameFilter.value = ''; operatorFilter.value = ''; categoryFilter.value = ''; statusFilter.value = ''; productPage.value = 1; void load() }, { immediate: true })

return { productErrors, promotionErrors, tenant, products, productPage, lastPage, totalProducts, filtersLoading, canManage, canCreate, canUpdate, canManagePromotions, nameFilter, operatorFilter, categoryFilter, statusFilter, loadProducts, applyFilters, clearFilters, operators, loading, busy, error, categories, form, editingId, promoProductId, promoEditingId, promo, productModalOpen, promotionModalOpen, money, priceDisplay, promotionPriceDisplay, currentPromotion, promotionPrice, selectedProduct, newProduct, closeProduct, closePromotion, writable, canCreateWritable, canUpdateWritable, canPromoteWritable, load, edit, reset, save, promotion, savePromotion }
}
