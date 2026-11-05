import { mutate, request } from '@/lib/http'
import type { Page } from '@/features/tenants/types'
import type {
  AssignableRole,
  Invitation,
  InvitationResult,
  InvitationStatus,
  Member,
} from './types'
const base = (tenantId: string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}`
export const teamApi = {
  members: (tenantId: string, page = 1) =>
    request<Page<Member>>(`${base(tenantId)}/members?page=${page}`),
  invitations: (tenantId: string, page = 1, status: InvitationStatus | '' = '') => {
    const query = new URLSearchParams({ page: String(page), per_page: '20' })
    if (status) query.set('status', status)
    return request<Page<Invitation>>(`${base(tenantId)}/invitations?${query}`)
  },
  invite: (tenantId: string, email: string, role: AssignableRole) =>
    mutate<InvitationResult>(`${base(tenantId)}/invitations`, { email, role }),
  resend: (tenantId: string, id: string) =>
    mutate<InvitationResult>(`${base(tenantId)}/invitations/${encodeURIComponent(id)}/resend`),
  revoke: (tenantId: string, id: string) =>
    mutate(`${base(tenantId)}/invitations/${encodeURIComponent(id)}/revoke`),
  role: (tenantId: string, membershipId: string, role: AssignableRole) =>
    mutate(`${base(tenantId)}/members/${encodeURIComponent(membershipId)}/role`, { role }, 'PATCH'),
  remove: (tenantId: string, membershipId: string) =>
    mutate(`${base(tenantId)}/members/${encodeURIComponent(membershipId)}`, undefined, 'DELETE'),
  status: (tenantId: string, membershipId: string, status: Member['status']) =>
    mutate(
      `${base(tenantId)}/members/${encodeURIComponent(membershipId)}/status`,
      { status },
      'PATCH',
    ),
}
