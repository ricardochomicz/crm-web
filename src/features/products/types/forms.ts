export type ProductFormValues = {
  operator_id: number
  name: string
  description: string
  category: string
  price: string
  is_active: boolean
}

export type ProductPromotionFormValues = {
  name: string
  promotional_price: string
  starts_at: string
  ends_at: string
  is_active: boolean
}

export type ProductFormErrors = Record<string, string>
export type ProductCategoryOption = [value: string, label: string]

export const PRODUCT_CATEGORIES: ProductCategoryOption[] = [
  ['PREPAID', 'Pré-pago'], ['CONTROL', 'Controle'], ['POSTPAID', 'Pós-pago'],
  ['BROADBAND', 'Fibra / Banda larga'], ['BUSINESS_INTERNET', 'Internet empresarial'],
  ['LANDLINE', 'Telefonia fixa'], ['PAY_TV', 'TV por assinatura'], ['BUNDLE', 'Combos'],
  ['ADD_ON', 'Serviços adicionais'], ['OTHER', 'Outros'],
]

export function emptyProductForm(): ProductFormValues {
  return { operator_id: 0, name: '', description: '', category: '', price: '', is_active: true }
}
export function emptyPromotionForm(): ProductPromotionFormValues {
  return { name: '', promotional_price: '', starts_at: '', ends_at: '', is_active: true }
}
