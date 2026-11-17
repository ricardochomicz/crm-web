import { mutate, request } from '@/lib/http'

export type SupportTicket = {
  id: string
  category: string
  subject: string
  description: string
  status: string
  created_at: string
}
export type SupportMessage = {
  id: string
  body: string
  user_id: number
  created_at: string
  author?: { id: number; name: string }
}
export type SupportTicketInput = { category: string; subject: string; description: string }

export const supportApi = {
  messages: (tenantId: string, ticketId: string) => request<{ data: SupportMessage[] }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/support-tickets/${encodeURIComponent(ticketId)}/messages`),
  reply: (tenantId: string, ticketId: string, body: string) => mutate<{ data: SupportMessage }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/support-tickets/${encodeURIComponent(ticketId)}/messages`, { body }),
  list: (tenantId: string) => request<{ data: SupportTicket[] }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/support-tickets`),
  create: (tenantId: string, data: SupportTicketInput) => mutate<{ data: SupportTicket }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/support-tickets`, data),
}
