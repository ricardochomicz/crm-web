import { mutate, request } from '@/lib/http'
import type { Page } from './types'
export interface UnitData {
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city?: string | null
  state?: string | null
}
export interface TenantUnit extends UnitData {
  id: string
  is_headquarters: boolean
  members_count: number
  teams_count: number
}
export interface UnitList {
  data: TenantUnit[]
  meta: {
    can_manage: boolean
  }
}
const base = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}/units`
export const unitsApi = {
  list: (id: string) => request<UnitList>(base(id)),
  create: (id: string, data: UnitData) => mutate(`${base(id)}`, data),
  update: (id: string, unitId: string, data: UnitData) =>
    mutate(`${base(id)}/${encodeURIComponent(unitId)}`, data, 'PATCH'),
  assignments: (
    id: string,
    unitId: string,
    kind: AssignmentKind,
    mode: 'linked' | 'available',
    q = '',
    page = 1,
  ) =>
    request<Page<UnitAssignment>>(
      `${base(id)}/${encodeURIComponent(unitId)}/assignments?${new URLSearchParams({ kind, mode, q, page: String(page) })}`,
    ),
  changeAssignments: (
    id: string,
    unitId: string,
    kind: AssignmentKind,
    operation: 'add' | 'remove',
    ids: string[],
  ) =>
    mutate(
      `${base(id)}/${encodeURIComponent(unitId)}/assignments`,
      { kind, operation, ids },
      'PATCH',
    ),
}
export type AssignmentKind = 'members' | 'teams'
export interface UnitAssignment {
  id: string
  name: string
  email?: string
  status?: string
  team_name?: string | null
  supervised_team_names?: string[]
  members_count?: number
  unit_name?: string | null
  removal_blocked_reason: string | null
}
