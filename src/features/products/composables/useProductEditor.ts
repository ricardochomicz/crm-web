import { computed, ref, type Ref } from 'vue'
import { productsApi, type Product } from '../api'
import type { TenantOperator } from '@/features/operators/api'
import { toast } from '@/services/toast'
import { errorMessage } from '@/lib/feedback'
import { PRODUCT_CATEGORIES, emptyProductForm, type ProductFormValues } from '../types/forms'
import { formatBrlInput, money, parseBrl } from '../utils/productMoney'
import { useProductFormValidation } from './useProductFormValidation'

export function useProductEditor(
  tenantId: Readonly<Ref<string>>,
  operators: Readonly<Ref<TenantOperator[]>>,
  canCreate: Readonly<Ref<boolean>>,
  canUpdate: Readonly<Ref<boolean>>,
  busy: Ref<boolean>,
  refresh: () => Promise<void>,
  validation: ReturnType<typeof useProductFormValidation>,
) {
  const form = ref<ProductFormValues>(emptyProductForm())
  const editingId = ref('')
  const productModalOpen = ref(false)
  const { productErrors, validateProduct, applyApiErrors } = validation
  const priceDisplay = computed({
    get: () => form.value.price,
    set: (value: string) => { form.value.price = formatBrlInput(value) },
  })
  function reset() { editingId.value = ''; form.value = emptyProductForm() }
  function newProduct() { reset(); productErrors.value = {}; productModalOpen.value = true }
  function edit(product: Product) {
    productErrors.value = {}
    editingId.value = product.id
    form.value = {
      operator_id: product.operator_id, name: product.name,
      description: product.description ?? '', category: product.category,
      price: money(product.price), is_active: product.is_active,
    }
    productModalOpen.value = true
  }
  function closeProduct() { if (!busy.value) productModalOpen.value = false }
  async function save() {
    if (!(editingId.value ? canUpdate.value : canCreate.value) || busy.value) return
    if (!validateProduct(form.value, operators.value.map(o => o.id), PRODUCT_CATEGORIES.map(c => c[0]))) return
    busy.value = true
    try {
      await productsApi.save(tenantId.value, {
        ...form.value, operator_id: Number(form.value.operator_id), price: parseBrl(form.value.price),
      }, editingId.value || undefined)
      toast.success('Produto salvo.')
      reset()
      productModalOpen.value = false
      await refresh()
    } catch (e) { applyApiErrors(e, 'product'); toast.error(errorMessage(e)) }
    finally { busy.value = false }
  }
  return { form, editingId, productModalOpen, priceDisplay, newProduct, edit, closeProduct, reset, save }
}
