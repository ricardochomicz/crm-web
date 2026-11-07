import { mutate, request } from '@/lib/http'

export type OrderStatus = { id: string; name: string }

const base = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}/order-statuses`

export const orderStatusesApi = {
    list: (tenantId: string) => request<{ data: OrderStatus[]; meta: { can_manage: boolean } }>(base(tenantId)),
    create: (tenantId: string, name: string) => mutate<{ data: OrderStatus }>(base(tenantId), { name }),
    update: (tenantId: string, id: string, name: string) => mutate<{ data: OrderStatus }>(`${base(tenantId)}/${id}`, { name }, 'PATCH'),
    remove: (tenantId: string, id: string) => mutate(`${base(tenantId)}/${id}`, {}, 'DELETE'),
}
