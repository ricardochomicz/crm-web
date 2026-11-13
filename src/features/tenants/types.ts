export type TenantRole = 'OWNER' | 'MANAGER' | 'CONSULTANT' | 'ASSISTANT'
export interface Tenant {
  id: string
  name: string
  type: 'PF' | 'PJ'
  role: TenantRole
  access?: TenantAccess
}
export interface Page<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
}
export interface Plan {
  id: string
  name: string
  description: string | null
  monthly_price: string
  currency: string
  user_limit: number
  storage_limit_mb: number
}
export interface NewTenant {
  operator_ids: number[]
  subscription_plan_id: string
  tenant: {
    name: string
    type: 'PF' | 'PJ'
    document: string
    email: string
    phone?: string
    trade_name?: string
    timezone: string
  }
}
export interface Subscription {
  status: string
  plan: { id: string; name: string | null }
  limits: { users: number; storage_mb: number }
  usage: { users: number; reserved_invitations: number }
  remaining: { users: number }
  trial_ends_at: string | null
  allows_operational_writes: boolean
}
export const roleLabels: Record<TenantRole, string> = {
  OWNER: 'Proprietário',
  MANAGER: 'Gerente',
  CONSULTANT: 'Consultor',
  ASSISTANT: 'Assistente',
}

export interface TeamCapacity {
  limits: { users: number }
  usage: { users: number; reserved_invitations: number }
  remaining: { users: number }
}
export interface TenantAccess {
  role_name?: string | null
  permissions: string[]
  can_manage_permissions: boolean
  allows_operational_writes: boolean
  assignable_roles: Exclude<TenantRole, 'OWNER'>[]
  capacity: TeamCapacity | null
}
export function can(tenant: Tenant | undefined, permission: string): boolean {
  return tenant?.access?.permissions.includes(permission) ?? false
}
export function canViewTeam(tenant: Tenant | undefined): boolean {
  return can(tenant, 'members.view') || can(tenant, 'invitations.view')
}
export function canViewTeams(tenant: Tenant | undefined): boolean {
  return can(tenant, 'teams.view')
}

export interface CompanyDetails extends Tenant {
  logo_url?: string | null
  document: string
  trade_name: string | null
  email: string
  phone: string | null
  timezone: string
}
export type CompanyUpdate = Pick<
  CompanyDetails,
  'name' | 'trade_name' | 'email' | 'phone' | 'timezone'
>
