import type { TenantRole } from '@/features/tenants/types'
export type AssignableRole = Exclude<TenantRole, 'OWNER'>
export interface Member {
  can_manage: boolean
  id: string
  user_id: number
  name: string
  email: string
  role: TenantRole
  tenant_role_id?: string | null
  role_name?: string | null
  status: 'ACTIVE' | 'SUSPENDED'
  joined_at: string | null
}
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED'
export interface Invitation {
  id: string
  email: string
  role: AssignableRole
  tenant_role_id?: string | null
  role_name?: string | null
  status: InvitationStatus
  is_expired: boolean
  reserves_seat: boolean
  expires_at: string
  created_at: string
  accepted_at: string | null
  revoked_at: string | null
}
export interface InvitationResult {
  data: Pick<Invitation, 'id' | 'email' | 'role' | 'status' | 'expires_at'>
  meta: { notification_dispatched: boolean }
}
export interface TeamNotice {
  message: string
  tone: 'success' | 'warning'
}
export type TeamAction =
  | { kind: 'role'; member: Member }
  | { kind: 'status'; member: Member }
  | { kind: 'remove'; member: Member }
  | { kind: 'resend'; invitation: Invitation }
  | { kind: 'revoke'; invitation: Invitation }
export const assignableRoles: { value: AssignableRole; label: string }[] = [
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'CONSULTANT', label: 'Consultor' },
  { value: 'ASSISTANT', label: 'Assistente' },
]
