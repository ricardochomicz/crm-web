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

export type ConsultantRecordType = 'activities' | 'opportunities' | 'orders'
export interface ConsultantRecord {
  id: string
  title?: string
  code?: string
  customer_name?: string
  status: string
  monthly_amount?: string
  ends_at?: string
  completed_at?: string
  sold_on?: string
  created_at: string
}
export interface ConsultantRecordsPage {
  data: ConsultantRecord[]
  current_page: number
  last_page: number
  total: number
}

export const productivityApi = {
  records(tenantId: string, filters: { from: string; to: string; consultant_id: string; type: ConsultantRecordType; page: number }) {
    const params = new URLSearchParams(Object.entries(filters).map(([key, value]) => [key, String(value)]))
    return request<ConsultantRecordsPage>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/consultants/productivity/records?${params}`)
  },
  overview(tenantId: string, filters: { from: string; to: string; consultant_id?: string }) {
    const params = new URLSearchParams(filters)
    return request<ProductivityResponse>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/consultants/productivity?${params}`)
  },
}
