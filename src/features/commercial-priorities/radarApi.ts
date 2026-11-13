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

export const radarApi = {
  list: (tenantId: string) =>
    request<{ data: CommercialRadarResponse }>(
      '/api/v1/tenants/' + encodeURIComponent(tenantId) + '/commercial-radar',
    ),
}
