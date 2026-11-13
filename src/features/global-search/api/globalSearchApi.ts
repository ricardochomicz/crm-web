import { request } from '@/lib/http'

export type GlobalSearchCategory = 'clients' | 'opportunities' | 'orders'
export type GlobalSearchItem = {
  id: string
  type: GlobalSearchCategory
  title: string
  subtitle: string | null
}
export type GlobalSearchResults = Record<GlobalSearchCategory, GlobalSearchItem[]>

export const globalSearchApi = {
  search: (tenantId: string, query: string, signal?: AbortSignal) =>
    request<{ data: GlobalSearchResults }>(
      '/api/v1/tenants/' + encodeURIComponent(tenantId) + '/global-search?q=' + encodeURIComponent(query),
      { signal },
    ),
}
