import { mutate, request } from '@/lib/http'

export const commissionRoles = {
  CONSULTANT: 'Consultor',
  SUPERVISOR: 'Supervisor',
  MANAGER: 'Gerente',
  PARTNER: 'Parceiro',
  REFERRER: 'Indicador',
} as const
export type CommissionRole = keyof typeof commissionRoles
export type CommissionParticipant = {
  role: CommissionRole
  tenant_user_id: string | null
  commercial_participant_id: string | null
  name: string
  percentage: string | null
  amount?: string | null
}
export type ParticipantInput = Pick<
  CommissionParticipant,
  'role' | 'tenant_user_id' | 'commercial_participant_id'
>
export type CommissionAmounts = {
  base_amount: string
  gross_amount: string | null
  deduction_amount: string | null
  net_amount: string | null
  participant_total: string | null
  company_balance: string | null
}
export type OrderCommission = CommissionAmounts & {
  id: string
  revision: number
  is_current: boolean
  status: string
  source: string
  reason: string | null
  created_at: string
  sold_on: string
  activated_on: string | null
  line_number: string | null
  description: string | null
  quantity: number
  issues: string[]
  participants: CommissionParticipant[]
  rules: {
    company_percentage?: string | null
    deduction_percentage?: string | null
    reference_date?: string
    participants?: CommissionParticipant[]
  }
}
export type CommissionPage = {
  data: OrderCommission[]
  meta: {
    current_page: number
    last_page: number
    total: number
    current_revision: number | null
    requires_capture: boolean
    summary: (CommissionAmounts & { status: string; item_count: number; line_count: number })[]
  }
}
export type ParticipantOptions = {
  consultant_id: string | null
  participants: (ParticipantInput & { participant_name: string | null })[]
  members: { id: string; name: string }[]
  externals: { id: string; name: string; role: CommissionRole }[]
}
const path = (tenantId: string, orderId: string) =>
  `/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-orders/${encodeURIComponent(orderId)}/commissions`
export const orderCommissionsApi = {
  list: (tenantId: string, orderId: string, page = 1, revision = '', status = '') => {
    const query = new URLSearchParams({ page: String(page), per_page: '20' })
    if (revision) query.set('revision', revision)
    if (status) query.set('status', status)
    return request<CommissionPage>(`${path(tenantId, orderId)}?${query}`)
  },
  options: (tenantId: string, orderId: string) =>
    request<{ data: ParticipantOptions }>(`${path(tenantId, orderId)}/options`),
  revise: (tenantId: string, orderId: string, reason: string, participants?: ParticipantInput[]) =>
    mutate<{ data: { order_id: string; revision: number } }>(
      `${path(tenantId, orderId)}/revisions`,
      { reason, ...(participants ? { participants } : {}) },
      'POST',
    ),
}
