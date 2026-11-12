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
  monthly_target: number | null
}

export type ProductivityTotals = Omit<ProductivityRow, 'id' | 'name' | 'monthly_target'>
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

export interface GoalConfiguration {
  id: string
  operator_id: number
  order_type: string
  metric: 'QUANTITY' | 'REVENUE'
  target_scope: 'COMPANY' | 'CONSULTANT'
  responsible_membership_id: string | null
  starts_on: string
  ends_on: string | null
  tiers: { minimum: number; percentage: number }[]
}

export const productivityApi = {
  saveMonthlyTarget(tenantId: string, data: { tenant_user_id: string; month: string; amount: number }) {
    return import('@/lib/http').then(({ mutate }) => mutate<{ data: { id: string } }>(
      `/api/v1/tenants/${encodeURIComponent(tenantId)}/consultants/productivity/monthly-target`, data, 'PUT',
    ))
  },
  goalConfigurations(tenantId: string, filters: { from: string; to: string; consultant_id?: string }) {
    const params = new URLSearchParams(filters)
    return request<{ data: GoalConfiguration[] }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/consultants/productivity/goals?${params}`)
  },
  records(tenantId: string, filters: { from: string; to: string; consultant_id: string; type: ConsultantRecordType; page: number }) {
    const params = new URLSearchParams(Object.entries(filters).map(([key, value]) => [key, String(value)]))
    return request<ConsultantRecordsPage>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/consultants/productivity/records?${params}`)
  },
  overview(tenantId: string, filters: { from: string; to: string; consultant_id?: string }) {
    const params = new URLSearchParams(filters)
    return request<ProductivityResponse>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/consultants/productivity?${params}`)
  },
}
