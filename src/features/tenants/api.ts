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
  list: async (page = 1): Promise<Page<Tenant>> => {
    // Laravel ResourceCollection pagina os registros em meta, não no nível raiz.
    const response = await request<{
      data: Tenant[]
      meta?: { current_page: number; last_page: number; total: number }
      current_page?: number
      last_page?: number
      total?: number
    }>(`/api/v1/tenants?page=${page}`)
    return {
      data: response.data,
      current_page: response.meta?.current_page ?? response.current_page ?? 1,
      last_page: response.meta?.last_page ?? response.last_page ?? 1,
      total: response.meta?.total ?? response.total ?? response.data.length,
    }
  },
  show: (id: string) => request<{ data: Tenant }>(`/api/v1/tenants/${encodeURIComponent(id)}`),
  details: (id: string) =>
    request<{ data: CompanyDetails }>(`/api/v1/tenants/${encodeURIComponent(id)}`),
  uploadLogo: async (id: string, file: File) => {
    const body = new FormData()
    body.append('logo', file)
    await request('/sanctum/csrf-cookie')
    return request<{ data: { logo_url: string } }>(`/api/v1/tenants/${encodeURIComponent(id)}/logo`, { method: 'POST', body })
  },
  update: (id: string, data: CompanyUpdate) =>
    mutate(`/api/v1/tenants/${encodeURIComponent(id)}`, data, 'PATCH'),
  select: (id: string) => mutate('/api/v1/active-tenant', { tenant_id: id }, 'PUT'),
  plans: () => request<{ data: Plan[] }>('/api/v1/subscription-plans'),
  create: (data: NewTenant) => mutate<{ data: Omit<Tenant, 'role'> }>('/api/v1/tenants', data),
  subscription: (id: string) =>
    request<{ data: Subscription }>(`/api/v1/tenants/${encodeURIComponent(id)}/subscription`),
}
