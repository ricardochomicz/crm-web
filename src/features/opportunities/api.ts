import { request, mutate } from '@/lib/http'

export type OpportunityItem = {
  id?: string; order_type_id: string; product_id: string; line_number: string | null; description: string
  quantity: number; monthly_unit_amount: number; one_time_unit_amount: number; notes: string | null
}
export type Opportunity = {
  items?: OpportunityItem[];
  parent_opportunity_id?: string | null; lost_reason?: string | null; closed_at?: string | null;
  id: string; code: string; title: string; created_at?: string | null; status: 'open' | 'won' | 'lost' | 'cancelled'
  client_id: string; tenant_user_id: string; funnel_stage_id: string | null
  operator_id: number | null; order_type: string; order_type_id: string | null; description: string | null
  expected_close_at: string | null; estimated_monthly_amount: string
  estimated_one_time_amount: string; client?: { id: string; company_name: string; contacts?: { id: string; name: string; is_primary: boolean; is_active: boolean }[] }
  assignee?: { id: string; mobile_phone?: string | null; secondary_phone?: string | null; user?: { id: string; name: string } | null } | null
  stage?: { id: string; name: string }; operator?: { id: number; name: string }
}
export type OpportunityInput = {
  code: string; title: string; client_id: string; order_type_id: string; operator_id: number | null
  description: string | null; expected_close_at: string | null
  estimated_monthly_amount: number; estimated_one_time_amount: number; items: OpportunityItem[]
}
export type FunnelStage = { id: string; name: string; position: number; is_active: boolean }
export type OpportunityFilters = {
    client_id?: string
    search?: string
    status?: string
    period?: string
    order_type_id?: string
    date_from?: string
    date_to?: string
    min_amount?: number
    max_amount?: number
    page?: number
    funnel_stage_id?: string
    include_unassigned?: boolean
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
export type FunnelOverview = {
  stages: { id: string; name: string; count: number; monthly: string }[]
  unassigned: { count: number; monthly: string }
}
export type OpportunityPage = { data: Opportunity[]; current_page: number; last_page: number; total: number; per_page: number }
const base = (tenantId: string) => '/api/v1/tenants/' + encodeURIComponent(tenantId) + '/opportunities'
export const opportunitiesApi = {
  list: (tenantId: string, filters: OpportunityFilters) =>
    request<OpportunityPage>(base(tenantId) + '?' + new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value)])).toString()),
  funnelOverview: (tenantId: string) => request<{ data: FunnelOverview }>(base(tenantId) + '/funnel-overview'),
  highlights: (tenantId: string) => request<{ data: string[] }>(base(tenantId) + '/highlights'),
  setHighlight: (tenantId: string, id: string, highlighted: boolean) =>
    mutate<{ data: { id: string; highlighted: boolean } }>(base(tenantId) + '/' + encodeURIComponent(id) + '/highlight', { highlighted }, 'PUT'),
  overview: (tenantId: string, from: string, to: string) =>
    request<{ data: CommercialOverview }>(base(tenantId) + '/overview?' + new URLSearchParams({ date_from: from, date_to: to }).toString()),
  stages: (tenantId: string) => request<{ data: FunnelStage[] }>('/api/v1/tenants/' + encodeURIComponent(tenantId) + '/opportunity-funnel-stages'),
  recover: (tenantId: string, id: string) =>
    mutate<{ data: Opportunity }>(base(tenantId) + '/' + encodeURIComponent(id) + '/recover', {}, 'POST'),
  markLost: (tenantId: string, id: string, lostReason: string) =>
    mutate<{ data: Opportunity }>(base(tenantId) + '/' + encodeURIComponent(id) + '/mark-lost', { lost_reason: lostReason }, 'POST'),
  resendToBackoffice: (tenantId: string, id: string) =>
    mutate<{ data: Opportunity }>(base(tenantId) + '/' + encodeURIComponent(id) + '/resend-to-backoffice', {}, 'POST'),
  confirmSale: (tenantId: string, id: string) =>
    mutate<{ data: { id: string; status: string } }>(base(tenantId) + '/' + encodeURIComponent(id) + '/confirm-sale', {}, 'POST'),
  moveStage: (tenantId: string, id: string, funnel_stage_id: string, expected_close_at?: string) => mutate<{ data: Opportunity }>(base(tenantId) + '/' + encodeURIComponent(id) + '/stage', { funnel_stage_id, ...(expected_close_at ? { expected_close_at } : {}) }, 'PATCH'),
  show: (tenantId: string, id: string) => request<{ data: Opportunity }>(base(tenantId) + '/' + encodeURIComponent(id)),
  create: (tenantId: string, data: OpportunityInput) => mutate<{ data: Opportunity }>(base(tenantId), data),
  update: (tenantId: string, id: string, data: OpportunityInput) => mutate<{ data: Opportunity }>(base(tenantId) + '/' + encodeURIComponent(id), data, 'PATCH'),
}

