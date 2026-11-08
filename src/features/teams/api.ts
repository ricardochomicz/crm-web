import { mutate, request } from '@/lib/http'
import type { Page } from '@/features/tenants/types'
import type { Team, TeamMember } from './types'

const base = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}`

export const teamsApi = {
  list: (tenantId: string, page = 1, name = '') => {
    const params = new URLSearchParams({ page: String(page) })
    if (name.trim()) params.set('name', name.trim())
    return request<Page<Team>>(`${base(tenantId)}/teams?${params}`)
  },

  create: (tenantId: string, name: string, supervisorMembershipId: string) =>
    mutate<{ data: Pick<Team, 'id' | 'name' | 'supervisor'> }>(`${base(tenantId)}/teams`, {
      name,
      ...(supervisorMembershipId ? { supervisor_membership_id: supervisorMembershipId } : {}),
    }),

  update: (tenantId: string, teamId: string, name: string) =>
    mutate(`${base(tenantId)}/teams/${encodeURIComponent(teamId)}`, { name }, 'PATCH'),

  updateSupervisor: (tenantId: string, teamId: string, supervisorMembershipId: string) =>
    mutate(
      `${base(tenantId)}/teams/${encodeURIComponent(teamId)}/supervisor`,
      { supervisor_membership_id: supervisorMembershipId },
      'PATCH',
    ),

  assignMember: (tenantId: string, membershipId: string, teamId: string | null) =>
    mutate(`${base(tenantId)}/members/${encodeURIComponent(membershipId)}/team`, { team_id: teamId }, 'PATCH'),

  members: (tenantId: string, teamId: string, page = 1) =>
    request<Page<TeamMember>>(
      `${base(tenantId)}/teams/${encodeURIComponent(teamId)}/members?page=${page}`,
    ),
}

