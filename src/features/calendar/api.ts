import { mutate, request } from '@/lib/http'
import type { CalendarEvent, CalendarEventInput } from './types'

const base = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}/calendar/events`
export const calendarApi = {
  list(tenantId: string, from: string, to: string, scope: 'mine' | 'team') {
    const query = new URLSearchParams({ from, to, scope })
    return request<{ data: CalendarEvent[] }>(`${base(tenantId)}?${query}`)
  },
  create(tenantId: string, data: CalendarEventInput) {
    return mutate<{ data: CalendarEvent }>(base(tenantId), data)
  },
  update(tenantId: string, id: string, data: CalendarEventInput) {
    return mutate<{ data: CalendarEvent }>(`${base(tenantId)}/${encodeURIComponent(id)}`, data, 'PATCH')
  },
  remove(tenantId: string, id: string) {
    return mutate(`${base(tenantId)}/${encodeURIComponent(id)}`, undefined, 'DELETE')
  },
}
