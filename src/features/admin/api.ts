import { request } from '@/lib/http'
import type { Page } from '@/features/tenants/types'
export interface PlatformTenant {
  id: string
  name: string
  type: string
  status: string
  users_count: number
  subscription: {
    plan_name: string | null
    status: string
    allows_operational_writes: boolean
  } | null
}
export const adminApi = {
  tenants: (page: number, name: string, status: string) => {
    const query = new URLSearchParams({ page: String(page), per_page: '20' })
    if (name.trim()) query.set('name', name.trim())
    if (status) query.set('status', status)
    return request<Page<PlatformTenant>>(`/api/v1/admin/tenants?${query}`)
  },
}
