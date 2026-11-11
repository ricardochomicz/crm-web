import { mutate, request } from '@/lib/http'

export interface ActivityNotification {
  id: string
  kind: 'assigned' | 'due_soon' | 'overdue'
  title: string
  message: string
  calendar_event_id: string
  read_at: string | null
  created_at: string
}

const base = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}/activity-notifications`

export const activityNotificationsApi = {
  list(tenantId: string) {
    return request<{ data: ActivityNotification[]; unread: number }>(base(tenantId))
  },
  markRead(tenantId: string, notificationId: string) {
    return mutate<{ ok: boolean }>(`${base(tenantId)}/${encodeURIComponent(notificationId)}/read`, {}, 'PATCH')
  },
}
