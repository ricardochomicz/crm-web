import { mutate, request } from '@/lib/http'
import type { CalendarEvent, CalendarEventInput } from './types'

export interface CalendarEventHistoryEntry {
  id: string
  action: 'created' | 'updated' | 'reassigned' | 'completed' | 'deleted'
  actor_name: string
  created_at: string
  changes: Record<string, { from: unknown; to: unknown }> | null
}

const base = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}/calendar/events`
export const calendarApi = {
  history(tenantId: string, eventId: string) {
    return request<{ data: CalendarEventHistoryEntry[] }>(`${base(tenantId)}/${encodeURIComponent(eventId)}/history`)
  },
  assignees(tenantId: string) {
    return request<{ data: { id: string; name: string }[] }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/calendar/assignees`)
  },
  list(tenantId: string, from: string, to: string, scope: 'mine' | 'team') {
    const query = new URLSearchParams({ from, to, scope })
    return request<{ data: CalendarEvent[] }>(`${base(tenantId)}?${query}`)
  },
  activitiesOverview(tenantId: string, filters: { scope: 'mine' | 'team'; search?: string }) {
    const query = new URLSearchParams({ scope: filters.scope })
    if (filters.search?.trim()) query.set('search', filters.search.trim())
    return request<{ data: { total: number; pending: number; overdue: number; due_soon: number; completed: number; cancelled: number } }>(
      `/api/v1/tenants/${encodeURIComponent(tenantId)}/activities/overview?${query}`,
    )
  },
  activities(tenantId: string, filters: { scope: 'mine' | 'team'; status: string; search?: string; page: number; per_page: number }) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) continue
      query.set(key, String(value))
    }
    return request<{ data: CalendarEvent[]; meta: { current_page: number; last_page: number; total: number; per_page: number } }>(
      `/api/v1/tenants/${encodeURIComponent(tenantId)}/activities?${query}`,
    )
  },
  forOpportunity(tenantId: string, opportunityId: string) {
    const query = new URLSearchParams({ from: '2000-01-01T00:00:00', to: '2100-01-01T00:00:00', scope: 'mine', opportunity_id: opportunityId })
    return request<{ data: CalendarEvent[] }>(`${base(tenantId)}?${query}`)
  },
  create(tenantId: string, data: CalendarEventInput) {
    return mutate<{ data: CalendarEvent }>(base(tenantId), data)
  },
  update(tenantId: string, id: string, data: Partial<CalendarEventInput>) {
    return mutate<{ data: CalendarEvent }>(`${base(tenantId)}/${encodeURIComponent(id)}`, data, 'PATCH')
  },
  remove(tenantId: string, id: string) {
    return mutate(`${base(tenantId)}/${encodeURIComponent(id)}`, undefined, 'DELETE')
  },
}
