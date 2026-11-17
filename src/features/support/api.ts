import { mutate, request } from '@/lib/http'

export type SupportTicket = {
  id: string
  category: string
  subject: string
  description: string
  status: string
  created_at: string
}
export type SupportTicketInput = { category: string; subject: string; description: string }

export const supportApi = {
  list: (tenantId: string) => request<{ data: SupportTicket[] }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/support-tickets`),
  create: (tenantId: string, data: SupportTicketInput) => mutate<{ data: SupportTicket }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/support-tickets`, data),
}
