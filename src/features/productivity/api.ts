import { request } from '@/lib/http'

export interface ProductivityRow {
  id: string
  name: string
  completed: number
  overdue: number
  opportunities: number
  open_opportunities: number
  orders: number
  monthly_amount: number
}

export type ProductivityTotals = Omit<ProductivityRow, 'id' | 'name'>
export interface ProductivityResponse {
  data: ProductivityRow[]
  totals: ProductivityTotals
}

export const productivityApi = {
  overview(tenantId: string, filters: { from: string; to: string; consultant_id?: string }) {
    const params = new URLSearchParams(filters)
    return request<ProductivityResponse>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/consultants/productivity?${params}`)
  },
}
