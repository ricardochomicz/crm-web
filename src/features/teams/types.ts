import type { TenantRole } from '@/features/tenants/types'

export interface Team {
  id: string
  name: string
  members_count: number
  supervisor: {
    membership_id: string
    user_id: number
    name: string | null
    status: 'ACTIVE' | 'SUSPENDED'
  } | null
}

export interface TeamMember {
  id: string
  user_id: number
  name: string | null
  email: string | null
  role: TenantRole
  status: 'ACTIVE' | 'SUSPENDED'
  team_id: string | null
  joined_at: string | null
}

export type TeamNotice = {
  message: string
  tone: 'success' | 'warning'
}
