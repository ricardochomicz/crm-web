import { request } from '@/lib/http'

export type CommercialRadarItem = {
  id: string
  type: 'opportunity' | 'activity' | 'order'
  title: string
  reason: string
  priority: 'urgent' | 'high'
  due_at: string | null
  destination_id: string
}

export type CommercialRadarResponse = {
  items: CommercialRadarItem[]
  summary: { total: number; urgent: number; high: number }
}

export type CommercialRadarMember = { id: string; name: string }

export const radarApi = {
  members: (tenantId: string) =>
    request<{ data: CommercialRadarMember[] }>(
      '/api/v1/tenants/' + encodeURIComponent(tenantId) + '/commercial-radar/members',
    ),
  list: (tenantId: string, memberId = '') =>
    request<{ data: CommercialRadarResponse }>(
      '/api/v1/tenants/' + encodeURIComponent(tenantId) + '/commercial-radar' + (memberId ? '?member_id=' + encodeURIComponent(memberId) : ''),
    ),
}
