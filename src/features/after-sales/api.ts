import { mutate, request } from '@/lib/http'

export type ProtocolStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'cancelled' | 'reopened'
export type Protocol = {
  id: string; code: string; client_id: string; client_name?: string; commercial_order_id: string | null
  opened_by_tenant_user_id: string; assigned_to_tenant_user_id: string | null; assignee_name?: string | null
  title: string; category: string; priority: string; status: ProtocolStatus; description: string
  due_at: string | null; created_at: string; resolved_at: string | null
}
export type ProtocolHistory = { id: string; action: string; actor_name: string; from_status: string | null; to_status: string | null; note: string | null; created_at: string }
export type ProtocolDetail = { data: Protocol; history: ProtocolHistory[] }
export type ProtocolInput = { code: string; client_id: string; title: string; category: string; priority: string; description: string; assigned_to_tenant_user_id: string | null; due_at: string | null }
const base = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}/after-sales`
export const protocolApi = {
  list(tenantId: string, filters: Record<string, string>) { return request<{ data: Protocol[]; current_page: number; last_page: number; total: number }>(`${base(tenantId)}/protocols?${new URLSearchParams(filters)}`) },
  options(tenantId: string) { return request<{ data: { clients: { id: string; company_name: string }[]; members: { id: string; name: string }[]; current_member_id: string } }>(`${base(tenantId)}/options`) },
  show(tenantId: string, id: string) { return request<ProtocolDetail>(`${base(tenantId)}/protocols/${id}`) },
  create(tenantId: string, input: ProtocolInput) { return mutate<ProtocolDetail>(`${base(tenantId)}/protocols`, input) },
  update(tenantId: string, id: string, input: Record<string, unknown>) { return mutate<ProtocolDetail>(`${base(tenantId)}/protocols/${id}`, input, 'PATCH') },
}
