import { mutate, request } from '@/lib/http'

export type Operator = { id: number; name: string; slug: string; is_active: boolean }
export type TenantOperator = Operator & { selected: boolean }

export const operatorsApi = {
  available: () => request<{ data: Operator[] }>('/api/v1/operators'),
  catalog: () => request<{ data: Operator[] }>('/api/v1/admin/operators'),
  create: (data: { name: string; slug: string }) =>
    mutate<{ data: Operator }>('/api/v1/admin/operators', data),
  update: (id: number, data: Partial<Pick<Operator, 'name' | 'slug' | 'is_active'>>) =>
    mutate<{ data: Operator }>(`/api/v1/admin/operators/${id}`, data, 'PATCH'),
  tenantList: (tenantId: string) =>
    request<{ data: TenantOperator[]; meta: { can_manage: boolean } }>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/operators`),
  tenantSave: (tenantId: string, ids: number[]) =>
    mutate(`/api/v1/tenants/${encodeURIComponent(tenantId)}/operators`, { operator_ids: ids }, 'PUT'),
}
