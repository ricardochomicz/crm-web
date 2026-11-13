import { ref } from 'vue'
import { ApiError } from '@/lib/http'
import type { ProductFormValues, ProductPromotionFormValues, ProductFormErrors } from '../types/forms'

type Errors = ProductFormErrors
 type ProductForm = ProductFormValues
 type PromotionForm = ProductPromotionFormValues

const parseMoney = (value: string) => Number(value.replace(/[^0-9]/g, '')) / 100
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))

export function useProductFormValidation() {
  const productErrors = ref<Errors>({})
  const promotionErrors = ref<Errors>({})

  function validateProduct(form: ProductForm, operatorIds: number[], categories: string[]) {
    const errors: Errors = {}
    if (!form.name.trim()) errors.name = 'Informe o nome do produto.'
    else if (form.name.trim().length > 180) errors.name = 'O nome deve ter até 180 caracteres.'
    if (!operatorIds.includes(Number(form.operator_id))) errors.operator_id = 'Selecione uma operadora válida.'
    if (!categories.includes(form.category)) errors.category = 'Selecione uma categoria válida.'
    if (!form.price.trim() || !Number.isFinite(parseMoney(form.price)) || parseMoney(form.price) <= 0)
      errors.price = 'Informe um preço maior que zero.'
    productErrors.value = errors
    return Object.keys(errors).length === 0
  }

  function validatePromotion(form: PromotionForm) {
    const errors: Errors = {}
    if (!form.name.trim()) errors.name = 'Informe o nome da promoção.'
    if (!form.promotional_price.trim() || parseMoney(form.promotional_price) <= 0)
      errors.promotional_price = 'Informe um preço promocional maior que zero.'
    if (!validDate(form.starts_at)) errors.starts_at = 'Informe uma data de início válida.'
    if (!validDate(form.ends_at)) errors.ends_at = 'Informe uma data de término válida.'
    if (validDate(form.starts_at) && validDate(form.ends_at) && form.ends_at < form.starts_at)
      errors.ends_at = 'O término não pode ser anterior ao início.'
    promotionErrors.value = errors
    return Object.keys(errors).length === 0
  }

  function applyApiErrors(failure: unknown, target: 'product' | 'promotion') {
    if (!(failure instanceof ApiError)) return
    const errors = Object.fromEntries(
      Object.entries(failure.errors).map(([key, messages]) => [key, messages[0] ?? 'Confira este campo.']),
    )
    if (target === 'product') productErrors.value = errors
    else promotionErrors.value = errors
  }

  return { productErrors, promotionErrors, validateProduct, validatePromotion, applyApiErrors }
}
