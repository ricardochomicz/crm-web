import { request } from '@/lib/http'

export type OrderType = { id: string; name: string; requires_number: boolean; is_active: boolean; position: number }
export const orderTypesApi = {
  active: () => request<{ data: OrderType[] }>('/api/v1/order-types'),
}
