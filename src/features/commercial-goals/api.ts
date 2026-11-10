import { mutate, request } from '@/lib/http'
export type GoalTier = { minimum: number; percentage: number }
export type CommercialGoal = {
 id: string; operator_id: number; operator?: { id: number; name: string };
 order_type: string; category: string | null; negotiation_type_ids: string[]; target_scope: 'COMPANY' | 'CONSULTANT' | 'SUPERVISOR'; responsible_membership_id: string | null; commercial_role: string; metric: 'QUANTITY' | 'REVENUE';
 starts_on: string; ends_on: string | null; is_active: boolean; tiers: GoalTier[]
}
export type GoalInput = Omit<CommercialGoal, 'id' | 'operator'>
const base = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-goals`
export const commercialGoalsApi = {
 list: (tenantId: string) => request<{data: CommercialGoal[]; meta: {can_manage: boolean}}>(base(tenantId)),
 save: (tenantId: string, data: GoalInput, id?: string) => mutate(base(tenantId) + (id ? '/' + id : ''), data, id ? 'PATCH' : 'POST'),
 bulkSave: (tenantId: string, data: GoalInput & { responsible_membership_ids: string[] }) => mutate<{data: {created_count: number; skipped_count: number; skipped: {responsible_membership_id: string; reason: string}[]}}>(base(tenantId) + '/bulk', data, 'POST'),
}
