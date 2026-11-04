export type TenantRole = 'OWNER' | 'MANAGER' | 'CONSULTANT' | 'ASSISTANT'
export interface Tenant {
  id: string
  name: string
  type: 'PF' | 'PJ'
  role: TenantRole
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
  plan: { name: string | null }
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
