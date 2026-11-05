import { mutate, request } from '@/lib/http'
import type { Page } from '@/features/tenants/types'
import type { Team, TeamMember } from './types'

const base = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}`

export const teamsApi = {
  list: (tenantId: string, page = 1) =>
    request<Page<Team>>(`${base(tenantId)}/teams?page=${page}`),

  create: (tenantId: string, name: string, supervisorMembershipId: string) =>
    mutate<{ data: Pick<Team, 'id' | 'name' | 'supervisor'> }>(`${base(tenantId)}/teams`, {
      name,
      supervisor_membership_id: supervisorMembershipId,
    }),

  update: (tenantId: string, teamId: string, name: string) =>
    mutate(`${base(tenantId)}/teams/${encodeURIComponent(teamId)}`, { name }, 'PATCH'),

  updateSupervisor: (tenantId: string, teamId: string, supervisorMembershipId: string) =>
    mutate(
      `${base(tenantId)}/teams/${encodeURIComponent(teamId)}/supervisor`,
      { supervisor_membership_id: supervisorMembershipId },
      'PATCH',
    ),

  members: (tenantId: string, teamId: string, page = 1) =>
    request<Page<TeamMember>>(
      `${base(tenantId)}/teams/${encodeURIComponent(teamId)}/members?page=${page}`,
    ),
}

