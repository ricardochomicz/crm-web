import { mutate, request } from '@/lib/http'
export type TeamCommissionRule = { id: string; operator_id: number; operator?: {id: number; name: string}; order_type: string; commercial_role: string; percentage: string; starts_on: string; ends_on: string | null; is_active: boolean }
export type TeamCommissionInput = Omit<TeamCommissionRule, 'id' | 'operator' | 'percentage'> & { percentage: string }
export type CommissionOption = { value: string; label: string }
const base = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}/team-commissions`
export const teamCommissionsApi = {
  list: (tenantId: string) => request<{data: TeamCommissionRule[]; meta: {can_manage: boolean}}>(base(tenantId)),
  options: (tenantId: string) => request<{data: {order_types: CommissionOption[]; roles: CommissionOption[]}}>(base(tenantId) + '/options'),
  save: (tenantId: string, data: TeamCommissionInput, id?: string) => mutate(base(tenantId) + (id ? '/' + id : ''), { ...data, percentage: Number(data.percentage.replace(',', '.')) }, id ? 'PATCH' : 'POST'),
}
