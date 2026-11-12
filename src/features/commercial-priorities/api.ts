import { mutate, request } from '@/lib/http'

export interface CommercialPriority {
  id: string
  title: string
  client_name: string | null
  operator_name: string | null
  expected_close_at: string | null
  lines: number
  monthly: string
  acknowledged: boolean
}

export interface CommercialPrioritySummary {
  period: { from: string; to: string }
  total_opportunities: number
  total_lines: number
  total_monthly: string
  items: CommercialPriority[]
}

export const commercialPrioritiesApi = {
  list: (tenantId: string) =>
    request<{ data: CommercialPrioritySummary }>(
      `/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-priorities`,
    ),
  acknowledge: (tenantId: string, opportunityId: string) =>
    mutate<{ data: { acknowledged: boolean } }>(
      `/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-priorities/${encodeURIComponent(opportunityId)}/acknowledge`,
      {},
      'PUT',
    ),
}
