import { request, mutate } from '@/lib/http'

export type OpportunityItem = {
  id?: string; order_type_id: string; product_id: string; line_number: string | null; description: string
  quantity: number; monthly_unit_amount: number; one_time_unit_amount: number; notes: string | null
}
export type Opportunity = {
  items?: OpportunityItem[];
  id: string; code: string; title: string; status: 'open' | 'won' | 'lost' | 'cancelled'
  client_id: string; tenant_user_id: string; funnel_stage_id: string | null
  operator_id: number | null; order_type: string; order_type_id: string | null; description: string | null
  expected_close_at: string | null; estimated_monthly_amount: string
  estimated_one_time_amount: string; client?: { id: string; company_name: string }
  stage?: { id: string; name: string }; operator?: { id: number; name: string }
}
export type OpportunityInput = {
  code: string; title: string; client_id: string; order_type_id: string
  description: string | null; expected_close_at: string | null
  estimated_monthly_amount: number; estimated_one_time_amount: number; items: OpportunityItem[]
}
export type FunnelStage = { id: string; name: string; position: number; is_active: boolean }
export type OpportunityFilters = {
    search?: string
    status?: string
    period?: string
    order_type_id?: string
    date_from?: string
    date_to?: string
    min_amount?: number
    max_amount?: number
    page?: number
}
export type CommercialMetric = { count: number; monthly: string }
export type CommercialOverview = {
    open_period: CommercialMetric
    overdue: CommercialMetric
    future: CommercialMetric
    unscheduled: CommercialMetric
    won: CommercialMetric
    lost: CommercialMetric
    conversion_rate: number | null
    period: { from: string; to: string }
}
export type OpportunityPage = { data: Opportunity[]; current_page: number; last_page: number; total: number; per_page: number }
const base = (tenantId: string) => '/api/v1/tenants/' + encodeURIComponent(tenantId) + '/opportunities'
export const opportunitiesApi = {
  list: (tenantId: string, filters: OpportunityFilters) =>
    request<OpportunityPage>(base(tenantId) + '?' + new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)])).toString()),
  overview: (tenantId: string, from: string, to: string) =>
    request<{ data: CommercialOverview }>(base(tenantId) + '/overview?' + new URLSearchParams({ date_from: from, date_to: to }).toString()),
  stages: (tenantId: string) => request<{ data: FunnelStage[] }>('/api/v1/tenants/' + encodeURIComponent(tenantId) + '/opportunity-funnel-stages'),
  moveStage: (tenantId: string, id: string, funnel_stage_id: string) => mutate<{ data: Opportunity }>(base(tenantId) + '/' + encodeURIComponent(id) + '/stage', { funnel_stage_id }, 'PATCH'),
  show: (tenantId: string, id: string) => request<{ data: Opportunity }>(base(tenantId) + '/' + encodeURIComponent(id)),
  create: (tenantId: string, data: OpportunityInput) => mutate<{ data: Opportunity }>(base(tenantId), data),
  update: (tenantId: string, id: string, data: OpportunityInput) => mutate<{ data: Opportunity }>(base(tenantId) + '/' + encodeURIComponent(id), data, 'PATCH'),
}
