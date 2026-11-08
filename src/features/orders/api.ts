import { mutate, request } from '@/lib/http'

export type CommercialOrderItem = {
    id: string
    line_number: string | null
    description: string | null
    quantity: number
    monthly_unit_amount: string
    one_time_unit_amount: string
    status: string | null
    activated_at?: string | null
}

export type CommercialOrder = {
    items?: CommercialOrderItem[]
    id: string
    code: string | null
    opportunity_id?: string | null
    customer_name: string
    consultant_name?: string | null
    monthly_amount: string
    line_quantity: number
    sold_on: string
    status: string
    order_status_id: string | null
    order_status?: string | null
    expected_activation_at?: string | null
    activated_at?: string | null
    administratively_completed_at?: string | null
    activation_summary?: { total: number; active: number; pending: number }
}

export const ordersApi = {
    show: (tenantId: string, id: string) =>
        request<{ data: CommercialOrder }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-orders/${id}`),
    updateWorkflow: (tenantId: string, id: string, data: { order_status_id: string; expected_activation_at: string | null; correction_reason?: string }) =>
        mutate<{ data: CommercialOrder }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-orders/${id}/workflow`, data, 'PATCH'),
    activateItems: (tenantId: string, id: string, data: { item_ids: string[]; activated_at: string }) =>
        mutate<{ data: CommercialOrder }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-orders/${id}/activate-items`, data, 'POST'),
    complete: (tenantId: string, id: string) =>
        mutate<{ data: CommercialOrder }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-orders/${id}/complete`, {}, 'POST'),
    list: (tenantId: string) =>
        request<{ data: CommercialOrder[] }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-orders`),
}
