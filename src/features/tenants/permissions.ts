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
export interface RoleAuditState {
  name: string
  is_active: boolean
  permissions: string[]
}
export interface PermissionChange {
  tenant_role_id: string | null
  previous_role_state: RoleAuditState | null
  role_state: RoleAuditState | null
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
  roleHistory: async (id: string, roleId: string, page = 1): Promise<Page<PermissionChange>> => {
    const result = await request<{
      data: PermissionChange[]
      meta: Omit<Page<PermissionChange>, 'data'>
    }>(`${base(id)}/permission-changes?tenant_role_id=${encodeURIComponent(roleId)}&page=${page}`)
    return { data: result.data, ...result.meta }
  },
  history: (id: string, page = 1, role?: TenantRole) =>
    request<Page<PermissionChange>>(
      `${base(id)}/permission-changes?page=${page}&role=${role ?? 'MANAGER'}`,
    ),
}
