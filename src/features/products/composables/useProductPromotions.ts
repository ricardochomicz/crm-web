import { computed, ref, type Ref } from 'vue'
import { productsApi, type Product, type ProductPromotion } from '../api'
import { toast } from '@/services/toast'
import { errorMessage } from '@/lib/feedback'
import { emptyPromotionForm, type ProductPromotionFormValues } from '../types/forms'
import { formatBrlInput, money, parseBrl } from '../utils/productMoney'
import { useProductFormValidation } from './useProductFormValidation'

export function useProductPromotions(
  tenantId: Readonly<Ref<string>>,
  products: Readonly<Ref<Product[]>>,
  canPromote: Readonly<Ref<boolean>>,
  busy: Ref<boolean>,
  refresh: () => Promise<void>,
  validation: ReturnType<typeof useProductFormValidation>,
) {
  const promoProductId = ref('')
  const promoEditingId = ref('')
  const promo = ref<ProductPromotionFormValues>(emptyPromotionForm())
  const promotionModalOpen = ref(false)
  const { promotionErrors, validatePromotion, applyApiErrors } = validation
  const selectedProduct = computed(() => products.value.find(p => p.id === promoProductId.value))
  const promotionPriceDisplay = computed({
    get: () => promo.value.promotional_price,
    set: (value: string) => { promo.value.promotional_price = formatBrlInput(value) },
  })
  function currentPromotion(product: Product): ProductPromotion | undefined {
    const today = new Date().toISOString().slice(0, 10)
    return product.promotions?.find(pr => pr.is_active && pr.starts_at <= today && pr.ends_at >= today)
  }
  function promotionPrice(product: Product): string | null {
    const active = currentPromotion(product)
    return active ? money(active.promotional_price) : null
  }
  function promotion(product: Product, existing?: ProductPromotion) {
    promotionErrors.value = {}
    promoProductId.value = product.id
    promoEditingId.value = existing?.id ?? ''
    promo.value = existing ? {
      name: existing.name, promotional_price: money(existing.promotional_price),
      starts_at: existing.starts_at, ends_at: existing.ends_at, is_active: existing.is_active,
    } : emptyPromotionForm()
    promotionModalOpen.value = true
  }
  function closePromotion() { if (!busy.value) promotionModalOpen.value = false }
  async function savePromotion() {
    if (!canPromote.value || busy.value || !promoProductId.value) return
    if (!validatePromotion(promo.value)) return
    busy.value = true
    try {
      await productsApi.savePromotion(tenantId.value, promoProductId.value, {
        ...promo.value, promotional_price: parseBrl(promo.value.promotional_price),
      }, promoEditingId.value || undefined)
      toast.success('Promoção salva.')
      promoProductId.value = ''
      promotionModalOpen.value = false
      await refresh()
    } catch (e) { applyApiErrors(e, 'promotion'); toast.error(errorMessage(e)) }
    finally { busy.value = false }
  }
  return {
    promoProductId, promoEditingId, promo, promotionModalOpen, selectedProduct,
    promotionPriceDisplay, currentPromotion, promotionPrice, promotion, closePromotion, savePromotion,
  }
}
