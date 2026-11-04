import { mutate, request } from '@/lib/http'
import type { Page, TenantRole } from './types'
export interface PermissionDefinition {
  key: string
  group: string
  label: string
  requires: string[]
}
export interface RolePermissions {
  role: TenantRole
  protected: boolean
  permissions: string[]
  version: number
}
export interface PermissionSettings {
  catalog: PermissionDefinition[]
  roles: RolePermissions[]
  can_edit: boolean
}
export interface PermissionChange {
  id: string
  actor_name: string
  role: TenantRole
  previous_permissions: string[]
  permissions: string[]
  version: number
  created_at: string
}
const base = (id: string) => `/api/v1/tenants/${encodeURIComponent(id)}`
export const permissionsApi = {
  show: (id: string) => request<{ data: PermissionSettings }>(`${base(id)}/role-permissions`),
  update: (id: string, role: TenantRole, permissions: string[], version: number) =>
    mutate(`${base(id)}/role-permissions/${role}`, { permissions, version }, 'PUT'),
  history: (id: string, page = 1) =>
    request<Page<PermissionChange>>(`${base(id)}/permission-changes?page=${page}`),
}
