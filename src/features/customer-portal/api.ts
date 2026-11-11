import { request } from '@/lib/http'

export interface PortalOrder {
  id: string
  code: string
  created_at: string
  operator: string | null
  status: string | null
  order_type: string | null
  line_quantity: number
  monthly_amount: string
  activated_at: string | null
}
export interface PortalOrdersResponse {
  data: PortalOrder[]
  meta: { current_page: number; last_page: number; total: number }
}
const root = (tenantId: string) => `/api/v1/public/customer-portal/${encodeURIComponent(tenantId)}`
export const customerPortalApi = {
  requestCode: (tenantId: string, document: string) =>
    request<{ message: string; challenge: string }>(`${root(tenantId)}/request-code`, {
      method: 'POST', body: JSON.stringify({ document }),
    }),
  verify: (tenantId: string, challenge: string, code: string) =>
    request<{ data: { token: string; expires_at: string } }>(`${root(tenantId)}/verify`, {
      method: 'POST', body: JSON.stringify({ challenge, code }),
    }),
  orders: (tenantId: string, token: string, page = 1) =>
    request<PortalOrdersResponse>(`${root(tenantId)}/orders?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  logout: (tenantId: string, token: string) =>
    request(`${root(tenantId)}/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
}
