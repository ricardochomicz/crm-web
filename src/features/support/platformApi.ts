import { mutate, request } from '@/lib/http'
import type { SupportMessage, SupportTicket } from './api'

export type PlatformTicket = SupportTicket & {
  priority: string
  has_unread_customer_message?: boolean
  tenant: { id: string; name: string }
  author: { id: string; name: string; email: string }
  messages?: SupportMessage[]
}
export type TicketPage = { data: PlatformTicket[]; current_page: number; last_page: number; total: number }

export type SupportSummary = { open: number; in_progress: number; waiting: number; urgent: number }

export const platformSupportApi = {
  summary: () => request<{ data: SupportSummary }>('/api/v1/admin/support-tickets/summary'),
  list: (page: number, status: string, search: string, priority = '') => {
    const params = new URLSearchParams({ page: String(page) })
    if (status) params.set('status', status)
    if (priority) params.set('priority', priority)
    if (search.trim()) params.set('search', search.trim())
    return request<TicketPage>(`/api/v1/admin/support-tickets?${params}`)
  },
  show: (id: string) => request<{ data: PlatformTicket }>(`/api/v1/admin/support-tickets/${encodeURIComponent(id)}`),
  update: (id: string, data: { status?: string; priority?: string }) =>
    mutate<{ data: PlatformTicket }>(`/api/v1/admin/support-tickets/${encodeURIComponent(id)}`, data, 'PATCH'),
  reply: (id: string, body: string) =>
    mutate<{ data: SupportMessage }>(`/api/v1/admin/support-tickets/${encodeURIComponent(id)}/messages`, { body }),
}