export type ComparisonOption = {
  id?: string; product_id: string; operator_id?: number; operator_name?: string; product_name?: string
  quantity: number; monthly_unit_amount: number | string; one_time_unit_amount: number | string; notes?: string | null
}
export type OpportunityComparison = {
  id: string; title: string; public_token: string; created_at: string; expires_at: string
  revoked_at: string | null; options: ComparisonOption[]
}
export const comparisonsApi = {
  list: (tenantId: string, opportunityId: string) =>
    request<{ data: OpportunityComparison[] }>(base(tenantId) + '/' + encodeURIComponent(opportunityId) + '/comparisons'),
  create: (tenantId: string, opportunityId: string, data: { title: string; options: ComparisonOption[] }) =>
    mutate<{ data: OpportunityComparison }>(base(tenantId) + '/' + encodeURIComponent(opportunityId) + '/comparisons', data, 'POST'),
  revoke: (tenantId: string, opportunityId: string, comparisonId: string) =>
    mutate<{ data: OpportunityComparison }>(base(tenantId) + '/' + encodeURIComponent(opportunityId) + '/comparisons/' + encodeURIComponent(comparisonId) + '/revoke', {}, 'POST'),
  publicShow: (token: string) =>
    request<{ data: Pick<OpportunityComparison, 'title' | 'created_at' | 'expires_at' | 'options'> }>('/api/v1/public/comparisons/' + encodeURIComponent(token)),
}

export type ProposalSnapshot = {
  title: string; company_name: string; client_name: string; consultant_name: string
  client_contact_name?: string | null; consultant_phone?: string | null
  opportunity_code: string; conditions: string; notes: string
  items: { description: string; quantity: number; monthly_unit_amount: string; one_time_unit_amount: string }[]
}
export type OpportunityProposal = {
  id: string; version: number; created_at: string; expires_at: string
  revoked_at: string | null; public_token: string; snapshot: ProposalSnapshot
}
const proposalBase = (tenantId: string, opportunityId: string) =>
  base(tenantId) + '/' + encodeURIComponent(opportunityId) + '/proposals'
export const proposalsApi = {
  list: (tenantId: string, opportunityId: string) =>
    request<{ data: OpportunityProposal[] }>(proposalBase(tenantId, opportunityId)),
  publish: (tenantId: string, opportunityId: string, data: { validity_days: number; conditions: string; notes: string }) =>
    mutate<{ data: OpportunityProposal }>(proposalBase(tenantId, opportunityId), data, 'POST'),
  revoke: (tenantId: string, opportunityId: string, proposalId: string) =>
    mutate<{ data: OpportunityProposal }>(proposalBase(tenantId, opportunityId) + '/' + encodeURIComponent(proposalId) + '/revoke', {}, 'POST'),
  publicShow: (token: string) =>
    request<{ data: { version: number; expires_at: string; snapshot: ProposalSnapshot } }>('/api/v1/public/proposals/' + encodeURIComponent(token)),
}
