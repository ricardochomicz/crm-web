import { request, mutate } from '@/lib/http'

export type ProductPromotion = {
  id: string
  name: string
  promotional_price: number | string
  starts_at: string
  ends_at: string
  is_active: boolean
}
export type Product = {
  id: string
  operator_id: number
  operator?: { id: number; name: string }
  name: string
  description: string | null
  category: string
  price: number | string
  is_active: boolean
  promotions?: ProductPromotion[]
}
export type ProductFilters = {
  search: string
  operator_id: string
  category: string
  is_active: string
}
export type ProductsMeta = {
  current_page: number
  last_page: number
  total: number
  can_manage: boolean
  can_create: boolean
  can_update: boolean
  can_manage_promotions: boolean
}
const base = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}/products`
export const productsApi = {
  list(tenantId: string, page: number, filters: ProductFilters) {
    const params = new URLSearchParams({ page: String(page) })
    if (filters.search) params.set('search', filters.search)
    if (filters.operator_id) params.set('operator_id', filters.operator_id)
    if (filters.category) params.set('category', filters.category)
    if (filters.is_active) params.set('is_active', filters.is_active === 'active' ? '1' : '0')
    return request<{ data: Product[]; meta: ProductsMeta }>(`${base(tenantId)}?${params}`)
  },
  save(tenantId: string, payload: object, id?: string) {
    return mutate(id ? `${base(tenantId)}/${id}` : base(tenantId), payload, id ? 'PATCH' : 'POST')
  },
  savePromotion(tenantId: string, productId: string, payload: object, promotionId?: string) {
    const url = `${base(tenantId)}/${productId}/promotions${promotionId ? '/' + promotionId : ''}`
    return mutate(url, payload, promotionId ? 'PATCH' : 'POST')
  },
}
