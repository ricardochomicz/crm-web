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
  expected_activation_at: string | null
  consultant_name: string | null
}
export interface PortalOrderDetail extends PortalOrder {
  items: { description: string | null; line_number: string | null; quantity: number; monthly_unit_amount: string; status: string | null; activated_at: string | null }[]
}
export interface PortalOrdersResponse {
  data: PortalOrder[]
  meta: { current_page: number; last_page: number; total: number }
}
const root = (tenantId: string) => `/api/v1/public/customer-portal/${encodeURIComponent(tenantId)}`
export const customerPortalApi = {
  requestCode: (document: string) =>
    request<{ message: string; challenge: string }>('/api/v1/public/customer-portal/request-code', {
      method: 'POST', body: JSON.stringify({ document }),
    }),
  verify: (challenge: string, code: string) =>
    request<{ data: { tenant_id: string; token: string; expires_at: string } }>('/api/v1/public/customer-portal/verify', {
      method: 'POST', body: JSON.stringify({ challenge, code }),
    }),
  orders: (tenantId: string, token: string, page = 1) =>
    request<PortalOrdersResponse>(`${root(tenantId)}/orders?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  order: (tenantId: string, token: string, orderId: string) =>
    request<{ data: PortalOrderDetail }>(`${root(tenantId)}/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  logout: (tenantId: string, token: string) =>
    request(`${root(tenantId)}/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
}
