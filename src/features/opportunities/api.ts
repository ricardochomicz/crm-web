import { request, mutate } from '@/lib/http'

export type Opportunity = {
  id: string; code: string; title: string; status: 'open' | 'won' | 'lost' | 'cancelled'
  client_id: string; tenant_user_id: string; funnel_stage_id: string | null
  operator_id: number | null; order_type: string; description: string | null
  expected_close_at: string | null; estimated_monthly_amount: string
  estimated_one_time_amount: string; client?: { id: string; company_name: string }
  stage?: { id: string; name: string }; operator?: { id: number; name: string }
}
export type OpportunityInput = {
  code: string; title: string; client_id: string; order_type: string
  description: string | null; expected_close_at: string | null
  estimated_monthly_amount: number; estimated_one_time_amount: number
}
export type OpportunityPage = { data: Opportunity[]; current_page: number; last_page: number; total: number; per_page: number }
const base = (tenantId: string) => '/api/v1/tenants/' + encodeURIComponent(tenantId) + '/opportunities'
export const opportunitiesApi = {
  list: (tenantId: string, filters: { search?: string; status?: string; page?: number }) =>
    request<OpportunityPage>(base(tenantId) + '?' + new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)])).toString()),
  create: (tenantId: string, data: OpportunityInput) => mutate<{ data: Opportunity }>(base(tenantId), data),
  update: (tenantId: string, id: string, data: OpportunityInput) => mutate<{ data: Opportunity }>(base(tenantId) + '/' + encodeURIComponent(id), data, 'PATCH'),
}
