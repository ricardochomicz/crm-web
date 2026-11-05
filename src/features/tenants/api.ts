import { mutate, request } from '@/lib/http'
import type {
  CompanyDetails,
  CompanyUpdate,
  NewTenant,
  Page,
  Plan,
  Subscription,
  Tenant,
} from './types'
export const tenantApi = {
  list: (page = 1) => request<Page<Tenant>>(`/api/v1/tenants?page=${page}`),
  show: (id: string) => request<{ data: Tenant }>(`/api/v1/tenants/${encodeURIComponent(id)}`),
  details: (id: string) =>
    request<{ data: CompanyDetails }>(`/api/v1/tenants/${encodeURIComponent(id)}`),
  update: (id: string, data: CompanyUpdate) =>
    mutate(`/api/v1/tenants/${encodeURIComponent(id)}`, data, 'PATCH'),
  select: (id: string) => mutate('/api/v1/active-tenant', { tenant_id: id }, 'PUT'),
  plans: () => request<{ data: Plan[] }>('/api/v1/subscription-plans'),
  create: (data: NewTenant) => mutate<{ data: Omit<Tenant, 'role'> }>('/api/v1/tenants', data),
  subscription: (id: string) =>
    request<{ data: Subscription }>(`/api/v1/tenants/${encodeURIComponent(id)}/subscription`),
}
