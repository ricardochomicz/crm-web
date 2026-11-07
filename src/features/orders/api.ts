import { mutate, request } from '@/lib/http'

export type CommercialOrder = {
    id: string
    code: string | null
    customer_name: string
    monthly_amount: string
    line_quantity: number
    sold_on: string
    status: string
    order_status_id: string | null
    order_status?: string | null
    expected_activation_at?: string | null
    activated_at?: string | null
}

export const ordersApi = {
    show: (tenantId: string, id: string) =>
        request<{ data: CommercialOrder }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-orders/${id}`),
    updateWorkflow: (tenantId: string, id: string, data: { order_status_id: string; expected_activation_at: string | null }) =>
        mutate<{ data: CommercialOrder }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-orders/${id}/workflow`, data, 'PATCH'),
    list: (tenantId: string) =>
        request<{ data: CommercialOrder[] }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-orders`),
}
