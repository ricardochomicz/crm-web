import { mutate, request } from '@/lib/http'
export interface UnitData {
  name: string
  email: string | null
  phone: string | null
  address: string | null
}
export interface TenantUnit extends UnitData {
  id: string
  is_headquarters: boolean
  members_count: number
  teams_count: number
  membership_ids: string[]
  team_ids: string[]
}
export interface UnitList {
  data: TenantUnit[]
  meta: {
    can_manage: boolean
    members: { id: string; name: string; status: string }[]
    teams: { id: string; name: string; tenant_unit_id: string | null }[]
  }
}
const base = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}/units`
export const unitsApi = {
  list: (id: string) => request<UnitList>(base(id)),
  create: (id: string, data: UnitData) => mutate(`${base(id)}`, data),
  update: (id: string, unitId: string, data: UnitData) =>
    mutate(`${base(id)}/${encodeURIComponent(unitId)}`, data, 'PATCH'),
  assignments: (id: string, unitId: string, membership_ids: string[], team_ids: string[]) =>
    mutate(
      `${base(id)}/${encodeURIComponent(unitId)}/assignments`,
      { membership_ids, team_ids },
      'PUT',
    ),
}
